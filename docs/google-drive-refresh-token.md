# Troubleshooting: Google Drive Refresh Token Errors

This guide documents the exact steps to resolve "Unable to refresh Google OAuth token" errors that may appear when the logbook publication job attempts to access Google Drive.

## Symptoms

- Queue worker logs contain entries similar to:
    - `Unable to refresh Google OAuth token: Token has been expired or revoked.`
    - `Unable to refresh Google OAuth token: Bad Request`
- Evidence uploads and monthly spreadsheet generation fail, leaving logbooks unpublished.

These errors usually occur after a Google account password reset, user revokes the app's access, an OAuth consent screen change, or when a one-time authorization code (the string that begins with `4/`) is mistakenly stored in `.env` instead of the long-lived refresh token (the string that usually begins with `1//`).

## Resolution Steps

Follow the steps below to mint a fresh refresh token and update the application configuration.

1. **Run the helper script**

    ```bash
    php scripts/google-drive-oauth.php
    ```

    - The script prints an authorization URL. Open the link in a browser while logged in with the Google account that should own the Drive files.
    - Approve the requested Drive scope. Google will display an authorization code that starts with `4/`.

2. **Exchange the authorization code**

    Run the script again, passing the code as an argument (wrap the code in quotes to avoid shell parsing issues):

    ```bash
    php scripts/google-drive-oauth.php "4/XXXXXXXXXXXXXXXXXXXX"
    ```

    When successful, the script prints a line similar to:

    ```
    LOGBOOK_DRIVE_OAUTH_REFRESH_TOKEN="1//ABCD..."
    ```

    The value beginning with `1//` is the actual refresh token.

3. **Update `.env`**
    - Replace the value of `LOGBOOK_DRIVE_OAUTH_REFRESH_TOKEN` with the new token from the script output.
    - If you recreated the OAuth client, also update `LOGBOOK_DRIVE_OAUTH_CLIENT_ID` and `LOGBOOK_DRIVE_OAUTH_CLIENT_SECRET`.

4. **Reload configuration and queue workers**

    ```bash
    php artisan config:clear
    php artisan queue:restart
    ```

    If you run dedicated workers manually, restart them so they read the latest environment variables:

    ```bash
    php artisan queue:work
    ```

5. **Re-run failed jobs**

    ```bash
    php artisan queue:retry all
    ```

    Alternatively, open the affected logbooks in the UI and click "Simpan" to enqueue fresh publish jobs.

## Prevention Tips

- Store the new refresh token securely and avoid committing it to version control.
- If refresh tokens expire frequently (for example, due to organizational security policies), consider switching to a **Service Account + Shared Drive** setup. Detailed instructions are in `docs/google-drive-integration.md`.
- Whenever you change OAuth consent settings in Google Cloud Console, regenerate the refresh token immediately to avoid unexpected queue failures.
