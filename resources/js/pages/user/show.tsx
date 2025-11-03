import UserController from '@/actions/App/Http/Controllers/UserController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';

export type UserRecord = App.Data.User.UserData;

interface UserShowProps {
    record: UserRecord;
    roleLabels: Record<string, string>;
}

export default function UserShow({ record, roleLabels }: UserShowProps) {
    const fallback = '—';
    const roleLabel = record.role ? (roleLabels[record.role] ?? record.role) : fallback;

    return (
        <AppLayout>
            <Head title={`Detail Pengguna - ${record.name ?? ''}`} />
            <div className='container mx-auto py-8'>
                <div className='mb-6 flex items-center justify-between'>
                    <div>
                        <h1 className='text-3xl font-bold tracking-tight'>Detail Pengguna</h1>
                        <p className='text-muted-foreground'>Informasi lengkap mengenai pengguna terpilih.</p>
                    </div>
                    <Button asChild variant='outline'>
                        <Link href={UserController.edit(record.id).url}>Ubah</Link>
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>{record.name ?? fallback}</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4 text-sm'>
                        <div>
                            <p className='font-medium text-muted-foreground'>Email</p>
                            <p className='text-base text-foreground'>{record.email ?? fallback}</p>
                        </div>
                        <div>
                            <p className='font-medium text-muted-foreground'>Username</p>
                            <p className='text-base text-foreground'>{record.username ?? fallback}</p>
                        </div>
                        <div>
                            <p className='font-medium text-muted-foreground'>Peran</p>
                            <p className='text-base text-foreground'>{roleLabel}</p>
                        </div>
                        <div className='grid gap-2 md:grid-cols-2'>
                            <div>
                                <p className='font-medium text-muted-foreground'>Dibuat</p>
                                <p className='text-base text-foreground'>{record.created_at ?? fallback}</p>
                            </div>
                            <div>
                                <p className='font-medium text-muted-foreground'>Diperbarui</p>
                                <p className='text-base text-foreground'>{record.updated_at ?? fallback}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
