<?php

namespace App\Services\Logbook;

use App\Models\Logbook;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\Style\Language;

class LogbookWordExporter {
    /**
     * @var array<int, string>
     */
    private array $temporaryFiles = [];

    public function build(Logbook $logbook): string {
        $logbook->loadMissing([
            'technician',
            'work_location',
            'shift',
            'work_details',
            'evidences',
        ]);

        $phpWord = new PhpWord;
        $phpWord->setDefaultFontName('Segoe UI');
        $phpWord->setDefaultFontSize(11);
        $phpWord->getSettings()->setThemeFontLang(new Language(Language::EN_US));

        $section = $phpWord->addSection();
        $section->addTitle('Ringkasan Logbook', 1);
        $section->addTextBreak(1);

        $tableStyle = [
            'borderSize' => 6,
            'borderColor' => 'DDDDDD',
            'cellMargin' => 80,
        ];

        $phpWord->addTableStyle('DetailsTable', $tableStyle, ['borderBottomColor' => 'AAAAAA']);
        $table = $section->addTable('DetailsTable');

        $this->addDetailRow($table, 'Tanggal', optional($logbook->date)->format('d F Y'));
        $this->addDetailRow($table, 'Teknisi', optional($logbook->technician)->name);
        $this->addDetailRow($table, 'Lokasi Kerja', optional($logbook->work_location)->name);
        $this->addDetailRow($table, 'Shift', optional($logbook->shift)->name);

        $section->addTextBreak(1);
        $section->addTitle('Detail Pekerjaan', 2);

        if ($logbook->work_details->isEmpty()) {
            $section->addText('Belum ada detail pekerjaan yang dicatat.', ['italic' => true]);
        } else {
            foreach ($logbook->work_details as $index => $detail) {
                $section->addText(sprintf('%d. %s', $index + 1, Str::of($detail->description)->trim()), [], ['spaceAfter' => 80]);
            }
        }

        $section->addTextBreak(1);
        $section->addTitle('Kendala / Catatan Tambahan', 2);
        $section->addText($logbook->additional_notes ?: '—', []);

        $this->addImageSection($section, 'Foto Bukti', $logbook->evidences);

        $filePath = tempnam(sys_get_temp_dir(), 'logbook_');

        if ($filePath === false) {
            throw new \RuntimeException('Unable to create temporary file for logbook export.');
        }

        $writer = IOFactory::createWriter($phpWord, 'Word2007');
        $writer->save($filePath);

        $this->cleanupTemporaryFiles();

        return $filePath;
    }

    private function addDetailRow($table, string $label, ?string $value): void {
        $row = $table->addRow();
        $row->addCell(2400)->addText($label, ['bold' => true]);
        $row->addCell(8000)->addText($value ?: '—');
    }

    private function addImageSection($section, string $title, $collection): void {
        $section->addTextBreak(1);
        $section->addTitle($title, 2);

        if ($collection->isEmpty()) {
            $section->addText('Tidak ada gambar.', ['italic' => true]);

            return;
        }

        foreach ($collection as $item) {
            $section->addTextBreak(1);
            $section->addText(basename($item->filepath));

            $path = $this->resolveStoragePath($item->filepath);

            if (!$path) {
                $section->addText('Lampiran tidak ditemukan di penyimpanan.', ['italic' => true, 'color' => 'AA0000']);

                continue;
            }

            $section->addImage($path, [
                'width' => 480,
            ]);
        }
    }

    private function resolveStoragePath(string $relativePath): ?string {
        $disk = config('logbook.attachments_disk', 'public');
        $storage = \Illuminate\Support\Facades\Storage::disk($disk);

        if (method_exists($storage, 'path') && $storage->exists($relativePath)) {
            return $storage->path($relativePath);
        }

        if (!$storage->exists($relativePath)) {
            return null;
        }

        $temporary = tempnam(sys_get_temp_dir(), 'logbook_img_');

        if ($temporary === false) {
            return null;
        }

        $contents = $storage->get($relativePath);

        if ($contents === false) {
            return null;
        }

        file_put_contents($temporary, $contents);

        $this->temporaryFiles[] = $temporary;

        return $temporary;
    }

    private function cleanupTemporaryFiles(): void {
        foreach ($this->temporaryFiles as $path) {
            if (is_string($path) && is_file($path)) {
                @unlink($path);
            }
        }

        $this->temporaryFiles = [];
    }
}
