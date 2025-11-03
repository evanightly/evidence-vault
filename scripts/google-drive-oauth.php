<?php

use Google\Client;
use Google\Service\Drive;

require __DIR__ . '/../vendor/autoload.php';

$clientId = getenv('LOGBOOK_DRIVE_OAUTH_CLIENT_ID') ?: null;
$clientSecret = getenv('LOGBOOK_DRIVE_OAUTH_CLIENT_SECRET') ?: null;

if (!$clientId) {
    fwrite(STDOUT, 'Masukkan OAuth Client ID: ');
    $clientId = trim(fgets(STDIN) ?: '');
}

if (!$clientSecret) {
    fwrite(STDOUT, 'Masukkan OAuth Client Secret: ');
    $clientSecret = trim(fgets(STDIN) ?: '');
}

if ($clientId === '' || $clientSecret === '') {
    fwrite(STDERR, "Client ID dan Client Secret wajib diisi.\n");
    exit(1);
}

$client = new Client;
$client->setClientId($clientId);
$client->setClientSecret($clientSecret);
$client->setRedirectUri('urn:ietf:wg:oauth:2.0:oob');
$client->setScopes([Drive::DRIVE]);
$client->setAccessType('offline');
$client->setPrompt('consent');

$authorizationCode = $argv[1] ?? null;

if ($authorizationCode === null) {
    fwrite(STDOUT, "Buka URL berikut di browser Anda, kemudian salin kode yang diberikan dan jalankan ulang skrip ini dengan kode tersebut sebagai argumen:\n\n" .
        $client->createAuthUrl() . "\n");
    exit(0);
}

$token = $client->fetchAccessTokenWithAuthCode($authorizationCode);

if (array_key_exists('error', $token)) {
    fwrite(STDERR, sprintf("Gagal mendapatkan token: %s\n", $token['error_description'] ?? $token['error']));
    exit(1);
}

fwrite(STDOUT, "Simpan nilai berikut di file .env Anda:\n\n");
fwrite(STDOUT, sprintf("LOGBOOK_DRIVE_OAUTH_REFRESH_TOKEN=\"%s\"\n", $token['refresh_token'] ?? ''));

if (isset($token['access_token'])) {
    fwrite(STDOUT, sprintf("Access token sementara (opsional): %s\n", $token['access_token']));
}
