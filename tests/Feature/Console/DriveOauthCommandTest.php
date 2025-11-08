<?php

use App\Services\GoogleDrive\DriveOAuthManager;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

use function Pest\Laravel\mock;

it('menampilkan tautan otorisasi ketika kode tidak diberikan', function () {
    mock(DriveOAuthManager::class)
        ->shouldReceive('createAuthorizationUrl')
        ->once()
        ->andReturn('https://contoh.test/auth');

    $this->artisan('drive:oauth')
        ->expectsOutput('1. Buka tautan berikut di browser dan masuk dengan akun Google yang akan digunakan:')
        ->expectsOutput('https://contoh.test/auth')
        ->expectsOutput('2. Setelah memberikan izin, Google akan menampilkan kode verifikasi.')
        ->expectsOutput('3. Jalankan kembali perintah ini dengan opsi --code=KODE_GOOGLE.')
        ->assertExitCode(Command::SUCCESS);
});

it('menyimpan refresh token ke file env kustom', function () {
    $temporaryEnv = tempnam(sys_get_temp_dir(), 'drive_oauth_env_');

    if ($temporaryEnv === false) {
        $this->markTestSkipped('Tidak dapat membuat berkas sementara.');
    }

    file_put_contents($temporaryEnv, "LOGBOOK_DRIVE_OAUTH_REFRESH_TOKEN=\"lama\"\nLAINNYA=1\n");

    mock(DriveOAuthManager::class)
        ->shouldReceive('exchangeAuthorizationCode')
        ->once()
        ->with('verifikasi')
        ->andReturn([
            'refresh_token' => 'token-baru',
            'access_token' => 'akses-baru',
        ]);

    $this->artisan('drive:oauth', [
        '--code' => 'verifikasi',
        '--update-env' => true,
        '--env-path' => $temporaryEnv,
    ])
        ->expectsOutput('Cache aplikasi berhasil disegarkan.')
        ->assertExitCode(Command::SUCCESS);

    $updated = file_get_contents($temporaryEnv);

    expect($updated)->toBeString();
    expect(Str::contains($updated, 'LOGBOOK_DRIVE_OAUTH_REFRESH_TOKEN="token-baru"'))->toBeTrue();
});

it('menangani kegagalan pertukaran kode', function () {
    mock(DriveOAuthManager::class)
        ->shouldReceive('exchangeAuthorizationCode')
        ->once()
        ->with('salah')
        ->andThrow(new \RuntimeException('Kode tidak valid.'));

    $this->artisan('drive:oauth', ['--code' => 'salah'])
        ->expectsOutput('Gagal memproses kode otorisasi: Kode tidak valid.')
        ->assertExitCode(Command::FAILURE);
});
