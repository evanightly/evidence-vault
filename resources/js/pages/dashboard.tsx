import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState, type FormEvent } from 'react';

type DashboardOverview = App.Data.Dashboard.DashboardData;
type DashboardUploadStats = App.Data.Dashboard.DashboardUploadStatsData;

type UploadResultItem = {
    type: string;
    title: string;
    folder_url: string;
    file_url: string;
    file_name: string;
};

interface DashboardProps {
    overview: DashboardOverview;
}

interface SharedPageProps extends Record<string, unknown> {
    auth?: {
        user?: {
            id?: number;
        };
    };
    flash?: {
        success?: string;
        info?: string;
        warning?: string;
        uploadResult?: UploadResultItem[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

const formatNumber = (value: number): string => new Intl.NumberFormat('id-ID').format(value);

const UploadSummary = ({ label, stats }: { label: string; stats: DashboardUploadStats }) => (
    <Card>
        <CardHeader>
            <CardTitle>{label}</CardTitle>
            <CardDescription>{`Ringkasan unggahan ${label.toLowerCase()}.`}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
            <div>
                <p className='text-sm text-muted-foreground'>Total keseluruhan</p>
                <NumberTicker value={stats.total} className='text-3xl font-semibold' />
            </div>
            <div className='grid gap-3 rounded-md border bg-muted/40 p-4 text-sm sm:grid-cols-2'>
                <div className='space-y-1'>
                    <p className='text-muted-foreground'>Unggahan bulan ini</p>
                    <p className='font-semibold text-foreground'>{formatNumber(stats.this_month)}</p>
                </div>
                <div className='space-y-1'>
                    <p className='text-muted-foreground'>Unggahan Anda bulan ini</p>
                    <p className='font-semibold text-foreground'>{formatNumber(stats.mine_this_month)}</p>
                </div>
                <div className='space-y-1'>
                    <p className='text-muted-foreground'>Total unggahan Anda</p>
                    <p className='font-semibold text-foreground'>{formatNumber(stats.mine_total)}</p>
                </div>
            </div>
        </CardContent>
    </Card>
);

export default function Dashboard({ overview }: DashboardProps) {
    const page = usePage<SharedPageProps>();
    const flash = page.props.flash;

    const [fileKey, setFileKey] = useState(0);
    const [recentUploads, setRecentUploads] = useState<UploadResultItem[]>([]);

    type UploadFormState = { digital_name: string; digital_files: File[]; social_name: string; social_files: File[] };
    type FileField = Extract<keyof UploadFormState, 'digital_files' | 'social_files'>;

    const uploadForm = useForm<UploadFormState>(() => ({
        digital_name: '',
        digital_files: [],
        social_name: '',
        social_files: [],
    }));

    const disableUpload = !overview.drive_enabled;

    const uploadProgress = uploadForm.progress?.percentage ?? null;

    const getFieldError = (field: FileField): string | undefined => {
        const errors = uploadForm.errors as Record<string, string | undefined>;

        if (errors[field]) {
            return errors[field];
        }

        const prefixed = Object.entries(errors).find(([key]) => key.startsWith(`${field}.`));

        return prefixed?.[1];
    };

    const clearFileErrors = (field: FileField) => {
        const errors = uploadForm.errors as Record<string, string | undefined>;
        const prefixedKeys = Object.keys(errors).filter((key) => key.startsWith(`${field}.`));

        uploadForm.clearErrors(field, ...(prefixedKeys as Array<`${FileField}.${number}`>));
    };

    useEffect(() => {
        const handleCompleted = (event: Event) => {
            const detail = (event as CustomEvent<UploadResultItem>).detail;

            if (!detail) {
                return;
            }

            setRecentUploads((previous) => [detail, ...previous].slice(0, 6));
            uploadForm.reset();
            uploadForm.clearErrors();
            setFileKey((previous) => previous + 1);
        };

        window.addEventListener('evidence-upload:completed', handleCompleted as EventListener);

        return () => {
            window.removeEventListener('evidence-upload:completed', handleCompleted as EventListener);
        };
    }, [uploadForm]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const hasDigital = uploadForm.data.digital_files.length > 0;
        const hasSocial = uploadForm.data.social_files.length > 0;

        if (!hasDigital && !hasSocial) {
            uploadForm.setError('digital_files', 'Silakan pilih minimal satu berkas terlebih dahulu.');
            return;
        }

        uploadForm.post('/dashboard/uploads', {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                uploadForm.reset();
                uploadForm.clearErrors();
                setFileKey((previous) => previous + 1);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title='Dasbor' />

            <div className='mt-8 flex flex-1 flex-col gap-6'>
                <section className='rounded-lg border bg-card p-6 shadow-sm'>
                    <p className='text-sm text-muted-foreground'>{overview.current_month_label}</p>
                    <h1 className='mt-1 text-2xl font-semibold text-foreground'>{overview.greeting}</h1>
                    <p className='mt-2 text-sm text-muted-foreground'>{overview.description}</p>
                </section>

                {/* <div className='grid gap-4 lg:grid-cols-2'>
                    <UploadSummary label='Bukti Digital' stats={overview.digital} />
                    <UploadSummary label='Bukti Medsos' stats={overview.social} />
                </div> */}

                <Card>
                    {/* <CardHeader>
                        <CardTitle>Unggah Bukti</CardTitle>
                        <CardDescription>Pilih jenis evidence dan unggah ke Google Drive dengan cepat.</CardDescription>
                    </CardHeader> */}
                    <CardContent className='space-y-6'>
                        {disableUpload && (
                            <p className='rounded-md border border-dashed border-amber-500 bg-amber-50/80 p-3 text-sm text-amber-700'>
                                Integrasi Google Drive belum aktif. Hubungi administrator untuk mengaktifkannya sebelum mengunggah bukti.
                            </p>
                        )}

                        {flash?.info && (
                            <Alert>
                                <AlertTitle>Unggahan sedang diproses</AlertTitle>
                                <AlertDescription>{flash.info}</AlertDescription>
                            </Alert>
                        )}

                        <form className='space-y-6' onSubmit={handleSubmit}>
                            <div className='space-y-4'>
                                <div className='space-y-2'>
                                    <div className='space-y-1'>
                                        <h3 className='text-base font-semibold text-foreground'>Bukti Digital</h3>
                                        <p className='text-sm text-muted-foreground'>Unggah bukti digital dengan format JPG, JPEG, PNG, atau WEBP.</p>
                                    </div>
                                    {/* <Label htmlFor='digital-name'>Nama Bukti (opsional)</Label>
                                    <Input
                                        id='digital-name'
                                        name='digital_name'
                                        placeholder='Contoh: Shift Pagi - 3 November'
                                        value={uploadForm.data.digital_name}
                                        onChange={(event) => {
                                            uploadForm.setData('digital_name', event.target.value);
                                            uploadForm.clearErrors('digital_name');
                                        }}
                                        disabled={uploadForm.processing || disableUpload}
                                    />
                                    <InputError message={uploadForm.errors.digital_name} /> */}
                                </div>
                                <div className='space-y-2'>
                                    <Label htmlFor='digital-file' className={buttonVariants()}>
                                        Pilih Berkas Digital
                                    </Label>
                                    <Input
                                        className='hidden'
                                        key={`digital-${fileKey}`}
                                        id='digital-file'
                                        name='digital_files'
                                        type='file'
                                        accept='.jpg,.jpeg,.png,.webp'
                                        multiple
                                        onChange={(event) => {
                                            const files = Array.from(event.currentTarget.files ?? []);
                                            uploadForm.setData('digital_files', files);
                                            clearFileErrors('digital_files');
                                            clearFileErrors('social_files');
                                        }}
                                        disabled={uploadForm.processing || disableUpload}
                                    />
                                    <InputError message={getFieldError('digital_files')} />
                                </div>
                            </div>

                            <div className='space-y-4'>
                                <div className='space-y-2'>
                                    <div className='space-y-1'>
                                        <h3 className='text-base font-semibold text-foreground'>Bukti Medsos</h3>
                                        <p className='text-sm text-muted-foreground'>Unggah bukti medsos dengan format JPG, JPEG, PNG, atau WEBP.</p>
                                    </div>
                                    {/* <Label htmlFor='social-name'>Nama Bukti (opsional)</Label>
                                    <Input
                                        id='social-name'
                                        name='social_name'
                                        placeholder='Contoh: Postingan IG - 3 November'
                                        value={uploadForm.data.social_name}
                                        onChange={(event) => {
                                            uploadForm.setData('social_name', event.target.value);
                                            uploadForm.clearErrors('social_name');
                                        }}
                                        disabled={uploadForm.processing || disableUpload}
                                    />
                                    <InputError message={uploadForm.errors.social_name} /> */}
                                </div>
                                <div className='space-y-2'>
                                    <Label htmlFor='social-file' className={buttonVariants()}>
                                        Pilih Berkas Medsos
                                    </Label>
                                    <Input
                                        className='hidden'
                                        key={`social-${fileKey}`}
                                        id='social-file'
                                        name='social_files'
                                        type='file'
                                        accept='.jpg,.jpeg,.png,.webp'
                                        multiple
                                        onChange={(event) => {
                                            const files = Array.from(event.currentTarget.files ?? []);
                                            uploadForm.setData('social_files', files);
                                            clearFileErrors('social_files');
                                            clearFileErrors('digital_files');
                                        }}
                                        disabled={uploadForm.processing || disableUpload}
                                    />
                                    <InputError message={getFieldError('social_files')} />
                                </div>
                            </div>

                            {uploadProgress !== null && (
                                <div className='space-y-2'>
                                    <p className='text-sm text-muted-foreground'>Mengunggah ke Google Drive… {uploadProgress}%</p>
                                    <Progress value={uploadProgress} />
                                </div>
                            )}

                            <Button type='submit' className='w-full sm:w-auto' disabled={uploadForm.processing || disableUpload}>
                                {uploadForm.processing ? 'Mengunggah…' : 'Unggah Bukti'}
                            </Button>
                        </form>

                        {recentUploads.length > 0 && (
                            <div className='space-y-3 rounded-md border bg-muted/40 p-4'>
                                <div>
                                    <h4 className='text-sm font-semibold text-foreground'>Tautan Bukti Terbaru</h4>
                                    <p className='text-xs text-muted-foreground'>Tautan akan muncul otomatis setelah unggahan selesai diproses.</p>
                                </div>
                                <div className='space-y-3'>
                                    {recentUploads.map((item) => (
                                        <div key={`${item.type}-${item.file_url}`} className='space-y-1'>
                                            <p className='text-sm font-medium text-foreground'>{item.title}</p>
                                            <a
                                                href={item.folder_url}
                                                target='_blank'
                                                rel='noreferrer'
                                                className='text-sm font-medium text-primary underline-offset-2 hover:underline'
                                            >
                                                Buka folder di Google Drive
                                            </a>
                                            <a
                                                href={item.file_url}
                                                target='_blank'
                                                rel='noreferrer'
                                                className='text-xs text-muted-foreground underline-offset-2 hover:underline'
                                            >
                                                Lihat berkas: {item.file_name}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
