import LogbookController from '@/actions/App/Http/Controllers/LogbookController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Download, NotebookPen, Paperclip } from 'lucide-react';

type LogbookRecord = App.Data.Logbook.LogbookData;

interface LogbookShowProps {
    record: LogbookRecord;
}

export default function LogbookShow({ record }: LogbookShowProps) {
    const relatedCollections = record as unknown as {
        work_details?: App.Data.LogbookWorkDetail.LogbookWorkDetailData[];
        evidences?: App.Data.LogbookEvidence.LogbookEvidenceData[];
        technician?: { name?: string | null };
        work_location?: { name?: string | null };
        shift?: { name?: string | null; time_range_label?: string | null };
    };

    const workDetails = Array.isArray(relatedCollections.work_details) ? (relatedCollections.work_details ?? []) : [];

    const evidences = Array.isArray(relatedCollections.evidences) ? (relatedCollections.evidences ?? []) : [];

    const formatDate = (value: string | null | undefined): string => {
        if (!value) {
            return '—';
        }

        const parsed = new Date(value);

        if (Number.isNaN(parsed.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(parsed);
    };

    return (
        <AppLayout>
            <Head title='Detail Logbook' />
            <div className='mx-auto max-w-5xl space-y-6 py-8'>
                <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                    <div>
                        <h1 className='text-3xl font-semibold tracking-tight'>Detail Logbook</h1>
                        <p className='text-sm text-muted-foreground'>Ringkasan aktivitas, lokasi, dan dokumentasi yang telah dicatat.</p>
                    </div>
                    <Button variant='outline' asChild>
                        <Link href={LogbookController.edit(record.id).url}>
                            <NotebookPen className='mr-2 h-4 w-4' /> Ubah Logbook
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Utama</CardTitle>
                    </CardHeader>
                    <CardContent className='grid gap-4 md:grid-cols-2'>
                        <InfoRow label='ID' value={record.id} />
                        <InfoRow label='Tanggal' value={formatDate(record.date ?? null)} />
                        <InfoRow label='Teknisi' value={relatedCollections.technician?.name ?? '—'} />
                        <InfoRow label='Lokasi Kerja' value={relatedCollections.work_location?.name ?? '—'} />
                        <InfoRow label='Shift' value={relatedCollections.shift?.name ?? '—'} />
                        <InfoRow label='Rentang Waktu' value={relatedCollections.shift?.time_range_label ?? '—'} />
                        <InfoRow label='Kendala / Catatan Tambahan' value={record.additional_notes ?? '—'} className='md:col-span-2' />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Detail Pekerjaan</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                        {workDetails.length === 0 && <p className='text-sm text-muted-foreground'>Belum ada detail pekerjaan yang dicatat.</p>}
                        {workDetails.map((detail, index) => (
                            <div key={detail.id ?? index} className='rounded-lg border border-dashed border-border/70 bg-muted/30 p-4'>
                                <span className='block text-xs font-medium text-muted-foreground uppercase'>Aktivitas #{index + 1}</span>
                                <p className='mt-1 text-sm leading-relaxed'>{detail.description ?? '—'}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Dokumentasi</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                        <AttachmentSection title='Bukti Kegiatan' items={evidences} emptyMessage='Belum ada bukti kegiatan.' />
                    </CardContent>
                </Card>

                <div className='grid gap-4 md:grid-cols-2'>
                    <Card>
                        <CardHeader>
                            <CardTitle>Waktu Dibuat</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className='text-sm text-muted-foreground'>{formatDate(record.created_at ?? null)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Terakhir Diperbarui</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className='text-sm text-muted-foreground'>{formatDate(record.updated_at ?? null)}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

interface InfoRowProps {
    label: string;
    value: string | number | null | undefined;
    className?: string;
}

function InfoRow({ label, value, className }: InfoRowProps) {
    return (
        <div className={className}>
            <span className='text-xs font-medium text-muted-foreground uppercase'>{label}</span>
            <p className='mt-1 text-sm text-foreground'>{value === null || value === undefined || value === '' ? '—' : String(value)}</p>
        </div>
    );
}

interface AttachmentSectionProps {
    title: string;
    items: Array<{ id?: number | null; filename?: string | null; url?: string | null; created_at?: string | null }>;
    emptyMessage: string;
}

function AttachmentSection({ title, items, emptyMessage }: AttachmentSectionProps) {
    if (items.length === 0) {
        return (
            <section className='rounded-lg border border-dashed border-border/60 bg-muted/30 p-4'>
                <h3 className='text-sm font-semibold'>{title}</h3>
                <p className='mt-2 text-sm text-muted-foreground'>{emptyMessage}</p>
            </section>
        );
    }

    return (
        <section className='space-y-4 rounded-lg border border-border/60 p-4'>
            <h3 className='text-sm font-semibold'>{title}</h3>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {items.map((item, index) => (
                    <article
                        key={item.id ?? index}
                        className='group overflow-hidden rounded-lg border border-border/70 bg-background shadow-sm transition hover:-translate-y-1 hover:shadow-md'
                    >
                        <div className='relative aspect-video w-full bg-muted'>
                            {item.url ? (
                                <img
                                    src={item.url}
                                    alt={item.filename ?? 'Lampiran'}
                                    className='h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]'
                                    loading='lazy'
                                />
                            ) : (
                                <div className='flex h-full items-center justify-center gap-2 text-xs text-muted-foreground'>
                                    <Paperclip className='h-4 w-4' />
                                    <span>Tidak ada pratinjau</span>
                                </div>
                            )}
                            {item.url && (
                                <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition group-hover:opacity-100' />
                            )}
                        </div>
                        <div className='flex items-center justify-between gap-2 px-3 py-2 text-sm'>
                            <span className='flex-1 truncate font-medium'>{item.filename ?? 'Lampiran'}</span>
                            {item.url ? (
                                <a
                                    href={item.url}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline'
                                >
                                    <Download className='h-3 w-3' /> Unduh
                                </a>
                            ) : (
                                <span className='text-xs text-muted-foreground'>Tidak tersedia</span>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
