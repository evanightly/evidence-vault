import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnFilterComponent } from '@/components/ui/column-filters';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTableMultiSort } from '@/components/ui/data-table-multi-sort';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table';
import { useDebounce } from '@uidotdev/usehooks';
import { Columns, MoreHorizontal, RotateCcw, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ActiveFilter, ColumnFilterMeta, DataTableAction, DataTableBulkAction, DataTableFilters, PaginationMeta } from './data-table-types';

interface DataTableProps<TData extends Record<string, any>> {
    title: string;
    description?: string;
    data: TData[];
    columns: (ColumnDef<TData> & ColumnFilterMeta)[];
    actionBulkButtons?: DataTableBulkAction<TData>[];
    pagination?: PaginationMeta;
    filters?: DataTableFilters;
    onFiltersChange?: (filters: DataTableFilters) => void;
    searchPlaceholder?: string;
    enableSearch?: boolean;
    enableFilters?: boolean;
    enableColumnFilters?: boolean;
    enableMultiSort?: boolean;
    enablePagination?: boolean;
    loading?: boolean;
    emptyMessage?: string;
    emptyDescription?: string;
    createButton?: {
        label: string;
        href: string;
    };
    additionalToolbar?: React.ReactNode;
    routeFunction?: (options?: any) => { url: string; method: string };
    resetRoute?: string | (() => string);
    filteredData?: Record<string, any>;
}

function parseSortString(sortString?: string | null): SortingState {
    if (!sortString || typeof sortString !== 'string') return [];
    return sortString
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => ({ id: p.replace(/^-/, ''), desc: p.startsWith('-') }));
}

function stringifySorting(sorting: SortingState): string {
    return sorting.map((s) => (s.desc ? `-${s.id}` : s.id)).join(',');
}

function resolveColumnId(column: { id?: unknown; accessorKey?: unknown }, fallbackIndex: number): string {
    if (typeof column.id === 'string' && column.id.length > 0) {
        return column.id;
    }

    if (typeof column.id === 'number') {
        return column.id.toString();
    }

    if (typeof column.accessorKey === 'string' && column.accessorKey.length > 0) {
        return column.accessorKey;
    }

    if (typeof column.accessorKey === 'number') {
        return column.accessorKey.toString();
    }

    return `column-${fallbackIndex}`;
}

import { qp } from '@/lib/qp';

export function DataTable<TData extends Record<string, any>>({
    title,
    description,
    data,
    columns,
    actionBulkButtons = [],
    pagination,
    filters = {},
    onFiltersChange,
    searchPlaceholder = 'Search...',
    enableSearch = true,
    enableFilters = true,
    filteredData,
    enableColumnFilters = true,
    enableMultiSort = true,
    enablePagination = true,
    loading = false,
    emptyMessage = 'No data found',
    emptyDescription = 'No results match your search criteria.',
    createButton,
    additionalToolbar,
    routeFunction,
    resetRoute,
}: DataTableProps<TData>) {
    // --- State
    const getInitialSearch = () => {
        if (filters.search) return filters.search;
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            // Prefer nested filter[search]
            return urlParams.get('filter[search]') || '';
        }
        return '';
    };

    const [search, setSearch] = useState(getInitialSearch());
    const [columnFilters, setColumnFilters] = useState<Record<string, any>>(() => {
        const source = filters.columnFilters;
        if (!source || typeof source !== 'object' || Array.isArray(source)) {
            return {};
        }

        return Object.fromEntries(
            Object.entries(source as Record<string, any>).filter(([key]) =>
                typeof key === 'string' && key.length > 0 && key !== 'undefined',
            ),
        );
    });
    const [sorting, setSorting] = useState<SortingState>(() => parseSortString((filters as any).sort));
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() =>
        columns
            .filter((c) => !c.filterOnly)
            .reduce((acc, col, index) => {
                const key = resolveColumnId(col, index);
                acc[key] = true;
                return acc;
            }, {} as Record<string, boolean>),
    );
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

    const debouncedSearch = useDebounce(search, 300);
    const debouncedColumnFilters = useDebounce(columnFilters, 300);

    // --- URL sync (Wayfinder mergeQuery)
    useEffect(() => {
        syncQuery();
    }, [debouncedSearch, debouncedColumnFilters]);

    const syncQuery = (extra?: Record<string, any>) => {
        const filterPayload: Record<string, any> = {};
        Object.entries(debouncedColumnFilters).forEach(([key, value]) => {
            if (!key || key === 'undefined') {
                return;
            }
            filterPayload[key] = value;
        });
        if (debouncedSearch && debouncedSearch.trim().length > 0) filterPayload.search = debouncedSearch.trim();

        const sortString = stringifySorting(sorting).trim();

        // Exclude non-URL fields like `sorts` to prevent [object Object] in query string
        const { sorts: _omitSorts, ...extraForUrl } = extra || {};

        const query: Record<string, any> = {
            ...(Object.keys(filterPayload).length > 0 ? { filter: filterPayload } : {}),
            ...(sortString ? { sort: sortString } : {}),
            ...(filters.per_page ? { per_page: filters.per_page } : {}),
            ...(filters.page ? { page: filters.page } : {}),
            ...(extraForUrl || {}),
        };

        if (onFiltersChange) {
            onFiltersChange({
                ...filters,
                search: filterPayload.search,
                columnFilters: { ...filterPayload, search: undefined },
                sort: sortString || undefined,
                ...extra,
            });
            return;
        }

        if (routeFunction) {
            const base = routeFunction().url;
            const url = qp(base, { merge: query });
            router.get(url, {}, { preserveState: true, replace: true, preserveScroll: true });
        } else if (typeof window !== 'undefined') {
            const currentUrl = new URL(window.location.href);
            currentUrl.search = '';
            // Fallback: manually serialize nested filter
            Object.entries(query).forEach(([key, value]) => {
                if (key === 'filter' && value && typeof value === 'object') {
                    Object.entries(value as Record<string, any>).forEach(([k, v]) => {
                        if (v !== undefined && v !== null && v !== '') {
                            currentUrl.searchParams.set(`filter[${k}]`, Array.isArray(v) ? v.join(',') : String(v));
                        }
                    });
                } else if (value !== undefined && value !== null && value !== '') {
                    currentUrl.searchParams.set(key, String(value));
                }
            });
            router.get(currentUrl.toString(), {}, { preserveState: true, replace: true, preserveScroll: true });
        }
    };

    // Sorting change -> prefer descending on first click and sync URL with the new state immediately
    const handleSortingChange = (updater: SortingState | ((old: SortingState) => SortingState)) => {
        setSorting((old) => {
            const computedNext: SortingState = typeof updater === 'function' ? (updater as any)(old) : updater;

            // Prefer descending on first click for any newly added sort columns
            const oldIds = new Set(old.map((s) => s.id));
            const nextFixed: SortingState = computedNext.map((s) => {
                if (!oldIds.has(s.id) && s.desc === false) {
                    return { ...s, desc: true };
                }
                return s;
            });

            // Sync URL immediately with the resolved next sorting
            const sortString = stringifySorting(nextFixed);
            syncQuery({ page: 1, sort: sortString || undefined });
            return nextFixed;
        });
    };

    // Pagination helpers
    const getVisiblePages = () => {
        if (!pagination) return [] as number[];
        const current = pagination.current_page;
        const last = pagination.last_page;
        const delta = 2;
        const range: number[] = [];
        for (let i = Math.max(1, current - delta); i <= Math.min(last, current + delta); i++) {
            range.push(i);
        }
        return range;
    };

    const handlePageChange = (targetPage: number) => {
        if (!pagination) return;
        const url = new URL(pagination.path, window.location.origin);
        url.searchParams.set('page', String(targetPage));
        if (filters.per_page) url.searchParams.set('per_page', String(filters.per_page));
        if (onFiltersChange) {
            onFiltersChange({ ...filters, page: targetPage });
        } else if (routeFunction) {
            const base = routeFunction().url;
            const url = qp(base, { merge: { page: targetPage } });
            router.get(url, {}, { preserveState: true, preserveScroll: true });
        } else {
            router.get(url.toString(), {}, { preserveState: true, preserveScroll: true });
        }
    };

    const handlePerPageChange = (perPage: string) => {
        const pageSize = parseInt(perPage);
        if (onFiltersChange) {
            onFiltersChange({ ...filters, per_page: pageSize, page: 1 });
        } else if (routeFunction) {
            const base = routeFunction().url;
            const url = qp(base, { merge: { per_page: pageSize, page: 1 } });
            router.get(url, {}, { preserveState: true, preserveScroll: true });
        } else if (pagination) {
            const url = new URL(pagination.path, window.location.origin);
            url.searchParams.set('per_page', String(pageSize));
            url.searchParams.set('page', '1');
            router.get(url.toString(), {}, { preserveState: true, preserveScroll: true });
        }
    };

    const handleColumnFilterChange = (columnId: string, value: any) => {
        if (!columnId || columnId === 'undefined') {
            return;
        }

        const next = { ...columnFilters };
        const isClearing = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
        if (isClearing) {
            delete next[columnId];
        } else {
            next[columnId] = value;
        }
        setColumnFilters(next);
        if (onFiltersChange) {
            onFiltersChange({ ...filters, columnFilters: next, page: 1 });
        } else if (routeFunction) {
            const base = routeFunction().url;
            const url = qp(base, {
                merge: isClearing ? { page: 1 } : { page: 1, filter: { [columnId]: value } },
                remove: isClearing ? { filter: [columnId] } : undefined,
            });
            router.get(url, {}, { preserveState: true, preserveScroll: true });
        } else if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (isClearing) {
                url.searchParams.delete(`filter[${columnId}]`);
            } else {
                url.searchParams.set(`filter[${columnId}]`, Array.isArray(value) ? value.join(',') : String(value));
            }
            url.searchParams.set('page', '1');
            router.get(url.toString(), {}, { preserveState: true, preserveScroll: true });
        }
    };

    const clearAllFilters = () => {
        setSearch('');
        setColumnFilters({});
        setSorting([]);
        if (onFiltersChange) {
            onFiltersChange({ search: '', columnFilters: {}, sort: undefined });
        } else if (routeFunction) {
            const clean = routeFunction();
            router.get(clean.url, {}, { preserveState: true });
        } else if (typeof window !== 'undefined') {
            const currentUrl = new URL(window.location.href);
            currentUrl.search = '';
            router.get(currentUrl.toString(), {}, { preserveState: true });
        }
    };

    const resetFilters = () => {
        const url = typeof resetRoute === 'function' ? resetRoute() : resetRoute;
        if (url) {
            router.get(url, {}, { preserveState: false });
        } else if (routeFunction) {
            const base = routeFunction().url;
            const clean = qp(base, { reset: true });
            router.get(clean, {}, { preserveState: false });
        } else if (typeof window !== 'undefined') {
            const currentUrl = new URL(window.location.href);
            currentUrl.search = '';
            router.get(currentUrl.toString(), {}, { preserveState: false });
        }
    };

    // Active filters for chips (supports custom getDisplayValue or generic valueMapKey mapping)
    const getActiveFilters = (): ActiveFilter[] => {
        const active: ActiveFilter[] = [];
        if (search) {
            active.push({ column: 'search', label: 'Search', value: search, type: 'text' });
        }
        Object.entries(columnFilters).forEach(([columnId, rawVal]) => {
            if (rawVal === undefined || rawVal === null || rawVal === '' || (Array.isArray(rawVal) && rawVal.length === 0)) {
                return;
            }
            const col = columns.find((c, columnIndex) => resolveColumnId(c, columnIndex) === columnId);
            if (!col) return;
            let valueDisplay: string;
            if (col.filter?.getDisplayValue) {
                const custom = col.filter.getDisplayValue(rawVal);
                valueDisplay = (custom ?? '').toString();
            } else if (col.filter?.valueMapKey && filteredData?.[col.filter.valueMapKey]) {
                const source = filteredData[col.filter.valueMapKey];
                if (Array.isArray(source)) {
                    const idField = col.filter.idField || 'id';
                    const labelField = col.filter.labelField || 'name';
                    const map = new Map(source.map((item: any) => [String(item[idField]), item[labelField]]));
                    const ids = Array.isArray(rawVal) ? rawVal.map(String) : String(rawVal).split(',');
                    valueDisplay = ids.map((id) => map.get(id) || id).join(', ');
                } else {
                    valueDisplay = Array.isArray(rawVal) ? rawVal.join(', ') : String(rawVal);
                }
            } else if (Array.isArray(rawVal)) {
                valueDisplay = rawVal.join(', ');
            } else if (typeof rawVal === 'object') {
                // daterange special-case
                if (col.filter?.type === 'daterange' && (rawVal as any).from) {
                    const from = (rawVal as any).from;
                    const to = (rawVal as any).to;
                    valueDisplay = to ? `${from} – ${to}` : from;
                } else {
                    valueDisplay = JSON.stringify(rawVal);
                }
            } else {
                valueDisplay = String(rawVal);
            }
            active.push({ column: columnId, type: col.filter?.type || 'text', value: valueDisplay, label: (col.header as any) || columnId });
        });
        return active;
    };

    // Columns already native; just filter out virtual filter-only ones. If a column has a header string and no custom header renderer, wrap it.
    const tanColumns = useMemo<ColumnDef<TData>[]>(
        () =>
            columns
                .filter((c) => !c.filterOnly)
                .map((c) => {
                    const allowSort = (c as any).enableSorting !== false;
                    // Only inject header if user didn't already supply one via columnDef.header function
                    if (typeof c.header === 'string') {
                        const headerText = c.header;
                        return {
                            ...c,
                            header: ({ column }) =>
                                allowSort ? (
                                    <DataTableColumnHeader column={column as any} title={headerText} enableMultiSort={enableMultiSort} />
                                ) : (
                                    <div className='px-2'>{headerText}</div>
                                ),
                        } as ColumnDef<TData>;
                    }
                    return c as ColumnDef<TData>;
                }),
        [columns, enableMultiSort],
    );

    // --- Table Instance
    const table = useReactTable({
        data,
        columns: tanColumns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
        },
        enableMultiSort,
        manualSorting: true,
        manualFiltering: true,
        manualPagination: true,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: handleSortingChange,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getRowId: (originalRow, index) => (originalRow as any)?.id?.toString?.() ?? String(index),
    });

    // Selected rows (original data)
    const selectedRows = table.getSelectedRowModel().flatRows.map((r) => r.original as TData);

    return (
        <div className='container mx-auto space-y-8 py-8'>
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        {title}
                        {pagination && <Badge variant='secondary'>{pagination.total}</Badge>}
                    </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                    {/* Bulk Actions */}
                    {selectedRows.length > 0 && actionBulkButtons.length > 0 && (
                        <div className='flex items-center justify-between gap-4 rounded-md border border-border bg-muted/50 p-3'>
                            <div className='flex items-center gap-2'>
                                <Badge variant='secondary'>{selectedRows.length} selected</Badge>
                                <span className='text-sm text-muted-foreground'>of {data.length} rows</span>
                            </div>
                            <div className='flex items-center gap-2'>
                                {actionBulkButtons.map((ActionComponent, index) => (
                                    <ActionComponent key={index} selectedRows={selectedRows} />
                                ))}
                                <Button variant='outline' size='sm' onClick={() => table.resetRowSelection()}>
                                    Clear Selection
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Toolbar */}
                    {(enableSearch || enableColumnFilters || enableMultiSort) && (
                        <div className='flex items-center justify-between gap-4 border-b pb-4'>
                            <div className='flex items-center gap-2'>
                                {enableSearch && (
                                    <div className='relative'>
                                        <Search className='absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground' />
                                        <Input
                                            placeholder={searchPlaceholder}
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className='h-9 w-[250px] pl-8'
                                        />
                                    </div>
                                )}
                                {enableColumnFilters &&
                                    columns
                                        .filter((col) => col.enableFiltering)
                                        .map((column, columnIndex) => {
                                            const columnId = resolveColumnId(column, columnIndex);
                                            return (
                                                <ColumnFilterComponent
                                                    key={columnId}
                                                    column={{ id: columnId, header: (column as any).header as any }}
                                                    filter={column.filter!}
                                                    value={columnFilters[columnId]}
                                                    onChange={(value) => handleColumnFilterChange(columnId, value)}
                                                    onClear={() => handleColumnFilterChange(columnId, undefined)}
                                                />
                                            );
                                        })}

                                {Object.keys(columnFilters).length > 0 && (
                                    <Button type='button' variant='outline' onClick={clearAllFilters} size='sm'>
                                        <X className='mr-2 h-3 w-3' />
                                        Clear Filters
                                    </Button>
                                )}

                                {resetRoute && (
                                    <Button type='button' variant='outline' onClick={resetFilters} size='sm'>
                                        <RotateCcw className='mr-2 h-3 w-3' />
                                        Reset All
                                    </Button>
                                )}
                            </div>

                            <div className='flex items-center gap-2'>
                                {enableMultiSort && <DataTableMultiSort columns={columns} sorting={sorting} onSortingChange={handleSortingChange} />}

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant='outline' size='sm'>
                                            <Columns className='mr-2 h-4 w-4' />
                                            Columns
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align='end'>
                                        {table.getAllLeafColumns().map((col) => (
                                            <DropdownMenuCheckboxItem
                                                key={col.id}
                                                onSelect={(e) => e.preventDefault()}
                                                className='capitalize'
                                                checked={col.getIsVisible()}
                                                onCheckedChange={(value) => col.toggleVisibility(!!value)}
                                            >
                                                {(columns.find((c, columnIndex) => resolveColumnId(c, columnIndex) === col.id)?.header as any) ?? col.id}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {additionalToolbar}
                            </div>
                        </div>
                    )}

                    {/* Active Filters */}
                    {getActiveFilters().length > 0 && (
                        <div className='flex flex-wrap gap-2 pb-4'>
                            <span className='text-sm font-medium text-muted-foreground'>Active Filters:</span>
                            {getActiveFilters().map((filter, index) => (
                                <Badge key={index} variant='secondary' className='gap-1'>
                                    <span className='text-xs'>
                                        <strong>{filter.label}:</strong> {filter.value}
                                    </span>
                                    <X
                                        className='h-3 w-3 cursor-pointer hover:text-destructive'
                                        onClick={() => handleColumnFilterChange(filter.column, undefined)}
                                    />
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Table */}
                    {loading ? (
                        <div className='flex items-center justify-center py-8'>
                            <div className='text-center'>Loading...</div>
                        </div>
                    ) : data.length === 0 ? (
                        <div className='flex flex-col items-center justify-center py-12 text-center'>
                            <div className='mx-auto max-w-md'>
                                <h3 className='text-lg font-semibold'>{emptyMessage}</h3>
                                <p className='mt-2 text-sm text-muted-foreground'>{emptyDescription}</p>
                                {createButton && (
                                    <Button asChild className='mt-4'>
                                        <a href={createButton.href}>{createButton.label}</a>
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <Table className='table-compact group table'>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {actionBulkButtons.length > 0 && headerGroup.headers.length > 0 && (
                                                <TableHead className='w-12'>
                                                    <Checkbox
                                                        checked={table.getIsAllPageRowsSelected()}
                                                        onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
                                                        aria-label='Select all rows'
                                                    />
                                                </TableHead>
                                            )}
                                            {headerGroup.headers.map((header) => (
                                                <TableHead
                                                    key={header.id}
                                                    className={cn('align-middle', header.column.getCanSort() && 'cursor-pointer')}
                                                >
                                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows.map((row) => (
                                        <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                            {actionBulkButtons.length > 0 && (
                                                <TableCell className='w-12'>
                                                    <Checkbox
                                                        checked={row.getIsSelected()}
                                                        onCheckedChange={(val) => row.toggleSelected(!!val)}
                                                        aria-label={`Select row`}
                                                    />
                                                </TableCell>
                                            )}
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id} className='pl-4'>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {enablePagination && pagination && (
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                        <span>
                                            Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} entries
                                        </span>
                                    </div>
                                    <div className='flex items-center gap-4'>
                                        <span>Rows per page</span>
                                        <Select value={String(pagination.per_page)} onValueChange={handlePerPageChange}>
                                            <SelectTrigger className='w-20'>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value='10'>10</SelectItem>
                                                <SelectItem value='15'>15</SelectItem>
                                                <SelectItem value='25'>25</SelectItem>
                                                <SelectItem value='50'>50</SelectItem>
                                                <SelectItem value='100'>100</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Pagination className='m-0 w-fit'>
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationPrevious
                                                        onClick={() =>
                                                            pagination.prev_page_url &&
                                                            handlePageChange(Math.max(1, (pagination.current_page || 2) - 1))
                                                        }
                                                        className={!pagination.prev_page_url ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                        size='default'
                                                    />
                                                </PaginationItem>

                                                {getVisiblePages()[0] > 1 && (
                                                    <>
                                                        <PaginationItem>
                                                            <PaginationLink
                                                                onClick={() => handlePageChange(1)}
                                                                className='cursor-pointer'
                                                                size='icon'
                                                            >
                                                                1
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                        {getVisiblePages()[0] > 2 && (
                                                            <PaginationItem>
                                                                <PaginationEllipsis />
                                                            </PaginationItem>
                                                        )}
                                                    </>
                                                )}

                                                {getVisiblePages().map((page) => (
                                                    <PaginationItem key={page}>
                                                        <PaginationLink
                                                            onClick={() => handlePageChange(page)}
                                                            isActive={page === pagination.current_page}
                                                            className='cursor-pointer'
                                                            size='icon'
                                                        >
                                                            {page}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                ))}

                                                {getVisiblePages()[getVisiblePages().length - 1] < pagination.last_page && (
                                                    <>
                                                        {getVisiblePages()[getVisiblePages().length - 1] < pagination.last_page - 1 && (
                                                            <PaginationItem>
                                                                <PaginationEllipsis />
                                                            </PaginationItem>
                                                        )}
                                                        <PaginationItem>
                                                            <PaginationLink
                                                                onClick={() => handlePageChange(pagination.last_page)}
                                                                className='cursor-pointer'
                                                                size='icon'
                                                            >
                                                                {pagination.last_page}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    </>
                                                )}

                                                <PaginationItem>
                                                    <PaginationNext
                                                        onClick={() =>
                                                            pagination.next_page_url &&
                                                            handlePageChange(Math.min(pagination.last_page, pagination.current_page + 1))
                                                        }
                                                        className={!pagination.next_page_url ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                        size='default'
                                                    />
                                                </PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}