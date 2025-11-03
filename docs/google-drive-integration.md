# Integrasi Google Drive untuk Publikasi Logbook

Panduan ini membantu Anda menyiapkan akun Google baru agar aplikasi bisa mempublikasikan logbook beserta lampirannya secara otomatis ke Google Drive.

## 1. Siapkan Proyek Google Cloud

1. Masuk ke [Google Cloud Console](https://console.cloud.google.com/).
2. Buat proyek baru atau gunakan proyek yang sudah ada.
3. Buka **APIs & Services → Enabled APIs & services** kemudian klik **Enable APIs and Services**.
4. Aktifkan API berikut:
    - **Google Drive API**
    - **Google Docs API** (opsional, namun direkomendasikan untuk kompatibilitas dokumen Word)

## 2. Pilihan Autentikasi

Anda dapat menggunakan salah satu dari dua pendekatan berikut:

- **Service Account + Shared Drive (disarankan untuk Google Workspace)**
- **OAuth Client + Refresh Token (disarankan untuk akun personal/Gmail)**

Pada bagian di bawah ini pilih skenario yang sesuai.

### 2A. Service Account (Google Workspace)

1. Masuk ke **IAM & Admin → Service Accounts** dan klik **Create Service Account**.
2. Isi nama dan deskripsi, lalu klik **Create**.
3. Berikan peran minimal **Project → Editor** (atau buat peran kustom dengan akses Drive). Klik **Continue** lalu **Done**.
4. Di daftar service account, pilih akun yang baru dibuat lalu buka tab **Keys**.
5. Klik **Add Key → Create new key** dan pilih tipe **JSON**. Simpan berkas `*.json` yang diunduh dengan aman.
6. Jika menggunakan Shared Drive, pastikan service account ditambahkan sebagai member di Shared Drive dengan peran minimal **Contributor**.

### 2B. OAuth Client (Google Personal)

1. Buka **APIs & Services → Credentials**, atur **OAuth Consent Screen** bertipe _External_, dan tambahkan scope `https://www.googleapis.com/auth/drive`.
2. Klik **Create Credentials → OAuth client ID** dan pilih tipe **Desktop App**.
3. Simpan Client ID dan Client Secret yang dihasilkan.
4. Jalankan skrip bantuan `php scripts/google-drive-oauth.php` untuk mendapatkan URL otorisasi, buka di browser dengan akun Google target, lalu jalankan ulang skrip dengan kode verifikasi untuk mengambil refresh token.
5. Catat nilai `refresh_token` yang ditampilkan, karena diperlukan di `.env`.

## 3. Bagikan Folder Google Drive ke Integrasi

1. Masuk ke Google Drive menggunakan akun Google utama.
2. Buat folder teratas (root) bernama **Logbook_Asset** (bisa dibiarkan kosong, aplikasi akan mengatur struktur isinya).
3. Klik kanan folder tersebut → **Share**.
4. Jika memakai service account, bagikan folder ke alamat email service account (biasanya berakhiran `@<project-id>.iam.gserviceaccount.com`) sebagai **Editor**.
5. Jika memakai OAuth personal, pastikan folder berada di akun yang sama dengan pemilik refresh token (karena file akan dimiliki akun tersebut).
6. Aktifkan opsi **Anyone with the link → Viewer** bila ingin folder induk langsung publik; aplikasi juga akan mengubah izin folder yang dibuat di dalamnya agar publik otomatis.

### Menggunakan Shared Drive (Opsional)

Jika folder berada dalam Shared Drive:

1. Pastikan service account atau akun pribadi yang digunakan memiliki akses ke Shared Drive tersebut.
2. Catat ID Shared Drive dari URL (`https://drive.google.com/drive/u/0/folders/<shared-drive-id>`).

## 4. Simpan Kredensial di Server

1. Tentukan lokasi aman untuk menyimpan berkas JSON service account, misalnya `storage/app/google/logbook-service-account.json`.
2. Upload berkas JSON ke server dan pastikan hanya bisa diakses proses aplikasi.

## 5. Konfigurasi Variabel Lingkungan

Tambahkan nilai berikut ke `.env` (gunakan contoh di `.env.example`):

```dotenv
LOGBOOK_ATTACHMENTS_DISK=public
LOGBOOK_DRIVE_ENABLED=true
LOGBOOK_DRIVE_ROOT_FOLDER=Logbook_Asset
LOGBOOK_DRIVE_APP_NAME="Log-It Logbook Publisher"
LOGBOOK_DRIVE_CREDENTIALS=/absolute/path/to/logbook-service-account.json   # kosongkan bila memakai OAuth
LOGBOOK_DRIVE_IMPERSONATE=you@example.com                                 # opsional, hanya untuk delegasi domain-wide
LOGBOOK_DRIVE_SHARED_DRIVE_ID=                                             # isi bila menggunakan Shared Drive
LOGBOOK_DRIVE_OAUTH_CLIENT_ID=                                             # isi bila memakai OAuth personal
LOGBOOK_DRIVE_OAUTH_CLIENT_SECRET=
LOGBOOK_DRIVE_OAUTH_REFRESH_TOKEN=
```

Gunakan path absolut pada `LOGBOOK_DRIVE_CREDENTIALS` agar aplikasi bisa memuat berkas di mana pun berada.

## 6. Jalankan Migrasi dan Queue Worker

1. Jalankan migrasi agar kolom pelacakan Drive tersedia:
    ```bash
    php artisan migrate
    ```
2. Pastikan queue worker aktif karena publikasi logbook dilakukan melalui job antrian:
    ```bash
    php artisan queue:work
    ```

## 7. Uji Coba

1. Masuk ke aplikasi lalu buat logbook baru beserta lampiran.
2. Setelah job selesai dijalankan, periksa Google Drive:
    - Folder baru bernama `Tanggal_Lokasi_NamaTeknisi` muncul di dalam `Logbook_Asset`.
    - Di dalamnya terdapat sub-folder **Foto Bukti**, **Foto Digital**, dan **Foto Sosial Media**.
    - File Word (`.docx`) berisi ringkasan logbook tersedia.
3. Di aplikasi, metadata `drive_folder_url` tercatat pada logbook sehingga tautan dapat dibagikan di masa depan.

## 8. Pemecahan Masalah

| Gejala                                                     | Langkah Perbaikan                                                                                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Job gagal dengan pesan "Google credentials file not found" | Periksa path `LOGBOOK_DRIVE_CREDENTIALS` dan izin baca berkas.                                                                  |
| Folder tidak muncul di Drive                               | Pastikan service account memiliki akses ke folder induk atau Shared Drive, lalu ulangi job (`php artisan queue:retry all`).     |
| File Word kosong atau gambar tidak masuk                   | Pastikan lampiran tersimpan di disk yang dapat dibaca server (`LOGBOOK_ATTACHMENTS_DISK`) dan ukuran file tidak melebihi batas. |
| Gagal refresh token OAuth                                  | Ikuti panduan di [`docs/google-drive-refresh-token.md`](./google-drive-refresh-token.md) untuk memperbarui refresh token.       |

## 9. Keamanan

- Simpan berkas JSON service account di lokasi yang tidak dapat diunduh publik.
- Gunakan user impersonation (`LOGBOOK_DRIVE_IMPERSONATE`) hanya bila benar-benar diperlukan.
- Pertimbangkan memberi akses minimal (principle of least privilege) pada folder `Logbook_Asset` bila tidak ingin seluruh Drive publik.

Setelah tahapan di atas selesai, logbook akan otomatis dipublikasikan ke Google Drive setiap kali dibuat atau diperbarui dari aplikasi.
