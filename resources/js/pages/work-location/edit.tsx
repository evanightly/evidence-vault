import WorkLocationController from '@/actions/App/Http/Controllers/WorkLocationController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
export type WorkLocationRecord = App.Data.WorkLocation.WorkLocationData;

interface WorkLocationEditProps {
    record: WorkLocationRecord;
}

export default function WorkLocationEdit({ record }: WorkLocationEditProps) {
    const nameValue = record.name ?? '';

    return (
        <AppLayout>
            <Head title='Ubah Lokasi Kerja' />
            <Form {...WorkLocationController.update.form(record.id)} options={{ preserveScroll: true }} className='p-8'>
                {({ errors, processing }) => (
                    <div className='space-y-6 rounded-xl border bg-card p-8 shadow-sm'>
                        <div className='space-y-2'>
                            <h1 className='text-2xl font-semibold tracking-tight'>Ubah Lokasi Kerja</h1>
                            <p className='text-sm text-muted-foreground'>Perbarui nama lokasi kerja jika terjadi perubahan penamaan.</p>
                        </div>
                        <div className='grid gap-6'>
                            <div className='grid gap-2'>
                                <Label htmlFor='name'>Nama Lokasi</Label>
                                <Input id='name' name='name' type='text' required defaultValue={nameValue} autoComplete='off' />
                                <InputError message={errors.name} />
                            </div>
                        </div>
                        <Button type='submit' disabled={processing} className='w-full sm:w-auto'>
                            {processing && <LoaderCircle className='mr-2 h-4 w-4 animate-spin' />}
                            {processing ? 'Menyimpan…' : 'Simpan perubahan'}
                        </Button>
                    </div>
                )}
            </Form>
        </AppLayout>
    );
}
