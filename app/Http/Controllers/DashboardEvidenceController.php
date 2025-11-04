<?php

namespace App\Http\Controllers;

use App\Events\EvidenceDriveUploadProgress;
use App\Http\Requests\Dashboard\StoreEvidenceRequest;
use App\Jobs\UploadEvidenceToDrive;
use App\Models\User;
use App\Services\Evidence\EvidenceType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

use function request;

class DashboardEvidenceController extends Controller {
    public function store(StoreEvidenceRequest $request): RedirectResponse {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(403);
        }

        $validated = $request->validated();

        $digitalFiles = $this->normaliseFiles(request()->file('digital_files', []));
        $socialFiles = $this->normaliseFiles(request()->file('social_files', []));

        $queuedTypes = [];
        $errors = [];
        $oldInput = [
            'digital_name' => $validated['digital_name'] ?? '',
            'social_name' => $validated['social_name'] ?? '',
        ];

        if ($digitalFiles !== []) {
            try {
                $storedUploads = $this->storeEvidenceFiles($user, EvidenceType::Digital, $digitalFiles);

                if ($storedUploads !== []) {
                    $this->dispatchUploadBatch(
                        $user,
                        EvidenceType::Digital,
                        $storedUploads,
                        $validated['digital_name'] ?? null,
                    );
                    $queuedTypes[] = EvidenceType::Digital;
                    $oldInput['digital_name'] = '';
                }
            } catch (Throwable $exception) {
                Log::error('Gagal mempersiapkan kumpulan bukti digital.', [
                    'user_id' => $user->getKey(),
                    'exception' => $exception,
                ]);
                $errors['digital_files'] = 'Gagal memproses berkas bukti digital. Silakan coba lagi.';
            }
        }

        if ($socialFiles !== []) {
            try {
                $storedUploads = $this->storeEvidenceFiles($user, EvidenceType::Social, $socialFiles);

                if ($storedUploads !== []) {
                    $this->dispatchUploadBatch(
                        $user,
                        EvidenceType::Social,
                        $storedUploads,
                        $validated['social_name'] ?? null,
                    );
                    $queuedTypes[] = EvidenceType::Social;
                    $oldInput['social_name'] = '';
                }
            } catch (Throwable $exception) {
                Log::error('Gagal mempersiapkan kumpulan bukti medsos.', [
                    'user_id' => $user->getKey(),
                    'exception' => $exception,
                ]);
                $errors['social_files'] = 'Gagal memproses berkas bukti medsos. Silakan coba lagi.';
            }
        }

        if ($queuedTypes === []) {
            return back()
                ->withErrors($errors ?: ['digital_files' => 'Silakan pilih minimal satu berkas untuk diunggah.'])
                ->withInput($oldInput);
        }

        $infoMessage = $this->buildQueuedMessage($queuedTypes);

        if ($errors !== []) {
            return back()
                ->withErrors($errors)
                ->with('flash.info', $infoMessage)
                ->withInput($oldInput);
        }

        return redirect()
            ->route('dashboard')
            ->with('flash.info', $infoMessage);
    }

    /**
     * @param  array<int, EvidenceType>  $queuedTypes
     */
    private function buildQueuedMessage(array $queuedTypes): string {
        if (count($queuedTypes) > 1) {
            return 'Unggahan bukti digital dan bukti medsos sedang diproses. Anda akan mendapatkan notifikasi ketika selesai.';
        }

        $label = $queuedTypes[0]->displayLabel();

        return sprintf('Unggahan %s sedang diproses. Anda akan mendapatkan notifikasi ketika selesai.', $label);
    }

    /**
     * @param  array<int, UploadedFile>  $files
     * @return array<int, array{stored_path: string, original_name: string}>
     *
     * @throws RuntimeException
     */
    private function storeEvidenceFiles(User $user, EvidenceType $type, array $files): array {
        $stored = [];

        foreach ($files as $file) {
            if (!$file instanceof UploadedFile) {
                continue;
            }

            $uploadId = (string) Str::uuid();

            try {
                $storedPath = $file->storeAs(
                    sprintf('pending-evidence/%d/%s', $user->getKey(), $type->value),
                    sprintf('%s-%s', $uploadId, $file->getClientOriginalName() ?: $file->hashName()),
                    'local',
                );
            } catch (Throwable $exception) {
                Log::error('Gagal menyimpan berkas bukti sementara.', [
                    'user_id' => $user->getKey(),
                    'type' => $type->value,
                    'file_name' => $file->getClientOriginalName(),
                    'exception' => $exception,
                ]);

                foreach ($stored as $item) {
                    Storage::disk('local')->delete($item['stored_path']);
                }

                throw new RuntimeException('Gagal menyimpan berkas bukti sementara.', 0, $exception);
            }

            $stored[] = [
                'stored_path' => $storedPath,
                'original_name' => $file->getClientOriginalName() ?: $file->getFilename(),
            ];
        }

        return $stored;
    }

    /**
     * @param  array<int, array{stored_path: string, original_name: string}>  $uploads
     */
    private function dispatchUploadBatch(User $user, EvidenceType $type, array $uploads, ?string $customName): void {
        $batchId = (string) Str::uuid();

        UploadEvidenceToDrive::dispatch(
            userId: $user->getKey(),
            type: $type,
            disk: 'local',
            uploads: $uploads,
            customName: $this->normaliseName($customName),
            uploadId: $batchId,
        )->afterCommit();

        $queuedMessage = count($uploads) > 1
            ? sprintf('%d berkas %s masuk antrian unggah…', count($uploads), $type->displayLabel())
            : ucfirst($type->displayLabel()) . ' masuk antrian unggah…';

        event(new EvidenceDriveUploadProgress(
            userId: $user->getKey(),
            uploadId: $batchId,
            type: $type,
            status: 'queued',
            message: $queuedMessage,
            progress: 0,
            extra: [
                'total' => count($uploads),
            ],
        ));
    }

    /**
     * @param  UploadedFile|array<int, UploadedFile>|null  $files
     * @return array<int, UploadedFile>
     */
    private function normaliseFiles($files): array {
        if ($files === null) {
            return [];
        }

        if ($files instanceof UploadedFile) {
            return [$files];
        }

        return array_values(array_filter($files, static fn ($file) => $file instanceof UploadedFile));
    }

    private function normaliseName(?string $name): ?string {
        if ($name === null) {
            return null;
        }

        $trimmed = trim($name);

        return $trimmed === '' ? null : $trimmed;
    }
}
