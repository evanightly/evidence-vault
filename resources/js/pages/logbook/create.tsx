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
import { LoaderCircle, Plus, Trash2, Upload } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo } from 'react';

type WorkLocationRecord = App.Data.WorkLocation.WorkLocationData;

interface LogbookCreateProps {
    workLocations: WorkLocationRecord[];
    defaultDate: string;
    technician: App.Data.User.UserData | null;
    maxAttachmentSizeMb: number;
}

type FormData = {
    date: string;
    additional_notes: string;
    work_location_id: string;
    shift_id: string;
    work_details: string[];
    evidences: File[];
};

export default function LogbookCreate({ workLocations, defaultDate, technician, maxAttachmentSizeMb }: LogbookCreateProps) {
    const { data, setData, post, processing, errors, progress } = useForm<FormData>({
        date: defaultDate,
        additional_notes: '',
        work_location_id: '',
        shift_id: '',
        work_details: [''],
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

    const detailErrorMessages = (index: number): string | undefined => {
        const fieldKey = `work_details.${index}`;
        return errorBag[fieldKey];
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(LogbookController.store().url, {
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
        setData('shift_id', '');
    };

    const handleShiftChange = (value: string) => {
        setData('shift_id', value);
    };

    const handleEvidenceChange = (files: FileList | null) => {
        setData('evidences', files ? Array.from(files) : []);
    };

    const renderFileSummary = (files: File[]) => {
        if (files.length === 0) {
            return 'Tidak ada berkas yang dipilih.';
        }

        return files.map((file) => file.name).join(', ');
    };

    return (
        <AppLayout>
            <Head title='Buat Logbook' />
            <form onSubmit={handleSubmit} className='mx-auto max-w-4xl space-y-6 py-8'>
                <div>
                    <h1 className='text-3xl font-semibold tracking-tight'>Buat Logbook</h1>
                    <p className='mt-2 text-sm text-muted-foreground'>
                        Catat aktivitas harian Anda, detail pekerjaan, serta unggah dokumentasi pendukung.
                    </p>
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
                                <Input value={technician?.name ?? '—'} readOnly disabled className='bg-muted' />
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
                                <Select value={data.shift_id} onValueChange={handleShiftChange} disabled={activeShifts.length === 0}>
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
                                        placeholder={`Tuliskan aktivitas ke-${index + 1}...`}
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
                            Ukuran berkas maksimal {maxAttachmentSizeMb} MB per file. Format yang didukung: jpg, jpeg, png, webp.
                        </p>

                        <div className='space-y-2'>
                            <Label htmlFor='evidences'>Bukti Kegiatan</Label>
                            <Input
                                id='evidences'
                                name='evidences'
                                type='file'
                                accept='image/*'
                                multiple
                                onChange={(event) => handleEvidenceChange(event.target.files)}
                            />
                            <p className='text-sm text-muted-foreground'>
                                <Upload className='mr-1 inline h-4 w-4' /> {renderFileSummary(data.evidences)}
                            </p>
                            <InputError message={errorBag.evidences} />
                        </div>
                    </CardContent>
                </Card>

                <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
                    <Button type='submit' disabled={processing}>
                        {processing && <LoaderCircle className='mr-2 h-4 w-4 animate-spin' />}
                        {processing ? 'Menyimpan...' : 'Simpan Logbook'}
                    </Button>
                    {progress && <span className='text-sm text-muted-foreground'>Mengunggah {progress.percentage}%</span>}
                </div>
            </form>
        </AppLayout>
    );
}
