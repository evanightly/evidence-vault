<?php

namespace App\Services\Logbook;

use App\Models\Logbook;
use App\Services\GoogleDrive\DriveClient;
use Google\Service\Drive\DriveFile;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use RuntimeException;

class LogbookDrivePublisher {
    public function __construct(
        private readonly DriveClient $driveClient,
    ) {}

    public function isEnabled(): bool {
        return $this->driveClient->isEnabled();
    }

    /**
     * @param  callable(string $stage, string $message, int $progress, array $context): void|null  $progressCallback
     */
    public function publish(Logbook $logbook, ?callable $progressCallback = null): void {
        if (!$this->isEnabled()) {
            return;
        }

        $logbook->loadMissing([
            'technician',
            'work_location',
            'shift',
            'work_details',
            'evidences',
        ]);

        $this->notifyProgress($progressCallback, 'preparing_folders', 'Menyiapkan folder Google Drive...', 10);

        $folderContext = $this->prepareTargetFolders($logbook);

        $this->notifyProgress($progressCallback, 'preparing_folders', 'Folder Google Drive siap.', 15, [
            'folder_id' => $folderContext['folder']->getId(),
        ]);

        $uploadedCount = $this->uploadEvidenceAttachments($logbook, $folderContext['folder'], $progressCallback);

        $this->notifyProgress($progressCallback, 'updating_logbook', 'Memperbarui data logbook...', 80, [
            'uploaded' => $uploadedCount,
        ]);

        $logbook->forceFill([
            'drive_folder_id' => $folderContext['folder']->getId(),
            'drive_folder_url' => $folderContext['folder']->getWebViewLink(),
            'drive_published_at' => now(),
        ])->save();

        $this->notifyProgress($progressCallback, 'generating_spreadsheet', 'Memproses laporan Excel...', 90);

        $this->generateMonthlySpreadsheet($logbook, $folderContext['root']);

        $this->notifyProgress($progressCallback, 'generating_spreadsheet', 'Laporan Excel diperbarui.', 95);
    }

    /**
     * @return array{root: DriveFile, bukti: DriveFile, month: DriveFile, folder: DriveFile}
     */
    private function prepareTargetFolders(Logbook $logbook): array {
        $root = $this->driveClient->ensureRootFolder();
        $buktiFolder = $this->driveClient->ensureChildFolder($root->getId(), 'Bukti Laporan', true);

        $date = $logbook->date?->copy() ?? now();
        $monthLabel = $date->locale('id')->translatedFormat('F Y');
        $monthFolder = $this->driveClient->ensureChildFolder($buktiFolder->getId(), $monthLabel, true);

        $technicianName = $logbook->technician?->name ?: 'Tanpa Nama';
        $folderName = $this->driveClient->sanitiseFolderSegment($technicianName);
        $userFolder = $this->driveClient->ensureChildFolder($monthFolder->getId(), $folderName, true);

        // Ensure the folder remains publicly accessible even if it already existed.
        $this->driveClient->setPubliclyReadable($userFolder->getId());

        return [
            'root' => $root,
            'bukti' => $buktiFolder,
            'month' => $monthFolder,
            'folder' => $userFolder,
        ];
    }

    /**
     * @param  callable(string, string, int, array): void|null  $progressCallback
     */
    private function uploadEvidenceAttachments(Logbook $logbook, DriveFile $parentFolder, ?callable $progressCallback): int {
        $evidences = $logbook->evidences ?? collect();

        if ($evidences->isEmpty()) {
            $this->notifyProgress($progressCallback, 'uploading_evidence', 'Tidak ada bukti kegiatan yang perlu diunggah.', 20);

            return 0;
        }

        $disk = config('logbook.attachments_disk', 'public');
        /** @var FilesystemAdapter $storage */
        $storage = Storage::disk($disk);

        $total = max(1, $evidences->count());
        $uploaded = 0;

        $this->notifyProgress($progressCallback, 'uploading_evidence', sprintf('Mengunggah %d bukti kegiatan...', $evidences->count()), 20);

        foreach ($evidences as $index => $attachment) {
            if (!isset($attachment->filepath)) {
                continue;
            }

            if (!$storage->exists($attachment->filepath)) {
                continue;
            }

            [$filePath, $isTemporary] = $this->resolveAttachmentPath($attachment->filepath, $storage);

            if (!$filePath) {
                continue;
            }

            $fileName = $this->buildEvidenceFileName($logbook, (string) $attachment->filepath, $uploaded + 1);

            try {
                $uploadedFile = $this->driveClient->uploadFile(
                    $parentFolder->getId(),
                    $fileName,
                    $storage->mimeType($attachment->filepath) ?? 'application/octet-stream',
                    $filePath,
                );

                $this->driveClient->setPubliclyReadable($uploadedFile->getId());
                $uploaded++;
            } finally {
                if ($isTemporary && $filePath && is_file($filePath)) {
                    @unlink($filePath);
                }
            }

            $progress = 20 + (int) floor((($index + 1) / $total) * 50);
            $this->notifyProgress($progressCallback, 'uploading_evidence', sprintf('Mengunggah bukti kegiatan (%d/%d)...', $uploaded, $total), min($progress, 70));
        }

        return $uploaded;
    }

    private function buildEvidenceFileName(Logbook $logbook, string $originalPath, int $sequence): string {
        $baseName = pathinfo($originalPath, PATHINFO_FILENAME);
        $extension = pathinfo($originalPath, PATHINFO_EXTENSION);

        $datePrefix = $logbook->date?->format('Ymd') ?? now()->format('Ymd');
        $slug = Str::of($baseName)->squish()->replaceMatches('/[^\pL\pN-]/u', '-')->lower();
        $sanitisedSlug = $slug->isEmpty() ? 'bukti' : (string) $slug;

        $fileName = sprintf('%s-%s-%03d', $datePrefix, $sanitisedSlug, $sequence);

        if ($extension !== '') {
            $fileName .= '.' . strtolower($extension);
        }

        return $fileName;
    }

    private function generateMonthlySpreadsheet(Logbook $logbook, DriveFile $rootFolder): void {
        $date = $logbook->date?->copy() ?? now();
        $startOfMonth = $date->copy()->startOfMonth();
        $endOfMonth = $date->copy()->endOfMonth();

        $logbooks = Logbook::query()
            ->with(['technician', 'work_location', 'shift', 'work_details'])
            ->whereBetween('date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
            ->orderByRaw('COALESCE(drive_published_at, updated_at, created_at) asc')
            ->orderBy('date')
            ->orderBy('technician_id')
            ->get();

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();

        $headers = [
            'Diunggah Pada',
            'Tanggal Logbook',
            'Nama Karyawan',
            'Link Folder Bukti',
            'Lokasi Kerja',
            'Shift',
            'Detail Pekerjaan',
            'Kendala / Catatan Tambahan',
        ];

        $sheet->fromArray($headers, null, 'A1');
        $sheet->getStyle('A1:H1')->getFont()->setBold(true);

        $currentRow = 2;

        foreach ($logbooks as $item) {
            $sheet->setCellValue('A' . $currentRow, optional($item->drive_published_at)->format('d/m/Y H:i:s') ?? optional($item->created_at)->format('d/m/Y H:i:s'));
            $sheet->setCellValue('B' . $currentRow, optional($item->date)->format('d/m/Y'));
            $sheet->setCellValue('C' . $currentRow, $item->technician->name ?? '—');
            $folderUrl = $item->drive_folder_url;

            if ($folderUrl) {
                $sheet->setCellValue('D' . $currentRow, $folderUrl);
                $sheet->getCell('D' . $currentRow)->getHyperlink()->setUrl($folderUrl)->setTooltip('Buka folder bukti di Google Drive');
                $sheet->getStyle('D' . $currentRow)->applyFromArray([
                    'font' => [
                        'color' => ['argb' => Color::COLOR_BLUE],
                        'underline' => Font::UNDERLINE_SINGLE,
                    ],
                ]);
            } else {
                $sheet->setCellValue('D' . $currentRow, '');
            }
            $sheet->setCellValue('E' . $currentRow, $item->work_location->name ?? '—');

            $shiftName = $item->shift?->name;
            $startLabel = optional($item->shift?->start_time)->format('H:i');
            $endLabel = optional($item->shift?->end_time)->format('H:i');
            $rangeLabel = ($startLabel && $endLabel) ? sprintf('%s - %s', $startLabel, $endLabel) : null;

            if ($rangeLabel) {
                $shiftName = $shiftName
                    ? sprintf('%s (%s)', $shiftName, $rangeLabel)
                    : $rangeLabel;
            }

            $sheet->setCellValue('F' . $currentRow, $shiftName ?: '—');

            $workDetails = $item->work_details
                ->map(fn ($detail) => trim((string) $detail->description))
                ->filter(fn ($detail) => $detail !== '')
                ->values()
                ->all();

            $sheet->setCellValue('G' . $currentRow, implode("\n", $workDetails));
            $sheet->setCellValue('H' . $currentRow, $item->additional_notes ?? '');

            $sheet->getStyle('A' . $currentRow)->getAlignment()->setWrapText(true);
            $sheet->getStyle('G' . $currentRow)->getAlignment()->setWrapText(true);
            $sheet->getStyle('H' . $currentRow)->getAlignment()->setWrapText(true);

            $currentRow++;
        }

        foreach (range('A', 'H') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $temporaryPath = tempnam(sys_get_temp_dir(), 'logbook_report_');

        if ($temporaryPath === false) {
            throw new RuntimeException('Gagal membuat berkas sementara untuk laporan Excel.');
        }

        try {
            $writer->save($temporaryPath);
        } finally {
            $spreadsheet->disconnectWorksheets();
        }

        $reportsFolder = $this->driveClient->ensureChildFolder($rootFolder->getId(), 'Laporan Bulanan', true);
        $fileName = $date->locale('id')->translatedFormat('F Y') . '.xlsx';

        $reportFile = $this->driveClient->uploadOrReplaceFile(
            $reportsFolder->getId(),
            $fileName,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            $temporaryPath,
        );

        $this->driveClient->setPubliclyReadable($reportFile->getId());

        @unlink($temporaryPath);
    }

    private function notifyProgress(?callable $callback, string $stage, string $message, int $progress, array $context = []): void {
        if ($callback === null) {
            return;
        }

        $callback($stage, $message, $progress, $context);
    }

    /**
     * @return array{0: ?string, 1: bool}
     */
    private function resolveAttachmentPath(string $relativePath, FilesystemAdapter $storage): array {
        if (method_exists($storage, 'path')) {
            $path = $storage->path($relativePath);

            if ($path && is_file($path)) {
                return [$path, false];
            }
        }

        $contents = $storage->get($relativePath);

        if ($contents === false) {
            return [null, false];
        }

        $temporary = tempnam(sys_get_temp_dir(), 'logbook_upload_');

        if ($temporary === false) {
            return [null, false];
        }

        file_put_contents($temporary, $contents);

        return [$temporary, true];
    }
}
