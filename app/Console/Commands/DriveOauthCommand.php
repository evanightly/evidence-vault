<?php

namespace App\Console\Commands;

use App\Services\Environment\EnvUpdater;
use App\Services\GoogleDrive\DriveOAuthManager;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use RuntimeException;
use Throwable;

class DriveOauthCommand extends Command {
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'drive:oauth
        {--code= : Kode verifikasi yang diberikan Google setelah proses otorisasi}
        {--update-env : Simpan refresh token baru langsung ke file .env}
        {--env-path= : Path kustom file .env yang akan diperbarui (opsional)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Membantu memperoleh atau memperbarui refresh token OAuth Google Drive.';

    /**
     * Execute the console command.
     */
    public function handle(DriveOAuthManager $manager): int {
        $code = (string) ($this->option('code') ?? '');

        if (trim($code) === '') {
            return $this->displayAuthorizationLink($manager);
        }

        try {
            $token = $manager->exchangeAuthorizationCode($code);
        } catch (RuntimeException $exception) {
            $this->error(sprintf('Gagal memproses kode otorisasi: %s', $exception->getMessage()));

            return self::FAILURE;
        }

        $refreshToken = (string) ($token['refresh_token'] ?? '');
        $accessToken = (string) ($token['access_token'] ?? '');

        $this->info('Refresh token baru berhasil dibuat.');
        $this->line(sprintf('Refresh token: %s', $refreshToken));

        if ($accessToken !== '') {
            $this->line(sprintf('Access token sementara: %s', $accessToken));
        }

        $persisted = false;

        if ((bool) $this->option('update-env')) {
            $persisted = $this->persistRefreshToken($refreshToken);
        } else {
            $this->comment('Salin nilai refresh token ke variabel LOGBOOK_DRIVE_OAUTH_REFRESH_TOKEN di file .env Anda.');
        }

        if ($persisted) {
            $this->runOptimizeClear();
        }

        return self::SUCCESS;
    }

    private function displayAuthorizationLink(DriveOAuthManager $manager): int {
        try {
            $url = $manager->createAuthorizationUrl();
        } catch (RuntimeException $exception) {
            $this->error(sprintf('Gagal menyiapkan tautan otorisasi: %s', $exception->getMessage()));

            return self::FAILURE;
        }

        $this->info('1. Buka tautan berikut di browser dan masuk dengan akun Google yang akan digunakan:');
        $this->line($url);
        $this->info('2. Setelah memberikan izin, Google akan menampilkan kode verifikasi.');
        $this->info('3. Jalankan kembali perintah ini dengan opsi --code=KODE_GOOGLE.');

        return self::SUCCESS;
    }

    private function persistRefreshToken(string $refreshToken): bool {
        $path = (string) ($this->option('env-path') ?: config('logbook.drive.env_path') ?: base_path('.env'));

        if ($path === '') {
            $this->warn('Path file .env tidak ditemukan. Melewatkan pembaruan otomatis.');

            return false;
        }

        try {
            EnvUpdater::for($path)->update([
                'LOGBOOK_DRIVE_OAUTH_REFRESH_TOKEN' => $refreshToken,
            ]);
        } catch (RuntimeException $exception) {
            $this->warn($exception->getMessage());
            $this->warn('Salin token secara manual apabila diperlukan.');

            return false;
        }

        $this->info(sprintf('Refresh token tersimpan ke %s.', $path));

        return true;
    }

    private function runOptimizeClear(): void {
        try {
            Artisan::call('optimize:clear');
            $this->info('Cache aplikasi berhasil disegarkan.');
        } catch (Throwable $exception) {
            $this->warn(sprintf('Perintah optimize:clear gagal dijalankan: %s', $exception->getMessage()));
        }
    }
}
