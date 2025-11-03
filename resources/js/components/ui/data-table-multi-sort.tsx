import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, GripVertical, Plus, SortAsc, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { ColumnFilterMeta } from './data-table-types';

interface DataTableMultiSortProps<TData> {
    columns: (ColumnDef<TData> & ColumnFilterMeta)[];
    sorting: SortingState; // TanStack native sorting state
    onSortingChange: (sorting: SortingState) => void;
}

export function DataTableMultiSort<TData>({ columns, sorting, onSortingChange }: DataTableMultiSortProps<TData>) {
    const [isOpen, setIsOpen] = useState(false);

    const sortableColumns = columns.filter((col) => (col as any).enableSorting !== false);

    const addSort = (columnId: string) => {
        if (!sorting.find((s) => s.id === columnId)) {
            const newSorting = [...sorting, { id: columnId, desc: false }];
            onSortingChange(newSorting);
        }
    };

    const removeSort = (columnId: string) => {
        const newSorting = sorting.filter((s) => s.id !== columnId);
        onSortingChange(newSorting);
    };

    const toggleDirection = (columnId: string) => {
        const newSorting = sorting.map((s) => (s.id === columnId ? { ...s, desc: !s.desc } : s));
        onSortingChange(newSorting);
    };

    const moveSort = (fromIndex: number, toIndex: number) => {
        const newSorting = [...sorting];
        const [moved] = newSorting.splice(fromIndex, 1);
        newSorting.splice(toIndex, 0, moved);
        onSortingChange(newSorting);
    };

    const clearSorts = () => {
        onSortingChange([]);
        setIsOpen(false);
    };

    const getColumnHeader = (columnId: string) => {
        const found = columns.find((col) => String(col.id) === columnId);
        return (found?.header as any) || columnId;
    };

    const availableColumns = sortableColumns.filter((col) => !sorting.find((s) => s.id === String(col.id)));

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant='ghost' size='sm' className={cn('h-8 border-dashed', sorting.length > 0 && 'border-solid bg-muted/50')}>
                    <SortAsc className='mr-2 h-3 w-3' />
                    {sorting.length > 0 && (
                        <Badge variant='secondary' className='mr-1 text-xs'>
                            {sorting.length}
                        </Badge>
                    )}
                    Sort
                </Button>
            </PopoverTrigger>
            <PopoverContent className='w-96 p-0' align='start'>
                <Card className='border-0 shadow-none'>
                    <CardHeader className='pb-3'>
                        <CardTitle className='text-sm'>Sort Options</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        {/* Current Sorts */}
                        {sorting.length > 0 && (
                            <div className='space-y-2'>
                                <div className='text-xs font-medium text-muted-foreground'>Sort Order (Priority: 1 → {sorting.length})</div>
                                {sorting.map((sort, index) => (
                                    <div key={sort.id} className='flex items-center gap-2 rounded-lg border bg-muted/20 p-2'>
                                        <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                                            <GripVertical className='h-3 w-3' />
                                            {index + 1}
                                        </div>

                                        <div className='flex-1 text-sm font-medium'>{getColumnHeader(sort.id)}</div>

                                        <Button variant='ghost' size='sm' onClick={() => toggleDirection(sort.id)} className='h-6 px-2'>
                                            {!sort.desc ? <ArrowUp className='h-3 w-3' /> : <ArrowDown className='h-3 w-3' />}
                                            <span className='ml-1 text-xs'>{!sort.desc ? 'Asc' : 'Desc'}</span>
                                        </Button>

                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            onClick={() => removeSort(sort.id)}
                                            className='h-6 px-2 text-muted-foreground hover:text-destructive'
                                        >
                                            <Trash2 className='h-3 w-3' />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add New Sort */}
                        {availableColumns.length > 0 && (
                            <div className='space-y-2'>
                                <div className='text-xs font-medium text-muted-foreground'>Add Column</div>
                                <Select onValueChange={(columnId) => addSort(columnId)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder='Select column to sort...' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableColumns.map((column) => (
                                            <SelectItem key={String(column.id)} value={String(column.id)}>
                                                <div className='flex items-center gap-2'>
                                                    <Plus className='h-3 w-3' />
                                                    {(column.header as any) ?? String(column.id)}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Clear All */}
                        {sorting.length > 0 && (
                            <div className='border-t pt-2'>
                                <Button variant='ghost' size='sm' onClick={clearSorts} className='w-full text-muted-foreground'>
                                    <X className='mr-2 h-3 w-3' />
                                    Clear All Sorts
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </PopoverContent>
        </Popover>
    );
}