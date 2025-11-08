import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

interface DriveIntegrationProps {
    authorization_url: string | null;
    credentials_ready: boolean;
    drive_enabled: boolean;
    has_refresh_token: boolean;
    feedback: {
        success?: string;
        error?: string;
        warning?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Integrasi Drive',
        href: '/settings/drive',
    },
];

export default function DriveIntegration({
    authorization_url,
    credentials_ready,
    drive_enabled,
    has_refresh_token,
    feedback,
}: DriveIntegrationProps) {
    const form = useForm<{ code: string }>({
        code: '',
    });
    const [copyMessage, setCopyMessage] = useState<string | null>(null);

    const disableActions = !credentials_ready || form.processing;

    const statusList = useMemo(
        () => [
            {
                label: 'Status integrasi Google Drive',
                value: drive_enabled ? 'Aktif' : 'Tidak aktif',
            },
            {
                label: 'Client ID & Secret',
                value: credentials_ready ? 'Sudah dikonfigurasi' : 'Belum diisi',
            },
            {
                label: 'Refresh token tersimpan',
                value: has_refresh_token ? 'Sudah tersedia' : 'Belum tersedia',
            },
        ],
        [credentials_ready, drive_enabled, has_refresh_token],
    );

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post('/settings/drive/token', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
            },
        });
    };

    const handleCopy = async () => {
        if (!authorization_url) {
            return;
        }

        try {
            await navigator.clipboard.writeText(authorization_url);
            setCopyMessage('Tautan berhasil disalin ke clipboard.');
            window.setTimeout(() => setCopyMessage(null), 3000);
        } catch (_error) {
            setCopyMessage('Gagal menyalin tautan. Salin secara manual.');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title='Integrasi Drive' />

            <SettingsLayout>
                <div className='space-y-6'>
                    <div className='space-y-2'>
                        <h1 className='text-2xl font-semibold text-foreground'>Integrasi Google Drive</h1>
                        <p className='text-sm text-muted-foreground'>Kelola token OAuth Google Drive agar proses unggah evidence berjalan lancar.</p>
                    </div>

                    {feedback.success && (
                        <Alert>
                            <AlertTitle>Berhasil</AlertTitle>
                            <AlertDescription>{feedback.success}</AlertDescription>
                        </Alert>
                    )}

                    {feedback.warning && (
                        <Alert>
                            <AlertTitle>Perhatian</AlertTitle>
                            <AlertDescription>{feedback.warning}</AlertDescription>
                        </Alert>
                    )}

                    {feedback.error && (
                        <Alert variant='destructive'>
                            <AlertTitle>Terjadi kesalahan</AlertTitle>
                            <AlertDescription>{feedback.error}</AlertDescription>
                        </Alert>
                    )}

                    <div className='grid gap-3 rounded-lg border border-dashed p-4 text-sm sm:grid-cols-2'>
                        {statusList.map((item) => (
                            <div key={item.label}>
                                <p className='text-muted-foreground'>{item.label}</p>
                                <p className='font-medium text-foreground'>{item.value}</p>
                            </div>
                        ))}
                    </div>

                    {!credentials_ready && (
                        <Alert variant='destructive'>
                            <AlertTitle>Lengkapi kredensial OAuth terlebih dahulu</AlertTitle>
                            <AlertDescription>
                                Masukkan nilai <code>LOGBOOK_DRIVE_OAUTH_CLIENT_ID</code> dan <code>LOGBOOK_DRIVE_OAUTH_CLIENT_SECRET</code> di file
                                .env, kemudian kembali ke halaman ini.
                            </AlertDescription>
                        </Alert>
                    )}

                    <section className='space-y-4'>
                        <div className='space-y-2'>
                            <h2 className='text-lg font-semibold text-foreground'>Langkah otorisasi</h2>
                            <ol className='list-decimal space-y-1 pl-5 text-sm text-muted-foreground'>
                                <li>Buka tautan otorisasi Google melalui tombol di bawah ini.</li>
                                <li>Berikan akses penuh ke Google Drive ketika diminta.</li>
                                <li>Salin kode verifikasi yang ditampilkan Google.</li>
                                <li>Masukkan kode verifikasi tersebut pada formulir di bawah.</li>
                            </ol>
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='authorization-url'>Tautan otorisasi Google</Label>
                            <div className='flex flex-col gap-2 sm:flex-row'>
                                <Input
                                    id='authorization-url'
                                    value={authorization_url ?? 'Kredensial OAuth belum lengkap.'}
                                    readOnly
                                    className='flex-1'
                                />
                                <Button type='button' onClick={handleCopy} disabled={!authorization_url} variant='secondary'>
                                    Salin tautan
                                </Button>
                                <Button
                                    type='button'
                                    disabled={!authorization_url}
                                    onClick={() => {
                                        if (authorization_url) {
                                            window.open(authorization_url, '_blank', 'noopener,noreferrer');
                                        }
                                    }}
                                >
                                    Buka tautan
                                </Button>
                            </div>
                            {copyMessage && <p className='text-xs text-muted-foreground'>{copyMessage}</p>}
                        </div>

                        <form className='space-y-4' onSubmit={handleSubmit}>
                            <div className='space-y-2'>
                                <Label htmlFor='code'>Kode verifikasi Google</Label>
                                <Input
                                    id='code'
                                    name='code'
                                    value={form.data.code}
                                    onChange={(event) => form.setData('code', event.target.value)}
                                    placeholder='Tempel kode verifikasi di sini'
                                    disabled={disableActions}
                                />
                                {form.errors.code && <p className='text-xs text-destructive'>{form.errors.code}</p>}
                            </div>

                            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                                <Button type='submit' disabled={disableActions}>
                                    {form.processing ? 'Memproses…' : 'Simpan refresh token'}
                                </Button>
                                <p className='text-xs text-muted-foreground'>Setelah token tersimpan, cache aplikasi akan dibersihkan otomatis.</p>
                            </div>
                        </form>
                    </section>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
