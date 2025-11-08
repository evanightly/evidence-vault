<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\DriveTokenExchangeRequest;
use App\Services\Environment\EnvUpdater;
use App\Services\GoogleDrive\DriveOAuthManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Throwable;

class DriveIntegrationController extends Controller {
    public function show(Request $request, DriveOAuthManager $manager): Response {
        $success = $request->session()->pull('drive_oauth.success');
        $error = $request->session()->pull('drive_oauth.error');
        $warning = $request->session()->pull('drive_oauth.warning');

        $authorizationUrl = null;
        $credentialsReady = $manager->hasConfiguredCredentials();

        if ($credentialsReady) {
            try {
                $authorizationUrl = $manager->createAuthorizationUrl();
            } catch (RuntimeException $exception) {
                $error ??= $exception->getMessage();
            }
        }

        return Inertia::render('settings/drive-integration', [
            'authorization_url' => $authorizationUrl,
            'credentials_ready' => $credentialsReady,
            'drive_enabled' => (bool) config('logbook.drive.enabled', false),
            'has_refresh_token' => filled(config('logbook.drive.oauth_refresh_token')),
            'feedback' => array_filter([
                'success' => $success,
                'error' => $error,
                'warning' => $warning,
            ]),
        ]);
    }

    public function store(DriveTokenExchangeRequest $request, DriveOAuthManager $manager): RedirectResponse {
        if (!$manager->hasConfiguredCredentials()) {
            return back()
                ->with('drive_oauth.error', 'Client ID dan Client Secret Google Drive belum dikonfigurasi. Perbarui variabel lingkungan terlebih dahulu.')
                ->withInput();
        }

        try {
            $token = $manager->exchangeAuthorizationCode($request->validated('code'));
        } catch (RuntimeException $exception) {
            return back()
                ->with('drive_oauth.error', $exception->getMessage())
                ->withInput();
        }

        $refreshToken = (string) ($token['refresh_token'] ?? '');

        try {
            EnvUpdater::for(config('logbook.drive.env_path'))
                ->update(['LOGBOOK_DRIVE_OAUTH_REFRESH_TOKEN' => $refreshToken]);
        } catch (RuntimeException $exception) {
            return back()
                ->with('drive_oauth.error', $exception->getMessage())
                ->withInput();
        }

        config(['logbook.drive.oauth_refresh_token' => $refreshToken]);

        $warning = null;

        try {
            Artisan::call('optimize:clear');
        } catch (Throwable $exception) {
            $warning = sprintf('Token tersimpan, tetapi optimize:clear gagal dijalankan: %s', $exception->getMessage());
        }

        $response = to_route('settings.drive')
            ->with('drive_oauth.success', 'Refresh token Google Drive berhasil diperbarui.');

        if ($warning !== null) {
            $response = $response->with('drive_oauth.warning', $warning);
        }

        return $response;
    }
}
