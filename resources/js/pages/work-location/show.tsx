import WorkLocationController from '@/actions/App/Http/Controllers/WorkLocationController';
import WorkLocationShiftController from '@/actions/App/Http/Controllers/WorkLocationShiftController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { confirm } from '@/lib/confirmation-utils';
import { Form, Head, Link, router } from '@inertiajs/react';
import { LoaderCircle, Pencil, Trash2, X } from 'lucide-react';
import { Fragment, useCallback, useState } from 'react';

export type WorkLocationRecord = App.Data.WorkLocation.WorkLocationData;
export type ShiftRecord = App.Data.Shift.ShiftData;

interface WorkLocationShowProps {
    record: WorkLocationRecord;
    shifts: ShiftRecord[];
    can: {
        update: boolean;
        delete: boolean;
    };
}

export default function WorkLocationShow({ record, shifts, can }: WorkLocationShowProps) {
    const [editingShiftId, setEditingShiftId] = useState<number | null>(null);

    const handleDeleteShift = useCallback(
        (shiftId: number) => {
            confirm.delete('Tindakan ini tidak dapat dibatalkan. Hapus shift ini?', () => {
                router.delete(WorkLocationShiftController.destroy({ work_location: record.id, shift: shiftId }).url, {
                    preserveScroll: true,
                    preserveState: false,
                });
            });
        },
        [record.id],
    );

    return (
        <AppLayout>
            <Head title={`Lokasi Kerja - ${record.name ?? ''}`} />
            <div className='container mx-auto space-y-6 py-8'>
                <div className='flex items-center justify-between'>
                    <div>
                        <h1 className='text-3xl font-bold tracking-tight'>Detail Lokasi Kerja</h1>
                        <p className='text-muted-foreground'>Atur shift yang tersedia untuk lokasi kerja ini.</p>
                    </div>
                    {can.update && (
                        <Button variant='outline' asChild>
                            <Link href={WorkLocationController.edit(record.id).url}>Ubah Lokasi</Link>
                        </Button>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Lokasi</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4 text-sm'>
                        <div>
                            <p className='font-medium text-muted-foreground'>Nama</p>
                            <p className='text-base text-foreground'>{record.name ?? '—'}</p>
                        </div>
                        <div className='grid gap-2 md:grid-cols-2'>
                            <div>
                                <p className='font-medium text-muted-foreground'>Total Shift</p>
                                <p className='text-base text-foreground'>{record.shifts_count?.toString() ?? '0'}</p>
                            </div>
                            <div>
                                <p className='font-medium text-muted-foreground'>Terakhir Diperbarui</p>
                                <p className='text-base text-foreground'>{record.updated_at ?? '—'}</p>
                            </div>
                        </div>
                        <div className='grid gap-2 md:grid-cols-2'>
                            <div>
                                <p className='font-medium text-muted-foreground'>Dibuat</p>
                                <p className='text-base text-foreground'>{record.created_at ?? '—'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Shift</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                        {can.update && (
                            <Form
                                {...WorkLocationShiftController.store.form(record.id)}
                                options={{ preserveScroll: true }}
                                className='rounded-lg border p-4 shadow-sm'
                            >
                                {({ errors, processing }) => (
                                    <div className='grid gap-4 md:grid-cols-4 md:items-end'>
                                        <div className='md:col-span-2'>
                                            <Label htmlFor='name'>Nama Shift</Label>
                                            <Input id='name' name='name' placeholder='Contoh: Pagi' required autoComplete='off' />
                                            <InputError message={errors.name} />
                                        </div>
                                        <div>
                                            <Label htmlFor='start_time'>Mulai</Label>
                                            <Input id='start_time' name='start_time' type='time' required />
                                            <InputError message={errors.start_time} />
                                        </div>
                                        <div>
                                            <Label htmlFor='end_time'>Selesai</Label>
                                            <Input id='end_time' name='end_time' type='time' required />
                                            <InputError message={errors.end_time} />
                                        </div>
                                        <div className='flex items-center gap-2 md:col-span-4'>
                                            <Button type='submit' disabled={processing}>
                                                {processing && <LoaderCircle className='mr-2 h-4 w-4 animate-spin' />}
                                                {processing ? 'Menambahkan…' : 'Tambah Shift'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Form>
                        )}

                        <div className='overflow-hidden rounded-lg border'>
                            <table className='min-w-full divide-y divide-border text-sm'>
                                <thead className='bg-muted/50'>
                                    <tr>
                                        <th className='px-4 py-3 text-left font-medium text-muted-foreground'>Nama</th>
                                        <th className='px-4 py-3 text-left font-medium text-muted-foreground'>Rentang Waktu</th>
                                        {can.update && <th className='px-4 py-3 text-right font-medium text-muted-foreground'>Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-border bg-background'>
                                    {shifts.length === 0 && (
                                        <tr>
                                            <td className='px-4 py-6 text-center text-muted-foreground' colSpan={can.update ? 3 : 2}>
                                                Belum ada shift untuk lokasi ini.
                                            </td>
                                        </tr>
                                    )}

                                    {shifts.map((shift) => (
                                        <Fragment key={shift.id}>
                                            <tr>
                                                <td className='px-4 py-3 align-top'>{shift.name ?? '—'}</td>
                                                <td className='px-4 py-3 align-top'>{shift.time_range_label ?? '—'}</td>
                                                {can.update && (
                                                    <td className='flex justify-end gap-2 px-4 py-3'>
                                                        <Button
                                                            type='button'
                                                            variant='ghost'
                                                            size='icon'
                                                            onClick={() =>
                                                                setEditingShiftId((current) => (current === shift.id ? null : Number(shift.id)))
                                                            }
                                                        >
                                                            {editingShiftId === shift.id ? <X className='h-4 w-4' /> : <Pencil className='h-4 w-4' />}
                                                            <span className='sr-only'>Ubah shift</span>
                                                        </Button>
                                                        <Button
                                                            type='button'
                                                            variant='ghost'
                                                            size='icon'
                                                            onClick={() => handleDeleteShift(Number(shift.id))}
                                                        >
                                                            <Trash2 className='h-4 w-4' />
                                                            <span className='sr-only'>Hapus shift</span>
                                                        </Button>
                                                    </td>
                                                )}
                                            </tr>
                                            {can.update && editingShiftId === shift.id && (
                                                <tr>
                                                    <td colSpan={3} className='bg-muted/30 px-4 py-4'>
                                                        <Form
                                                            {...WorkLocationShiftController.update.form({
                                                                work_location: record.id,
                                                                shift: shift.id,
                                                            })}
                                                            options={{ preserveScroll: true }}
                                                            className='grid gap-4 md:grid-cols-4 md:items-end'
                                                        >
                                                            {({ errors, processing }) => (
                                                                <>
                                                                    <div className='md:col-span-2'>
                                                                        <Label htmlFor={`name-${shift.id}`}>Nama Shift</Label>
                                                                        <Input
                                                                            id={`name-${shift.id}`}
                                                                            name='name'
                                                                            defaultValue={shift.name ?? ''}
                                                                            required
                                                                            autoComplete='off'
                                                                        />
                                                                        <InputError message={errors.name} />
                                                                    </div>
                                                                    <div>
                                                                        <Label htmlFor={`start_time-${shift.id}`}>Mulai</Label>
                                                                        <Input
                                                                            id={`start_time-${shift.id}`}
                                                                            name='start_time'
                                                                            type='time'
                                                                            defaultValue={shift.start_time ?? ''}
                                                                            required
                                                                        />
                                                                        <InputError message={errors.start_time} />
                                                                    </div>
                                                                    <div>
                                                                        <Label htmlFor={`end_time-${shift.id}`}>Selesai</Label>
                                                                        <Input
                                                                            id={`end_time-${shift.id}`}
                                                                            name='end_time'
                                                                            type='time'
                                                                            defaultValue={shift.end_time ?? ''}
                                                                            required
                                                                        />
                                                                        <InputError message={errors.end_time} />
                                                                    </div>
                                                                    <div className='flex items-center gap-2 md:col-span-4'>
                                                                        <Button type='submit' disabled={processing}>
                                                                            {processing && <LoaderCircle className='mr-2 h-4 w-4 animate-spin' />}
                                                                            {processing ? 'Menyimpan…' : 'Simpan perubahan'}
                                                                        </Button>
                                                                        <Button
                                                                            type='button'
                                                                            variant='secondary'
                                                                            onClick={() => setEditingShiftId(null)}
                                                                        >
                                                                            Batalkan
                                                                        </Button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </Form>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {can.delete && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Hapus Lokasi</CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-4 text-sm'>
                            <p className='text-muted-foreground'>Menghapus lokasi akan menghapus seluruh shift yang terkait.</p>
                            <Button
                                type='button'
                                variant='destructive'
                                onClick={() =>
                                    confirm.delete('Menghapus lokasi akan menghapus seluruh shift di dalamnya. Lanjutkan?', () => {
                                        router.delete(WorkLocationController.destroy(record.id).url, {
                                            preserveScroll: true,
                                            preserveState: false,
                                        });
                                    })
                                }
                            >
                                Hapus Lokasi
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
