import LogbookController from '@/actions/App/Http/Controllers/LogbookController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { Download, LoaderCircle, Paperclip, Plus, Trash2, Upload } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useMemo } from 'react';

type LogbookRecord = App.Data.Logbook.LogbookData;
type WorkLocationRecord = App.Data.WorkLocation.WorkLocationData;

type AttachmentRecord = {
    id?: number | null;
    filename?: string | null;
    url?: string | null;
    created_at?: string | null;
};

interface LogbookEditProps {
    record: LogbookRecord;
    workLocations: WorkLocationRecord[];
    maxAttachmentSizeMb: number;
}

type FormData = {
    date: string;
    additional_notes: string;
    work_location_id: string;
    shift_id: string | null;
    work_details: string[];
    evidences: File[];
};

const formatIsoDateForInput = (value: string | null | undefined): string => {
    if (!value) {
        return '';
    }

    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
    }

    return value.slice(0, 10);
};

const formatDateTime = (value: string | null | undefined): string => {
    if (!value) {
        return '—';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }

    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
};

export default function LogbookEdit({ record, workLocations, maxAttachmentSizeMb }: LogbookEditProps) {
    const relatedCollections = record as unknown as {
        work_details?: Array<{ id?: number | null; description?: string | null }>;
        evidences?: AttachmentRecord[];
        technician?: { name?: string | null };
        work_location?: { id?: number | string | null; name?: string | null };
        shift?: { id?: number | string | null; name?: string | null; time_range_label?: string | null };
    };

    const derivedRecordId = Number(record.id);
    const recordId = Number.isNaN(derivedRecordId) ? 0 : derivedRecordId;

    const sanitizedWorkDetails = (Array.isArray(relatedCollections.work_details) ? relatedCollections.work_details : [])
        .map((detail) => (detail?.description ?? '').trim())
        .filter((description) => description !== '');

    const initialWorkDetails = sanitizedWorkDetails.length > 0 ? sanitizedWorkDetails : [''];

    const initialWorkLocationId = relatedCollections.work_location?.id != null ? String(relatedCollections.work_location.id) : '';
    const initialShiftId = relatedCollections.shift?.id != null ? String(relatedCollections.shift.id) : null;

    const { data, setData, put, processing, errors, progress } = useForm<FormData>({
        date: formatIsoDateForInput(record.date ?? null),
        additional_notes: record.additional_notes ?? '',
        work_location_id: initialWorkLocationId,
        shift_id: initialShiftId,
        work_details: initialWorkDetails,
        evidences: [],
    });

    const errorBag = errors as Record<string, string | undefined>;

    const activeShifts = useMemo(() => {
        const selectedId = Number.parseInt(data.work_location_id, 10);
        const location = workLocations.find((item) => Number(item.id) === selectedId);
        const rawShifts = (location && (location as WorkLocationRecord & { shifts?: App.Data.Shift.ShiftData[] }).shifts) ?? [];

        if (!Array.isArray(rawShifts)) {
            return [];
        }

        return rawShifts;
    }, [data.work_location_id, workLocations]);

    useEffect(() => {
        if (!data.shift_id) {
            return;
        }

        const isValid = activeShifts.some((shift) => String(shift.id) === data.shift_id);

        if (!isValid) {
            setData('shift_id', null);
        }
    }, [activeShifts, data.shift_id, setData]);

    const detailErrorMessages = (index: number): string | undefined => {
        return errorBag[`work_details.${index}`];
    };

    const evaluateEvidenceError = (): string | undefined => {
        if (errorBag.evidences) {
            return errorBag.evidences;
        }

        const prefix = 'evidences.';
        const found = Object.entries(errorBag).find(([key]) => key.startsWith(prefix));

        return found?.[1];
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        put(LogbookController.update(recordId).url, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const handleWorkDetailChange = (index: number, value: string) => {
        const next = [...data.work_details];
        next[index] = value;
        setData('work_details', next);
    };

    const addWorkDetail = () => {
        setData('work_details', [...data.work_details, '']);
    };

    const removeWorkDetail = (index: number) => {
        if (data.work_details.length === 1) {
            setData('work_details', ['']);
            return;
        }

        setData(
            'work_details',
            data.work_details.filter((_, itemIndex) => itemIndex !== index),
        );
    };

    const handleWorkLocationChange = (value: string) => {
        setData('work_location_id', value);
        setData('shift_id', null);
    };

    const handleShiftChange = (value: string) => {
        setData('shift_id', value === '' ? null : value);
    };

    const handleEvidenceChange = (files: FileList | null) => {
        setData('evidences', files ? Array.from(files) : []);
    };

    const renderFileSummary = (files: File[]) => {
        if (files.length === 0) {
            return 'Tidak ada berkas baru yang dipilih.';
        }

        return files.map((file) => file.name).join(', ');
    };

    const technicianName = relatedCollections.technician?.name ?? '—';
    const existingEvidences = Array.isArray(relatedCollections.evidences) ? (relatedCollections.evidences as AttachmentRecord[]) : [];

    return (
        <AppLayout>
            <Head title='Ubah Logbook' />
            <form onSubmit={handleSubmit} className='mx-auto max-w-4xl space-y-6 py-8'>
                <div>
                    <h1 className='text-3xl font-semibold tracking-tight'>Ubah Logbook</h1>
                    <p className='mt-2 text-sm text-muted-foreground'>Perbarui detail aktivitas, lokasi kerja, dan dokumentasi pendukung Anda.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Utama</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                        <div className='grid gap-4 md:grid-cols-2'>
                            <div className='space-y-2'>
                                <Label htmlFor='date-trigger'>Tanggal</Label>
                                <DatePicker id='date' name='date' value={data.date} onChange={(next) => setData('date', next)} />
                                <InputError message={errors.date} />
                            </div>

                            <div className='space-y-2'>
                                <Label>Teknisi</Label>
                                <Input value={technicianName} readOnly disabled className='bg-muted' />
                            </div>
                        </div>

                        <div className='grid gap-4 md:grid-cols-2'>
                            <div className='space-y-2'>
                                <Label htmlFor='work_location_id'>Lokasi Kerja</Label>
                                <Select value={data.work_location_id} onValueChange={handleWorkLocationChange}>
                                    <SelectTrigger id='work_location_id'>
                                        <SelectValue placeholder='Pilih lokasi kerja' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {workLocations.map((location) => (
                                            <SelectItem key={location.id} value={String(location.id)}>
                                                {location.name ?? `Lokasi ${location.id}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.work_location_id} />
                            </div>

                            <div className='space-y-2'>
                                <Label htmlFor='shift_id'>Shift</Label>
                                <Select value={data.shift_id ?? ''} onValueChange={handleShiftChange} disabled={activeShifts.length === 0}>
                                    <SelectTrigger id='shift_id'>
                                        <SelectValue placeholder={activeShifts.length > 0 ? 'Pilih shift' : 'Tidak ada shift tersedia'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {activeShifts.map((shift) => (
                                            <SelectItem key={shift.id} value={String(shift.id)}>
                                                {shift.name}
                                                {shift.time_range_label ? ` • ${shift.time_range_label}` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.shift_id} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between'>
                        <CardTitle>Detail Pekerjaan</CardTitle>
                        <Button type='button' variant='secondary' size='sm' onClick={addWorkDetail}>
                            <Plus className='mr-2 h-4 w-4' /> Tambah Detail
                        </Button>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        {data.work_details.map((detail, index) => (
                            <div key={index} className='space-y-2'>
                                <div className='flex items-start gap-2'>
                                    <Textarea
                                        name={`work_details[${index}]`}
                                        rows={3}
                                        value={detail}
                                        onChange={(event) => handleWorkDetailChange(index, event.target.value)}
                                        placeholder={`Perbarui aktivitas ke-${index + 1}...`}
                                    />
                                    <Button
                                        type='button'
                                        variant='ghost'
                                        size='icon'
                                        onClick={() => removeWorkDetail(index)}
                                        className='mt-1'
                                        disabled={data.work_details.length === 1}
                                        aria-label='Hapus detail'
                                    >
                                        <Trash2 className='h-4 w-4' />
                                    </Button>
                                </div>
                                <InputError message={detailErrorMessages(index)} />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Kendala / Catatan Tambahan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-2'>
                            <Label htmlFor='additional_notes'>Kendala / Catatan Tambahan</Label>
                            <Textarea
                                id='additional_notes'
                                name='additional_notes'
                                rows={4}
                                value={data.additional_notes}
                                onChange={(event) => setData('additional_notes', event.target.value)}
                                placeholder='Tuliskan kendala, hambatan, atau catatan tambahan di sini...'
                            />
                            <InputError message={errorBag.additional_notes} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Dokumentasi</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                        <p className='text-sm text-muted-foreground'>
                            Lampiran yang sudah ada akan tetap tersimpan. Unggah berkas baru untuk menambahkan dokumentasi tambahan. Ukuran maksimal{' '}
                            {maxAttachmentSizeMb} MB per file (jpg, jpeg, png, webp).
                        </p>

                        <ExistingAttachmentList
                            title='Bukti Kegiatan'
                            items={existingEvidences}
                            emptyMessage='Belum ada bukti kegiatan yang tersimpan.'
                        />

                        <div className='space-y-2'>
                            <Label htmlFor='evidences'>Tambah Bukti Kegiatan</Label>
                            <Input
                                id='evidences'
                                name='evidences'
                                type='file'
                                accept='image/*'
                                multiple
                                onChange={(event) => handleEvidenceChange(event.target.files)}
                            />
                            <p className='text-sm text-muted-foreground'>
                                <Upload className='mr-1 inline h-4 w-4' />
                                {renderFileSummary(data.evidences)}
                            </p>
                            <InputError message={evaluateEvidenceError()} />
                        </div>
                    </CardContent>
                </Card>

                <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
                    <Button type='submit' disabled={processing}>
                        {processing && <LoaderCircle className='mr-2 h-4 w-4 animate-spin' />}
                        {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                    {progress && <span className='text-sm text-muted-foreground'>Mengunggah {progress.percentage}%</span>}
                </div>
            </form>
        </AppLayout>
    );
}

interface ExistingAttachmentListProps {
    title: string;
    items: AttachmentRecord[];
    emptyMessage: string;
}

function ExistingAttachmentList({ title, items, emptyMessage }: ExistingAttachmentListProps) {
    if (items.length === 0) {
        return (
            <section className='rounded-lg border border-dashed border-border/60 bg-muted/30 p-4'>
                <h3 className='text-sm font-semibold'>{title}</h3>
                <p className='mt-2 text-sm text-muted-foreground'>{emptyMessage}</p>
            </section>
        );
    }

    return (
        <section className='space-y-3'>
            <div className='flex items-center justify-between gap-2'>
                <h3 className='text-sm font-semibold'>{title}</h3>
                <span className='text-xs text-muted-foreground'>Lampiran saat ini akan tetap disimpan.</span>
            </div>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {items.map((item, index) => (
                    <article
                        key={item.id ?? index}
                        className='overflow-hidden rounded-lg border border-border/70 bg-background shadow-sm transition hover:-translate-y-1 hover:shadow-md'
                    >
                        <div className='relative aspect-video bg-muted'>
                            {item.url ? (
                                <img src={item.url} alt={item.filename ?? 'Lampiran'} className='h-full w-full object-cover' loading='lazy' />
                            ) : (
                                <div className='flex h-full items-center justify-center gap-2 text-xs text-muted-foreground'>
                                    <Paperclip className='h-4 w-4' />
                                    <span>Tidak ada pratinjau</span>
                                </div>
                            )}
                        </div>
                        <div className='px-3 py-2 text-sm'>
                            <p className='truncate font-medium'>{item.filename ?? 'Lampiran'}</p>
                            <div className='mt-1 flex items-center justify-between text-xs text-muted-foreground'>
                                <span>{formatDateTime(item.created_at)}</span>
                                {item.url ? (
                                    <a
                                        href={item.url}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='inline-flex items-center gap-1 text-primary hover:underline'
                                    >
                                        <Download className='h-3 w-3' /> Unduh
                                    </a>
                                ) : (
                                    <span>Tautan tidak tersedia</span>
                                )}
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
