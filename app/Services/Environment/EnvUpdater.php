<?php

namespace App\Services\Environment;

use RuntimeException;

class EnvUpdater {
    public function __construct(
        private readonly string $path,
    ) {}

    public static function for(?string $path = null): self {
        return new self($path ?: base_path('.env'));
    }

    /**
     * @param  array<string, string>  $values
     */
    public function update(array $values): void {
        if ($values === []) {
            return;
        }

        $directory = dirname($this->path);

        if (!is_dir($directory)) {
            throw new RuntimeException(sprintf('Direktori untuk file .env tidak ditemukan: %s', $directory));
        }

        $contents = is_file($this->path) ? file_get_contents($this->path) : '';

        if ($contents === false) {
            throw new RuntimeException(sprintf('Gagal membaca file .env pada %s.', $this->path));
        }

        foreach ($values as $key => $value) {
            $contents = $this->replaceOrAppendLine($contents, $key, $value);
        }

        if (file_put_contents($this->path, $contents, LOCK_EX) === false) {
            throw new RuntimeException(sprintf('Gagal menulis pembaruan ke file .env pada %s.', $this->path));
        }
    }

    public function path(): string {
        return $this->path;
    }

    private function replaceOrAppendLine(string $contents, string $key, string $value): string {
        $escapedValue = str_replace('"', '\"', $value);
        $line = sprintf('%s="%s"', $key, $escapedValue);
        $pattern = '/^' . preg_quote($key, '/') . '=.*/m';

        if ($contents === '') {
            return $line . PHP_EOL;
        }

        if (preg_match($pattern, $contents) === 1) {
            $updated = preg_replace($pattern, $line, $contents);

            if ($updated === null) {
                throw new RuntimeException(sprintf('Gagal memperbarui nilai %s di file .env.', $key));
            }

            return $updated;
        }

        return rtrim($contents) . PHP_EOL . $line . PHP_EOL;
    }
}
