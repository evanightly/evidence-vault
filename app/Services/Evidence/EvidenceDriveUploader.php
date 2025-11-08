<?php

namespace App\Services\Evidence;

use App\Models\User;
use App\Services\GoogleDrive\DriveClient;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use RuntimeException;

class EvidenceDriveUploader {
    private const QUARTER_MONTH_NAMES = [
        1 => ['Januari', 'Februari', 'Maret'],
        2 => ['April', 'Mei', 'Juni'],
        3 => ['Juli', 'Agustus', 'September'],
        4 => ['Oktober', 'November', 'Desember'],
    ];

    public function __construct(
        private readonly DriveClient $driveClient,
    ) {}

    public function upload(User $user, UploadedFile $file, EvidenceType $type, ?string $customName = null): EvidenceDriveUploadResult {
        if (!$this->driveClient->isEnabled()) {
            throw new RuntimeException('Integrasi Google Drive sedang dinonaktifkan.');
        }

        $now = Carbon::now();
        $monthLabel = $now->copy()->locale('id')->translatedFormat('F Y');
        $quarterSegment = $this->resolveQuarterSegment($now);

        $employeeName = $this->driveClient->sanitiseFolderSegment($user->name ?? 'Tanpa Nama');

        $segments = [
            'Evidence',
            $quarterSegment,
            $employeeName,
            $type->folderSegment(),
        ];

        $folder = $this->driveClient->ensureFolderPath($segments);

        $fileName = $this->buildFileName($file, $type, $customName, $now);

        $temporaryPath = $file->getRealPath();

        if ($temporaryPath === false) {
            throw new RuntimeException('Berkas unggahan tidak dapat diakses untuk dikirim ke Google Drive.');
        }

        $mimeType = $file->getMimeType() ?? 'application/octet-stream';

        $driveFile = $this->driveClient->uploadFile(
            $folder->getId(),
            $fileName,
            $mimeType,
            $temporaryPath,
        );

        $this->driveClient->setPubliclyReadable($driveFile->getId());

        return new EvidenceDriveUploadResult(
            type: $type,
            month_label: $monthLabel,
            folder_url: (string) $folder->getWebViewLink(),
            file_url: (string) $driveFile->getWebViewLink(),
            file_name: $fileName,
        );
    }

    private function buildFileName(UploadedFile $file, EvidenceType $type, ?string $customName, Carbon $now): string {
        $baseName = $customName !== null && trim($customName) !== ''
            ? $customName
            : pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);

        $sanitised = Str::of($baseName ?? '')
            ->squish()
            ->replaceMatches('/[\s]+/u', '-')
            ->replaceMatches('/[^\pL\pN-]/u', '')
            ->replaceMatches('/-+/', '-')
            ->trim('-')
            ->lower();

        if ($sanitised->isEmpty()) {
            $sanitised = Str::of($type->filePrefix());
        }

        $timestamp = $now->copy()->timezone('UTC')->format('YmdHis');
        $extension = strtolower($file->getClientOriginalExtension() ?: '');
        $fileBase = (string) $sanitised->limit(80, '') ?: $type->filePrefix();
        $fileBaseWithTimestamp = sprintf('%s-%s', $fileBase, $timestamp);

        return $extension !== ''
            ? sprintf('%s.%s', $fileBaseWithTimestamp, $extension)
            : $fileBaseWithTimestamp;
    }

    private function resolveQuarterSegment(Carbon $date): string {
        $quarter = max(1, min(4, $date->quarter));
        $months = self::QUARTER_MONTH_NAMES[$quarter] ?? [];
        $monthList = implode(' ', $months);

        $label = sprintf('Triwulan %d - %d (%s)', $quarter, $date->year, $monthList);

        return $this->driveClient->sanitiseFolderSegment($label);
    }
}
