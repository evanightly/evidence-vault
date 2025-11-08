<?php

namespace App\Services\GoogleDrive;

use Closure;
use Google\Client;
use Google\Service\Drive;
use Illuminate\Support\Arr;
use RuntimeException;

class DriveOAuthManager {
    public function __construct(
        private readonly ?Closure $clientFactory = null,
    ) {}

    public function hasConfiguredCredentials(): bool {
        $config = $this->config();

        return filled(Arr::get($config, 'oauth_client_id'))
            && filled(Arr::get($config, 'oauth_client_secret'));
    }

    public function createAuthorizationUrl(): string {
        $client = $this->prepareClient();

        return $client->createAuthUrl();
    }

    /**
     * @return array<string, mixed>
     */
    public function exchangeAuthorizationCode(string $code): array {
        if (trim($code) === '') {
            throw new RuntimeException('Kode otorisasi tidak boleh kosong.');
        }

        $client = $this->prepareClient();

        $token = $client->fetchAccessTokenWithAuthCode($code);

        if (array_key_exists('error', $token)) {
            $message = $token['error_description'] ?? $token['error'] ?? 'unknown_error';

            throw new RuntimeException(sprintf('Gagal mendapatkan token: %s', $message));
        }

        if (!array_key_exists('refresh_token', $token) || trim((string) $token['refresh_token']) === '') {
            throw new RuntimeException('Google tidak mengembalikan refresh token. Pastikan Anda menyetujui akses penuh Drive.');
        }

        return $token;
    }

    private function prepareClient(): Client {
        $config = $this->config();

        $clientId = Arr::get($config, 'oauth_client_id');
        $clientSecret = Arr::get($config, 'oauth_client_secret');

        if (!$clientId || !$clientSecret) {
            throw new RuntimeException('Client ID dan Client Secret OAuth Google Drive belum dikonfigurasi. Periksa file .env Anda.');
        }

        $client = $this->makeClient();
        $client->setClientId($clientId);
        $client->setClientSecret($clientSecret);
        $client->setRedirectUri('urn:ietf:wg:oauth:2.0:oob');
        $client->setScopes([Drive::DRIVE]);
        $client->setAccessType('offline');
        $client->setPrompt('consent');

        return $client;
    }

    private function makeClient(): Client {
        $factory = $this->clientFactory ?? static fn (): Client => new Client;
        $client = $factory();

        if (!$client instanceof Client) {
            throw new RuntimeException('Factory Google Client tidak valid.');
        }

        return $client;
    }

    /**
     * @return array<string, mixed>
     */
    private function config(): array {
        return config('logbook.drive', []);
    }
}
