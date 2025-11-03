import UserController from '@/actions/App/Http/Controllers/UserController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Form, Head } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

type RoleOption = {
    value: string;
    label: string;
};

export type UserRecord = App.Data.User.UserData;

interface UserEditProps {
    record: UserRecord;
    roles: RoleOption[];
}

export default function UserEdit({ record, roles }: UserEditProps) {
    const roleValue = useMemo(() => record.role ?? roles[0]?.value ?? '', [record.role, roles]);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const normalizeFieldValue = (value: unknown): string => {
        if (value === null || value === undefined) {
            return '';
        }

        if (typeof value === 'object') {
            try {
                return JSON.stringify(value, null, 2);
            } catch (_error) {
                return '';
            }
        }

        return String(value);
    };

    return (
        <AppLayout>
            <Head title='Ubah Pengguna' />
            <Form {...UserController.update.form(record.id)} options={{ preserveScroll: true }} className='p-8'>
                {({ errors, processing }) => (
                    <div className='space-y-6 rounded-xl border bg-card p-8 shadow-sm'>
                        <div className='space-y-2'>
                            <h1 className='text-2xl font-semibold tracking-tight'>Ubah Pengguna</h1>
                            <p className='text-sm text-muted-foreground'>Perbarui informasi pengguna atau sesuaikan perannya.</p>
                        </div>
                        <div className='grid gap-6'>
                            <div className='grid gap-2'>
                                <Label htmlFor='name'>Nama</Label>
                                <Input
                                    id='name'
                                    name='name'
                                    type='text'
                                    defaultValue={normalizeFieldValue(record.name)}
                                    required
                                    autoComplete='name'
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className='grid gap-2'>
                                <Label htmlFor='username'>Username</Label>
                                <Input
                                    id='username'
                                    name='username'
                                    type='text'
                                    defaultValue={normalizeFieldValue(record.username)}
                                    required
                                    autoComplete='username'
                                />
                                <InputError message={errors.username} />
                            </div>
                            <div className='grid gap-2'>
                                <Label htmlFor='email'>Email</Label>
                                <Input
                                    id='email'
                                    name='email'
                                    type='email'
                                    defaultValue={normalizeFieldValue(record.email)}
                                    required
                                    autoComplete='email'
                                />
                                <InputError message={errors.email} />
                            </div>
                            <div className='grid gap-2'>
                                <Label htmlFor='role'>Peran</Label>
                                <select
                                    id='role'
                                    name='role'
                                    defaultValue={roleValue}
                                    required
                                    className='h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                                >
                                    {roles.map((role) => (
                                        <option key={role.value} value={role.value}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.role} />
                            </div>
                            <div className='grid gap-2'>
                                <Label htmlFor='password'>Kata Sandi</Label>
                                <div className='relative'>
                                    <Input
                                        id='password'
                                        name='password'
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete='new-password'
                                        placeholder='Biarkan kosong jika tidak berubah'
                                        className='pr-10'
                                    />
                                    <button
                                        type='button'
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className='absolute inset-y-0 right-2 inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none'
                                        aria-pressed={showPassword}
                                        aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                    >
                                        {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                                    </button>
                                </div>
                                <span className='text-xs text-muted-foreground'>Biarkan kosong jika tidak ingin mengubah kata sandi.</span>
                                <InputError message={errors.password} />
                            </div>
                            <div className='grid gap-2'>
                                <Label htmlFor='password_confirmation'>Konfirmasi Kata Sandi</Label>
                                <div className='relative'>
                                    <Input
                                        id='password_confirmation'
                                        name='password_confirmation'
                                        type={showPasswordConfirmation ? 'text' : 'password'}
                                        autoComplete='new-password'
                                        placeholder='Ulangi kata sandi baru'
                                        className='pr-10'
                                    />
                                    <button
                                        type='button'
                                        onClick={() => setShowPasswordConfirmation((prev) => !prev)}
                                        className='absolute inset-y-0 right-2 inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none'
                                        aria-pressed={showPasswordConfirmation}
                                        aria-label={
                                            showPasswordConfirmation ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'
                                        }
                                    >
                                        {showPasswordConfirmation ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                                    </button>
                                </div>
                                <InputError message={errors.password_confirmation} />
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
