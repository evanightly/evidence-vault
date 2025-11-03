import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useDebounce } from '@uidotdev/usehooks';
import { ChevronsUpDown, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type ItemRecord = Record<string, unknown>;

type SelectorItem = {
  id: number | string;
  label: string;
  raw: ItemRecord;
};

type DataFetcher<TValue> = (parameters: { search?: string }) => Promise<TValue[]>;

type DataTableDataSelectorProps<TValue extends ItemRecord> = {
  placeholder?: string;
  customSearchPlaceholder?: string;
  fetchData?: DataFetcher<TValue>;
  selectedDataId: number | string | null;
  setSelectedData: (id: number | string | null) => void;
  renderItem?: (item: TValue) => React.ReactNode;
  labelKey?: keyof TValue;
  nullable?: boolean;
  disabled?: boolean;
  className?: string;
};

const DEFAULT_LIMIT = 20;

function isPromise<TValue>(value: unknown): value is Promise<TValue> {
  return Boolean(value) && typeof (value as Promise<TValue>).then === 'function';
}

function normaliseItems<TValue extends ItemRecord>(items: TValue[], labelKey?: keyof TValue): SelectorItem[] {
  return items
    .filter((item) => item !== null && item !== undefined)
    .slice(0, DEFAULT_LIMIT)
    .map((item) => {
      const key = labelKey ?? ('name' as keyof TValue);
      const label = item[key] ?? item.id ?? 'Item';

      return {
        id: (item.id as number | string) ?? String(Math.random()),
        label: typeof label === 'string' ? label : String(label),
        raw: item,
      };
    });
}

export default function DataTableDataSelector<TValue extends ItemRecord>({
  placeholder = 'Select item...',
  customSearchPlaceholder = 'Search items...',
  fetchData,
  selectedDataId,
  setSelectedData,
  renderItem,
  labelKey,
  nullable = false,
  disabled = false,
  className,
}: DataTableDataSelectorProps<TValue>) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SelectorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedDataId) ?? null,
    [items, selectedDataId]
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!fetchData) {
        return;
      }

      setLoading(true);

      try {
        const data = await fetchData({ search: debouncedSearch });

        if (!active) {
          return;
        }

        if (isPromise(data)) {
          return;
        }

        setItems(normaliseItems(data, labelKey));
      } catch (error) {
        console.error('Failed to load selector data', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [debouncedSearch, fetchData, labelKey]);

  useEffect(() => {
    if (selectedDataId === null || items.some((item) => item.id === selectedDataId)) {
      return;
    }

    const placeholderItem = {
      id: selectedDataId,
      label: `Selected #${selectedDataId}`,
      raw: { id: selectedDataId } as ItemRecord,
    };

    setItems((current) => [placeholderItem, ...current]);
  }, [items, selectedDataId]);

  const handleSelect = (id: number | string) => {
    setSelectedData(id);
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedData(null);
    setOpen(false);
  };

  const buttonLabel = selectedItem?.label ?? placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', !selectedItem && 'text-muted-foreground', className)}
          disabled={disabled}
        >
          <span className="truncate">
            {renderItem && selectedItem ? renderItem(selectedItem.raw as TValue) : buttonLabel}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={customSearchPlaceholder}
            value={search}
            onValueChange={setSearch}
            disabled={!fetchData}
          />
          <CommandEmpty>
            {loading ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            ) : (
              'No results.'
            )}
          </CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto">
            {items.map((item) => (
              <CommandItem key={item.id} value={String(item.id)} onSelect={() => handleSelect(item.id)}>
                {renderItem ? renderItem(item.raw as TValue) : item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
        <div className="flex items-center justify-between border-t p-2">
          {nullable ? (
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground">
              Clear
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Select an option</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => fetchData && setSearch('')}
            disabled={!fetchData}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}