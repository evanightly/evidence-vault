<?php

namespace App\Services\Evidence;

enum EvidenceType: string {
    case Digital = 'digital';
    case Social = 'social';

    public function folderSegment(): string {
        return match ($this) {
            self::Digital => 'Digital',
            self::Social => 'Medsos',
        };
    }

    public function filePrefix(): string {
        return match ($this) {
            self::Digital => 'digital-evidence',
            self::Social => 'medsos-evidence',
        };
    }

    public function titleForMonth(string $monthLabel): string {
        return match ($this) {
            self::Digital => sprintf('Tautan Bukti Digital %s', $monthLabel),
            self::Social => sprintf('Tautan Bukti Medsos %s', $monthLabel),
        };
    }

    public function displayLabel(): string {
        return match ($this) {
            self::Digital => 'bukti digital',
            self::Social => 'bukti medsos',
        };
    }

    public function successMessage(): string {
        return match ($this) {
            self::Digital => 'Bukti digital berhasil diunggah ke Google Drive.',
            self::Social => 'Bukti medsos berhasil diunggah ke Google Drive.',
        };
    }

    public function failureMessage(): string {
        return match ($this) {
            self::Digital => 'Gagal mengunggah bukti digital ke Google Drive. Silakan coba lagi atau konversi berkas jika masih gagal.',
            self::Social => 'Gagal mengunggah bukti medsos ke Google Drive. Silakan coba lagi atau konversi berkas jika masih gagal.',
        };
    }
}
