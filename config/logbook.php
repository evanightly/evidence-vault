<?php

return [
    'attachments_disk' => env('LOGBOOK_ATTACHMENTS_DISK', 'public'),
    'attachments_root' => 'logbooks',
    'max_attachment_size_mb' => 20,
    'max_attachment_size_kb' => 20 * 1024,
    'allowed_mimes' => ['jpg', 'jpeg', 'png', 'webp'],
    'drive' => [
        'enabled' => env('LOGBOOK_DRIVE_ENABLED', false),
        'credentials_path' => env('LOGBOOK_DRIVE_CREDENTIALS'),
        'oauth_client_id' => env('LOGBOOK_DRIVE_OAUTH_CLIENT_ID'),
        'oauth_client_secret' => env('LOGBOOK_DRIVE_OAUTH_CLIENT_SECRET'),
        'oauth_refresh_token' => env('LOGBOOK_DRIVE_OAUTH_REFRESH_TOKEN'),
        'impersonate_user' => env('LOGBOOK_DRIVE_IMPERSONATE'),
        'shared_drive_id' => env('LOGBOOK_DRIVE_SHARED_DRIVE_ID'),
        'root_folder_name' => env('LOGBOOK_DRIVE_ROOT_FOLDER', 'RRI'),
        'application_name' => env('LOGBOOK_DRIVE_APP_NAME', 'Log-It Logbook Publisher'),
        'env_path' => env('LOGBOOK_DRIVE_ENV_PATH'),
    ],
];
