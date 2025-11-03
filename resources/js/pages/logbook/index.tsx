import LogbookController from '@/actions/App/Http/Controllers/LogbookController';
import ShiftController from '@/actions/App/Http/Controllers/ShiftController';
import UserController from '@/actions/App/Http/Controllers/UserController';
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

export type LogbookRecord = App.Data.Logbook.LogbookData;

export type LogbookCollection = PaginationMeta & {
    data: App.Data.Logbook.LogbookData[];
};

interface LogbookIndexProps {
    logbooks: LogbookCollection;
    filters?: DataTableFilters | null;
    sort?: string | null;
    filteredData?: Record<string, unknown> | null;
}

export default function LogbookIndex({ logbooks, filters = null, sort = null, filteredData: initialFilteredData = null }: LogbookIndexProps) {
    const resolveDestroyUrl = useCallback((id: number) => LogbookController.destroy(id).url, []);
    const handleDelete = useCallback(
        (id: number) => {
            confirm.delete(
                'Logbook beserta seluruh bukti kegiatan, foto digital, dan foto media sosial akan dihapus permanen. Tindakan ini tidak dapat dibatalkan. Lanjutkan?',
                () => {
                    router.delete(resolveDestroyUrl(id), {
                        preserveScroll: true,
                        preserveState: false,
                    });
                },
                'Konfirmasi Penghapusan Logbook',
            );
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
    const columns = useMemo<(ColumnDef<LogbookRecord> & ColumnFilterMeta)[]>(
        () => [
            {
                id: 'id',
                accessorKey: 'id',
                header: 'ID',
                cell: ({ row }) => <span className='text-sm font-medium text-foreground'>{row.original.id}</span>,
                enableSorting: true,
                enableFiltering: false,
            },
            {
                id: 'date',
                accessorKey: 'date',
                header: 'Date',
                cell: ({ getValue }) => {
                    const value = getValue() as unknown;
                    if (value === null || value === undefined) {
                        return '—';
                    }
                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'daterange', placeholder: 'Filter by date...' },
            },
            {
                id: 'additional_notes',
                accessorKey: 'additional_notes',
                header: 'Additional Notes',
                cell: ({ getValue }) => {
                    const value = getValue() as unknown;
                    if (value === null || value === undefined) {
                        return '—';
                    }
                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'text', placeholder: 'Filter by additional notes...' },
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: 'Created At',
                cell: ({ getValue }) => {
                    const value = getValue() as unknown;
                    if (value === null || value === undefined) {
                        return '—';
                    }
                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'daterange', placeholder: 'Filter by created at...' },
            },
            {
                id: 'updated_at',
                accessorKey: 'updated_at',
                header: 'Updated At',
                cell: ({ getValue }) => {
                    const value = getValue() as unknown;
                    if (value === null || value === undefined) {
                        return '—';
                    }
                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'daterange', placeholder: 'Filter by updated at...' },
            },
            {
                id: 'technician_id',
                accessorKey: 'technician_id',
                header: 'Technician',
                enableSorting: false,
                enableFiltering: true,
                filterOnly: true,
                filter: {
                    type: 'selector',
                    placeholder: 'Filter by technician...',
                    searchPlaceholder: 'Search technician...',
                    fetchDataUrl: UserController.index().url,
                    valueMapKey: 'technicianOptions',
                    idField: 'id',
                    labelField: 'name',
                },
            },
            {
                id: 'work_location_id',
                accessorKey: 'work_location_id',
                header: 'Work Location',
                enableSorting: false,
                enableFiltering: true,
                filterOnly: true,
                filter: {
                    type: 'selector',
                    placeholder: 'Filter by work location...',
                    searchPlaceholder: 'Search work location...',
                    fetchDataUrl: WorkLocationController.index().url,
                    valueMapKey: 'workLocationOptions',
                    idField: 'id',
                    labelField: 'name',
                },
            },
            {
                id: 'shift_id',
                accessorKey: 'shift_id',
                header: 'Shift',
                enableSorting: false,
                enableFiltering: true,
                filterOnly: true,
                filter: {
                    type: 'selector',
                    placeholder: 'Filter by shift...',
                    searchPlaceholder: 'Search shift...',
                    fetchDataUrl: ShiftController.index().url,
                    valueMapKey: 'shiftOptions',
                    idField: 'id',
                    labelField: 'name',
                },
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => (
                    <div className='flex justify-end'>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant='ghost' size='icon' className='h-8 w-8'>
                                    <MoreHorizontal className='h-4 w-4' />
                                    <span className='sr-only'>Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-40'>
                                <DropdownMenuItem asChild>
                                    <Link href={LogbookController.show(row.original.id).url} className='flex items-center gap-2 text-sm'>
                                        View
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={LogbookController.edit(row.original.id).url} className='flex items-center gap-2 text-sm'>
                                        Edit
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        handleDelete(row.original.id);
                                    }}
                                    className='flex items-center gap-2 text-sm text-destructive focus:text-destructive'
                                >
                                    Delete
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
            <Head title='Logbooks' />
            <div className='container mx-auto py-8'>
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                    <div>
                        <h1 className='text-3xl font-bold tracking-tight'>Logbooks</h1>
                        <p className='text-muted-foreground'>Manage logbooks in one place.</p>
                    </div>
                    <div className='flex flex-wrap items-center gap-2 md:flex-nowrap'>
                        <Button asChild>
                            <Link href={LogbookController.create().url}>New Logbook</Link>
                        </Button>
                    </div>
                </div>
                <DataTable<LogbookRecord>
                    title='Logbooks'
                    data={logbooks.data}
                    columns={columns}
                    pagination={logbooks}
                    filters={{
                        search: searchValue,
                        sort: activeSort,
                        columnFilters,
                    }}
                    filteredData={filteredData}
                    searchPlaceholder='Search logbooks...'
                    enableSearch
                    enableColumnFilters
                    enableMultiSort
                    routeFunction={LogbookController.index}
                    resetRoute={LogbookController.index().url}
                    emptyMessage='No logbooks found'
                    emptyDescription='Try adjusting your filters or create a new logbook'
                />
            </div>
        </AppLayout>
    );
}
