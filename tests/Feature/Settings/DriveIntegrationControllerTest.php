<?php

use App\Models\User;
use App\Services\GoogleDrive\DriveOAuthManager;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\mock;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('menampilkan halaman integrasi drive dengan data otorisasi', function () {
    $user = User::factory()->superAdmin()->createOne();

    config()->set('logbook.drive.enabled', true);
    config()->set('logbook.drive.oauth_refresh_token', 'token-terkini');

    $manager = mock(DriveOAuthManager::class);
    $manager->shouldReceive('hasConfiguredCredentials')
        ->once()
        ->andReturn(true);
    $manager->shouldReceive('createAuthorizationUrl')
        ->once()
        ->andReturn('https://contoh.test/auth');

    $this->actingAs($user)
        ->get('/settings/drive')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/drive-integration')
            ->where('authorization_url', 'https://contoh.test/auth')
            ->where('credentials_ready', true)
            ->where('drive_enabled', true)
            ->where('has_refresh_token', true)
            ->where('feedback', [])
        );
});

test('gagal menyimpan token ketika kode tidak valid', function () {
    $user = User::factory()->superAdmin()->createOne();

    $envPath = tempnam(sys_get_temp_dir(), 'drive_env_');

    if ($envPath === false) {
        $this->markTestSkipped('Tidak dapat membuat berkas sementara.');
    }

    config()->set('logbook.drive.env_path', $envPath);

    $manager = mock(DriveOAuthManager::class);
    $manager->shouldReceive('hasConfiguredCredentials')
        ->once()
        ->andReturn(true);
    $manager->shouldReceive('exchangeAuthorizationCode')
        ->once()
        ->with('kode-salah')
        ->andThrow(new RuntimeException('Kode tidak valid.'));

    $this->actingAs($user)
        ->from('/settings/drive')
        ->post('/settings/drive/token', ['code' => 'kode-salah'])
        ->assertRedirect('/settings/drive')
        ->assertSessionHas('drive_oauth.error', 'Kode tidak valid.');

    @unlink($envPath);
});

test('menyimpan refresh token dan membersihkan cache', function () {
    $user = User::factory()->superAdmin()->createOne();
    $temporaryEnv = tempnam(sys_get_temp_dir(), 'drive_env_');

    if ($temporaryEnv === false) {
        $this->markTestSkipped('Tidak dapat membuat berkas sementara.');
    }

    file_put_contents($temporaryEnv, "LAINNYA=1\n");

    config()->set('logbook.drive.env_path', $temporaryEnv);

    $manager = mock(DriveOAuthManager::class);
    $manager->shouldReceive('hasConfiguredCredentials')
        ->once()
        ->andReturn(true);
    $manager->shouldReceive('exchangeAuthorizationCode')
        ->once()
        ->with('kode-valid')
        ->andReturn([
            'refresh_token' => 'token-baru',
        ]);

    Artisan::shouldReceive('call')
        ->once()
        ->with('optimize:clear');

    $this->actingAs($user)
        ->from('/settings/drive')
        ->post('/settings/drive/token', ['code' => 'kode-valid'])
        ->assertRedirect('/settings/drive')
        ->assertSessionHas('drive_oauth.success', 'Refresh token Google Drive berhasil diperbarui.');

    $updated = file_get_contents($temporaryEnv);

    expect($updated)->toBeString();
    expect(Str::contains($updated, 'LOGBOOK_DRIVE_OAUTH_REFRESH_TOKEN="token-baru"'))->toBeTrue();

    @unlink($temporaryEnv);
});

test('pengguna non super admin tidak dapat mengakses halaman integrasi drive', function (User $user) {
    $this->actingAs($user)
        ->get('/settings/drive')
        ->assertForbidden();
})->with([
    'admin' => fn () => User::factory()->admin()->createOne(),
    'employee' => fn () => User::factory()->createOne(),
]);

test('pengguna non super admin tidak dapat menyimpan token drive', function (User $user) {
    $this->actingAs($user)
        ->post('/settings/drive/token', ['code' => 'kode-apa-saja'])
        ->assertForbidden();
})->with([
    'admin' => fn () => User::factory()->admin()->createOne(),
    'employee' => fn () => User::factory()->createOne(),
]);
