import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Column } from '@tanstack/react-table';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { HTMLAttributes } from 'react';

interface DataTableColumnHeaderProps<TData>
  extends HTMLAttributes<HTMLDivElement> {
  column: Column<TData, unknown> & {
    toggleSorting: (desc?: boolean, multi?: boolean) => void;
    getCanSort: () => boolean;
    getIsSorted: () => false | 'asc' | 'desc';
    getSortIndex?: () => number;
  };
  title: string;
  sortIndex?: number;
  enableMultiSort?: boolean;
}

export function DataTableColumnHeader<TData>({
  column,
  title,
  className,
  sortIndex,
  enableMultiSort = false,
  ...props
}: DataTableColumnHeaderProps<TData>) {
  if (!column.getCanSort()) {
    return (
      <div className={cn('flex items-center', className)} {...props}>
        {title}
      </div>
    );
  }

  const sortDirection = column.getIsSorted();
  const isSorted = sortDirection !== false;
  const sortBadge =
    enableMultiSort && isSorted && typeof sortIndex === 'number'
      ? sortIndex + 1
      : undefined;

  return (
    <div className={cn('flex items-center', className)} {...props}>
      <Button
        variant="ghost"
        className="flex h-8 items-center gap-2 px-2"
        onClick={(event) =>
          column.toggleSorting(sortDirection === 'asc', enableMultiSort && event.shiftKey)
        }
        title={enableMultiSort ? 'Click to sort. Shift+Click for multi-sort.' : 'Click to sort.'}
      >
        <span className="text-xs font-medium uppercase tracking-wide">{title}</span>
        <div className="flex items-center gap-1">
          {sortBadge !== undefined ? (
            <Badge variant="secondary" className="h-4 px-1 text-[10px]">
              {sortBadge}
            </Badge>
          ) : null}
          <div className="relative h-4 w-4 text-muted-foreground">
            <ChevronUp
              className={cn(
                'absolute -top-1 h-4 w-4 transition-colors',
                sortDirection === 'asc' ? 'text-primary' : 'text-muted-foreground'
              )}
            />
            <ChevronDown
              className={cn(
                'absolute top-1 h-4 w-4 transition-colors',
                sortDirection === 'desc' ? 'text-primary' : 'text-muted-foreground'
              )}
            />
          </div>
        </div>
      </Button>
    </div>
  );
}