<?php

namespace App\Jobs;

use App\Events\EvidenceDriveUploadProgress;
use App\Models\DigitalEvidence;
use App\Models\SocialMediaEvidence;
use App\Models\User;
use App\Services\Evidence\EvidenceDriveUploader;
use App\Services\Evidence\EvidenceType;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Http\UploadedFile;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class UploadEvidenceToDrive implements ShouldQueue {
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $timeout = 120;

    /**
     * @param  array<int, array{stored_path: string, original_name: string}>  $uploads
     */
    public function __construct(
        public int $userId,
        public EvidenceType $type,
        public string $disk,
        public array $uploads,
        public ?string $customName,
        public string $uploadId,
    ) {}

    public function handle(EvidenceDriveUploader $uploader): void {
        $user = User::query()->find($this->userId);

        if (!$user) {
            $this->broadcastProgress('failed', 'Pengguna tidak ditemukan. Unggah bukti dibatalkan.', 100);

            return;
        }

        if ($this->uploads === []) {
            $this->broadcastProgress('failed', 'Tidak ada berkas yang ditemukan untuk diunggah.', 100);

            return;
        }

        $storage = Storage::disk($this->disk);
        $totalFiles = count($this->uploads);
        $results = [];

        $this->broadcastProgress('started', sprintf('Memulai unggahan %d %s…', $totalFiles, $this->type->displayLabel()), 5, [
            'total' => $totalFiles,
        ]);

        try {
            foreach ($this->uploads as $index => $upload) {
                $storedPath = $upload['stored_path'];
                $originalName = $upload['original_name'];

                if (!$storage->exists($storedPath)) {
                    throw new RuntimeException('Berkas sementara tidak ditemukan.');
                }

                $absolutePath = $storage->path($storedPath);

                if (!is_file($absolutePath)) {
                    throw new RuntimeException('Gagal mengakses berkas sementara.');
                }

                $temporaryConversionPath = null;

                try {
                    [$uploadPath, $uploadName] = $this->prepareUploadFile($absolutePath, $originalName, $temporaryConversionPath);

                    $mimeType = mime_content_type($uploadPath) ?: 'application/octet-stream';

                    $uploadedFile = new UploadedFile($uploadPath, $uploadName, $mimeType, null, true);

                    $progressValue = $this->progressValue($index, $totalFiles, 'uploading');

                    $this->broadcastProgress('progress', sprintf('Mengunggah berkas %d dari %d…', $index + 1, $totalFiles), $progressValue);

                    $displayName = $this->determineDisplayName($this->customName, $originalName, $index, $totalFiles);

                    $result = $uploader->upload($user, $uploadedFile, $this->type, $displayName);

                    $this->persistResult($result->file_url, $result->file_name, $user->getKey(), $displayName);

                    $resultPayload = $result->toFlashPayload();
                    $resultKey = Str::of($result->employee_name)->lower() . '|' . Str::of($result->month_label)->lower();

                    $results[(string) $resultKey] = $resultPayload;

                    $this->broadcastProgress('progress', sprintf('Berkas %d dari %d selesai diunggah.', $index + 1, $totalFiles), $this->progressValue($index, $totalFiles, 'completed'));
                } finally {
                    if ($temporaryConversionPath && is_file($temporaryConversionPath)) {
                        @unlink($temporaryConversionPath);
                    }

                    $storage->delete($storedPath);
                }
            }

            $successMessage = $totalFiles > 1
                ? sprintf('%d %s berhasil diunggah ke Google Drive.', $totalFiles, $this->type->displayLabel())
                : $this->type->successMessage();

            $this->broadcastProgress('completed', $successMessage, 100, [
                'results' => array_values($results),
            ]);
        } catch (Throwable $exception) {
            $this->broadcastProgress('failed', $this->type->failureMessage(), 100, [
                'error' => $exception->getMessage(),
            ]);

            Log::error('Gagal mengunggah bukti ke Google Drive.', [
                'user_id' => $user->getKey(),
                'type' => $this->type->value,
                'message' => $exception->getMessage(),
            ]);

            throw $exception;
        }
    }

    private function prepareUploadFile(string $path, string $originalName, ?string &$temporaryConversionPath = null): array {
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

        if ($extension !== 'webp' || !function_exists('imagecreatefromwebp')) {
            return [$path, $originalName ?: basename($path)];
        }

        $image = @imagecreatefromwebp($path);

        if ($image === false) {
            return [$path, $originalName ?: basename($path)];
        }

        $converted = tempnam(sys_get_temp_dir(), 'evidence_upload_');

        if ($converted === false) {
            return [$path, $originalName ?: basename($path)];
        }

        $convertedName = Str::replaceLast('.webp', '.png', $originalName ?: basename($path)) ?: 'converted.png';

        if (!imagepng($image, $converted)) {
            imagedestroy($image);

            return [$path, $originalName ?: basename($path)];
        }

        imagedestroy($image);

        $temporaryConversionPath = $converted;

        return [$converted, $convertedName];
    }

    private function persistResult(string $fileUrl, string $storedFilename, int $userId, ?string $displayName): void {
        $finalName = $displayName;

        if ($finalName === null || trim($finalName) === '') {
            $finalName = pathinfo($storedFilename, PATHINFO_FILENAME) ?: $storedFilename;
        }

        $modelClass = $this->type === EvidenceType::Digital
            ? DigitalEvidence::class
            : SocialMediaEvidence::class;

        $modelClass::query()->create([
            'name' => $finalName,
            'filepath' => $fileUrl,
            'user_id' => $userId,
        ]);
    }

    private function broadcastProgress(string $status, string $message, int $progress = 0, array $extra = []): void {
        event(new EvidenceDriveUploadProgress(
            userId: $this->userId,
            uploadId: $this->uploadId,
            type: $this->type,
            status: $status,
            message: $message,
            progress: $progress,
            extra: $extra,
        ));
    }

    private function determineDisplayName(?string $baseName, string $originalName, int $index, int $total): ?string {
        if ($baseName === null || trim($baseName) === '') {
            return pathinfo($originalName, PATHINFO_FILENAME) ?: null;
        }

        if ($total <= 1 || $index === 0) {
            return $baseName;
        }

        return sprintf('%s #%d', $baseName, $index + 1);
    }

    private function progressValue(int $index, int $total, string $phase): int {
        if ($total <= 0) {
            return 0;
        }

        $base = (int) floor((($index) / $total) * 70) + 10;

        return min(99, $phase === 'completed' ? $base + (int) floor(70 / max(1, $total)) : $base);
    }
}
