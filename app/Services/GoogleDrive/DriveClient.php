<?php

namespace App\Services\GoogleDrive;

use Google\Client;
use Google\Service\Drive;
use Google\Service\Drive\DriveFile;
use Google\Service\Drive\Permission;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use RuntimeException;

class DriveClient {
    private ?Drive $service = null;

    /**
     * Cached folder lookups keyed by parent id.
     *
     * @var array<string, \Illuminate\Support\Collection<int, DriveFile>>
     */
    private array $folderCache = [];

    /**
     * @return array<string, mixed>
     */
    private function config(): array {
        return config('logbook.drive', []);
    }

    public function isEnabled(): bool {
        return (bool) Arr::get($this->config(), 'enabled', false);
    }

    private function client(): Drive {
        if ($this->service instanceof Drive) {
            return $this->service;
        }

        if (!$this->isEnabled()) {
            throw new RuntimeException('Google Drive integration is disabled.');
        }

        $config = $this->config();
        $credentialsPath = Arr::get($config, 'credentials_path');

        $client = new Client;
        $client->setApplicationName(Arr::get($config, 'application_name', 'Logbook Publisher'));
        $client->setScopes([Drive::DRIVE]);
        $client->setAccessType('offline');

        if ($credentialsPath) {
            if (!is_file($credentialsPath)) {
                throw new RuntimeException(sprintf('Google credentials file not found at path [%s].', $credentialsPath));
            }

            $client->setAuthConfig($credentialsPath);

            if ($impersonate = Arr::get($config, 'impersonate_user')) {
                $client->setSubject($impersonate);
            }

            $this->service = new Drive($client);

            return $this->service;
        }

        $clientId = Arr::get($config, 'oauth_client_id');
        $clientSecret = Arr::get($config, 'oauth_client_secret');
        $refreshToken = Arr::get($config, 'oauth_refresh_token');

        if (!$clientId || !$clientSecret || !$refreshToken) {
            throw new RuntimeException('Google Drive OAuth credentials are not configured.');
        }

        $client->setClientId($clientId);
        $client->setClientSecret($clientSecret);

        $token = $client->fetchAccessTokenWithRefreshToken($refreshToken);

        if (array_key_exists('error', $token)) {
            $message = Arr::get($token, 'error_description') ?: Arr::get($token, 'error', 'unknown_error');
            throw new RuntimeException(sprintf('Unable to refresh Google OAuth token: %s', $message));
        }

        $token['refresh_token'] = $refreshToken;
        $client->setAccessToken($token);

        $this->service = new Drive($client);

        return $this->service;
    }

    public function ensureRootFolder(): DriveFile {
        $config = $this->config();
        $rootName = Arr::get($config, 'root_folder_name', 'Logbook_Asset');
        $parentId = Arr::get($config, 'shared_drive_id') ?: 'root';

        if ($existing = $this->findChildFolderByName($parentId, $rootName)) {
            return $existing;
        }

        $folder = $this->createFolder($parentId, $rootName, true);
        $this->setPubliclyReadable($folder->getId());

        return $folder;
    }

    public function createUniqueChildFolder(string $parentId, string $baseName, bool $makePublic = false): DriveFile {
        $existingNames = $this->listChildFolders($parentId)->pluck('name');
        $nextName = $this->resolveUniqueName($baseName, $existingNames);

        $folder = $this->createFolder($parentId, $nextName, $makePublic);

        if ($makePublic) {
            $this->setPubliclyReadable($folder->getId());
        }

        return $folder;
    }

    public function ensureChildFolder(string $parentId, string $name, bool $makePublic = false): DriveFile {
        if ($existing = $this->findChildFolderByName($parentId, $name)) {
            return $existing;
        }

        $folder = $this->createFolder($parentId, $name, $makePublic);

        if ($makePublic) {
            $this->setPubliclyReadable($folder->getId());
        }

        return $folder;
    }

    /**
     * @param  array<int, string>  $segments
     */
    public function ensureFolderPath(array $segments, bool $makePublic = false, ?string $parentId = null): DriveFile {
        if (count($segments) === 0) {
            throw new RuntimeException('Cannot ensure an empty Google Drive folder path.');
        }

        $parent = $parentId ?? $this->ensureRootFolder()->getId();
        $lastIndex = array_key_last($segments);
        $folder = null;

        foreach ($segments as $index => $segment) {
            $isLast = $index === $lastIndex;
            $folder = $this->ensureChildFolder($parent, $segment, $makePublic || $isLast);
            $parent = $folder->getId();
        }

        return $folder;
    }

    public function uploadFile(string $parentId, string $fileName, string $mimeType, string $filePath): DriveFile {
        $file = new DriveFile([
            'name' => $fileName,
            'parents' => [$parentId],
        ]);

        $content = file_get_contents($filePath);

        if ($content === false) {
            throw new RuntimeException(sprintf('Unable to read file content for upload [%s].', $filePath));
        }

        return $this->client()->files->create($file, [
            'data' => $content,
            'mimeType' => $mimeType,
            'uploadType' => 'multipart',
            'supportsAllDrives' => true,
            'fields' => 'id,name,webViewLink',
        ]);
    }

    public function uploadOrReplaceFile(string $parentId, string $fileName, string $mimeType, string $filePath): DriveFile {
        if ($existing = $this->findChildFileByName($parentId, $fileName)) {
            $this->deleteFile($existing->getId());
        }

        return $this->uploadFile($parentId, $fileName, $mimeType, $filePath);
    }

    public function setPubliclyReadable(string $itemId): void {
        $permission = new Permission([
            'type' => 'anyone',
            'role' => 'reader',
        ]);

        $this->client()->permissions->create($itemId, $permission, [
            'supportsAllDrives' => true,
            'fields' => 'id',
        ]);
    }

    /**
     * @return \Illuminate\Support\Collection<int, DriveFile>
     */
    public function listChildFolders(string $parentId): Collection {
        if (array_key_exists($parentId, $this->folderCache)) {
            return $this->folderCache[$parentId];
        }

        $service = $this->client();
        $config = $this->config();

        $parameters = [
            'q' => sprintf("mimeType = 'application/vnd.google-apps.folder' and '%s' in parents and trashed = false", $parentId),
            'supportsAllDrives' => true,
            'includeItemsFromAllDrives' => true,
            'fields' => 'files(id,name,webViewLink)',
        ];

        if ($sharedDrive = Arr::get($config, 'shared_drive_id')) {
            $parameters['driveId'] = $sharedDrive;
            $parameters['corpora'] = 'drive';
        }

        $result = $service->files->listFiles($parameters);

        return $this->folderCache[$parentId] = collect($result->getFiles() ?? []);
    }

    private function findChildFolderByName(string $parentId, string $name): ?DriveFile {
        $escaped = str_replace("'", "\\'", $name);

        $service = $this->client();
        $config = $this->config();

        $parameters = [
            'q' => sprintf("mimeType = 'application/vnd.google-apps.folder' and name = '%s' and '%s' in parents and trashed = false", $escaped, $parentId),
            'supportsAllDrives' => true,
            'includeItemsFromAllDrives' => true,
            'fields' => 'files(id,name,webViewLink)',
            'pageSize' => 1,
        ];

        if ($sharedDrive = Arr::get($config, 'shared_drive_id')) {
            $parameters['driveId'] = $sharedDrive;
            $parameters['corpora'] = 'drive';
        }

        $result = $service->files->listFiles($parameters)->getFiles();

        if (!$result) {
            return null;
        }

        return $result[0];
    }

    private function findChildFileByName(string $parentId, string $name): ?DriveFile {
        $escaped = str_replace("'", "\\'", $name);

        $service = $this->client();
        $config = $this->config();

        $parameters = [
            'q' => sprintf("mimeType != 'application/vnd.google-apps.folder' and name = '%s' and '%s' in parents and trashed = false", $escaped, $parentId),
            'supportsAllDrives' => true,
            'includeItemsFromAllDrives' => true,
            'fields' => 'files(id,name,webViewLink)',
            'pageSize' => 1,
        ];

        if ($sharedDrive = Arr::get($config, 'shared_drive_id')) {
            $parameters['driveId'] = $sharedDrive;
            $parameters['corpora'] = 'drive';
        }

        $result = $service->files->listFiles($parameters)->getFiles();

        if (!$result) {
            return null;
        }

        return $result[0];
    }

    public function deleteFile(string $fileId): void {
        $this->client()->files->delete($fileId, [
            'supportsAllDrives' => true,
        ]);
    }

    private function createFolder(string $parentId, string $name, bool $makePublic = false): DriveFile {
        $file = new DriveFile([
            'name' => $name,
            'mimeType' => 'application/vnd.google-apps.folder',
            'parents' => [$parentId],
        ]);

        $created = $this->client()->files->create($file, [
            'supportsAllDrives' => true,
            'fields' => 'id,name,webViewLink',
        ]);

        if ($makePublic) {
            $this->setPubliclyReadable($created->getId());
        }

        unset($this->folderCache[$parentId]);

        return $created;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, string>  $existingNames
     */
    private function resolveUniqueName(string $baseName, Collection $existingNames): string {
        if (!$existingNames->contains($baseName)) {
            return $baseName;
        }

        $suffix = 2;

        while (true) {
            $candidate = sprintf('%s_%d', $baseName, $suffix);

            if (!$existingNames->contains($candidate)) {
                return $candidate;
            }

            $suffix++;
        }
    }

    public function sanitiseFolderSegment(string $value): string {
        $sanitised = Str::of($value)
            ->replaceMatches('/[^\pL\pN\s-]/u', '')
            ->squish();

        return (string) ($sanitised->isEmpty() ? 'Tanpa Nama' : $sanitised);
    }
}
