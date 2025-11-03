import UserController from '@/actions/App/Http/Controllers/UserController';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnFilterMeta, DataTableFilters, PaginationMeta } from '@/components/ui/data-table-types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { confirm } from '@/lib/confirmation-utils';
import { Head, Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useCallback, useMemo } from 'react';

export type UserRecord = App.Data.User.UserData;

export type UserCollection = PaginationMeta & {
    data: App.Data.User.UserData[];
};

type CanAbilities = {
    create: boolean;
};

interface UserIndexProps {
    users: UserCollection;
    filters?: DataTableFilters | null;
    sort?: string | null;
    filteredData?: Record<string, unknown> | null;
    roleLabels: Record<string, string>;
    can: CanAbilities;
}

export default function UserIndex({ users, filters = null, sort = null, filteredData: initialFilteredData = null, roleLabels, can }: UserIndexProps) {
    const resolveDestroyUrl = useCallback((id: number) => UserController.destroy(id).url, []);
    const handleDelete = useCallback(
        (id: number) => {
            confirm.delete('Tindakan ini tidak dapat dibatalkan. Hapus pengguna ini?', () => {
                router.delete(resolveDestroyUrl(id), {
                    preserveScroll: true,
                    preserveState: false,
                });
            });
        },
        [resolveDestroyUrl],
    );

    const filteredData = initialFilteredData ?? undefined;
    const searchValue = typeof filters?.search === 'string' ? filters.search : '';
    const activeSort = typeof sort === 'string' ? sort : undefined;
    const columnFilters =
        filters?.columnFilters && typeof filters.columnFilters === 'object' && !Array.isArray(filters.columnFilters)
            ? (filters.columnFilters as Record<string, unknown>)
            : {};

    const columns = useMemo<(ColumnDef<UserRecord> & ColumnFilterMeta)[]>(
        () => [
            {
                id: 'name',
                accessorKey: 'name',
                header: 'Nama',
                cell: ({ getValue }) => {
                    const value = getValue();
                    if (value === null || value === undefined) {
                        return '—';
                    }

                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'text', placeholder: 'Cari berdasarkan nama…' },
            },
            {
                id: 'username',
                accessorKey: 'username',
                header: 'Username',
                cell: ({ getValue }) => {
                    const value = getValue();
                    if (value === null || value === undefined) {
                        return '—';
                    }

                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'text', placeholder: 'Cari berdasarkan username…' },
            },
            {
                id: 'email',
                accessorKey: 'email',
                header: 'Email',
                cell: ({ getValue }) => {
                    const value = getValue();
                    if (value === null || value === undefined) {
                        return '—';
                    }

                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'text', placeholder: 'Cari berdasarkan email…' },
            },
            {
                id: 'role',
                accessorKey: 'role',
                header: 'Peran',
                cell: ({ getValue }) => {
                    const value = getValue();
                    if (value === null || value === undefined) {
                        return '—';
                    }

                    return roleLabels[String(value)] ?? String(value);
                },
                enableSorting: true,
                enableFiltering: false,
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: 'Dibuat',
                cell: ({ getValue }) => {
                    const value = getValue();
                    if (value === null || value === undefined) {
                        return '—';
                    }

                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'daterange', placeholder: 'Saring berdasarkan tanggal dibuat…' },
            },
            {
                id: 'updated_at',
                accessorKey: 'updated_at',
                header: 'Diperbarui',
                cell: ({ getValue }) => {
                    const value = getValue();
                    if (value === null || value === undefined) {
                        return '—';
                    }

                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'daterange', placeholder: 'Saring berdasarkan tanggal diperbarui…' },
            },
            {
                id: 'actions',
                header: 'Aksi',
                cell: ({ row }) => (
                    <div className='flex justify-end'>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant='ghost' size='icon' className='h-8 w-8'>
                                    <MoreHorizontal className='h-4 w-4' />
                                    <span className='sr-only'>Buka menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-40'>
                                <DropdownMenuItem asChild>
                                    <Link href={UserController.show(row.original.id).url} className='flex items-center gap-2 text-sm'>
                                        Detail
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={UserController.edit(row.original.id).url} className='flex items-center gap-2 text-sm'>
                                        Ubah
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        handleDelete(row.original.id);
                                    }}
                                    className='flex items-center gap-2 text-sm text-destructive focus:text-destructive'
                                >
                                    Hapus
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ),
                enableSorting: false,
                enableFiltering: false,
            },
        ],
        [handleDelete, roleLabels],
    );

    return (
        <AppLayout>
            <Head title='Pengguna' />
            <div className='container mx-auto py-8'>
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                    <div>
                        <h1 className='text-3xl font-bold tracking-tight'>Pengguna</h1>
                        <p className='text-muted-foreground'>Kelola akun pengguna dan perannya.</p>
                    </div>
                    {can.create && (
                        <div className='flex flex-wrap items-center gap-2 md:flex-nowrap'>
                            <Button asChild>
                                <Link href={UserController.create().url}>Tambah Pengguna</Link>
                            </Button>
                        </div>
                    )}
                </div>
                <DataTable<UserRecord>
                    title='Pengguna'
                    data={users.data}
                    columns={columns}
                    pagination={users}
                    filters={{
                        search: searchValue,
                        sort: activeSort,
                        columnFilters,
                    }}
                    filteredData={filteredData}
                    searchPlaceholder='Cari pengguna…'
                    enableSearch
                    enableColumnFilters
                    enableMultiSort
                    routeFunction={UserController.index}
                    resetRoute={UserController.index().url}
                    emptyMessage='Belum ada pengguna'
                    emptyDescription='Tambahkan pengguna baru untuk mulai mengelola tim.'
                />
            </div>
        </AppLayout>
    );
}
