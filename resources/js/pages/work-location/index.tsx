import WorkLocationController from '@/actions/App/Http/Controllers/WorkLocationController';
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

export type WorkLocationRecord = App.Data.WorkLocation.WorkLocationData;

export type WorkLocationCollection = PaginationMeta & {
    data: App.Data.WorkLocation.WorkLocationData[];
};

interface WorkLocationIndexProps {
    workLocations: WorkLocationCollection;
    filters?: DataTableFilters | null;
    sort?: string | null;
    filteredData?: Record<string, unknown> | null;
    can: {
        create: boolean;
    };
}

export default function WorkLocationIndex({
    workLocations,
    filters = null,
    sort = null,
    filteredData: initialFilteredData = null,
    can,
}: WorkLocationIndexProps) {
    const resolveDestroyUrl = useCallback((id: number) => WorkLocationController.destroy(id).url, []);

    const handleDelete = useCallback(
        (id: number) => {
            confirm.delete('Tindakan ini tidak dapat dibatalkan. Hapus lokasi kerja ini?', () => {
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

    const columns = useMemo<(ColumnDef<WorkLocationRecord> & ColumnFilterMeta)[]>(
        () => [
            {
                id: 'name',
                accessorKey: 'name',
                header: 'Nama Lokasi',
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
                id: 'shifts_count',
                accessorKey: 'shifts_count',
                header: 'Jumlah Shift',
                cell: ({ getValue }) => {
                    const value = getValue();
                    if (value === null || value === undefined) {
                        return '0';
                    }

                    return String(value);
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
                                    <Link href={WorkLocationController.show(row.original.id).url} className='flex items-center gap-2 text-sm'>
                                        Detail
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={WorkLocationController.edit(row.original.id).url} className='flex items-center gap-2 text-sm'>
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
        [handleDelete],
    );

    return (
        <AppLayout>
            <Head title='Lokasi Kerja' />
            <div className='container mx-auto py-8'>
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                    <div>
                        <h1 className='text-3xl font-bold tracking-tight'>Lokasi Kerja</h1>
                        <p className='text-muted-foreground'>Kelola daftar lokasi kerja dan shift yang tersedia.</p>
                    </div>
                    {can.create && (
                        <div className='flex flex-wrap items-center gap-2 md:flex-nowrap'>
                            <Button asChild>
                                <Link href={WorkLocationController.create().url}>Tambah Lokasi</Link>
                            </Button>
                        </div>
                    )}
                </div>
                <DataTable<WorkLocationRecord>
                    title='Lokasi Kerja'
                    data={workLocations.data}
                    columns={columns}
                    pagination={workLocations}
                    filters={{
                        search: searchValue,
                        sort: activeSort,
                        columnFilters,
                    }}
                    filteredData={filteredData}
                    searchPlaceholder='Cari lokasi kerja…'
                    enableSearch
                    enableColumnFilters
                    enableMultiSort
                    routeFunction={WorkLocationController.index}
                    resetRoute={WorkLocationController.index().url}
                    emptyMessage='Belum ada lokasi kerja'
                    emptyDescription='Tambahkan lokasi kerja baru untuk mulai mengelola shift.'
                />
            </div>
        </AppLayout>
    );
}
