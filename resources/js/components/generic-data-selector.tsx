import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useDebounce } from '@uidotdev/usehooks';
import { Check, ChevronsUpDown } from 'lucide-react';
import type { ChangeEvent, ReactNode } from 'react';
import { memo, useEffect, useMemo, useState } from 'react';

type SelectorResource = {
  id: number | string;
  [key: string]: unknown;
};

type SelectorFilterOptions = { search?: string } & Record<string, unknown>;

type GenericDataSelectorProps<TValue extends SelectorResource> = {
  id?: string;
  data?: TValue[];
  fetchData?: (filters: SelectorFilterOptions) => Promise<TValue[] | unknown>;
  dataMapper?: (response: unknown) => TValue[] | undefined;
  selectedDataId?: number | string | null;
  setSelectedData?: (id: number | string | null) => void;
  selectedDataIds?: Array<number | string>;
  setSelectedDataIds?: (ids: Array<number | string>) => void;
  multiSelect?: boolean;
  placeholder?: string;
  customSearchPlaceholder?: string;
  renderItem?: (item: TValue) => ReactNode;
  labelKey?: keyof TValue;
  nullable?: boolean;
  buttonClassName?: string;
  popoverContentClassName?: string;
  initialSearch?: string;
  customLabel?: (item: TValue) => string;
  onSearchChange?: (value: string) => void;
  disabledSearchState?: boolean;
};

const DEFAULT_LABEL_KEY = 'name';

function coerceLabel(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value === undefined || value === null) {
    return 'Select...';
  }

  return String(value);
}

const GenericDataSelector = <TValue extends SelectorResource>({
  id,
  data,
  fetchData,
  dataMapper,
  selectedDataId = null,
  setSelectedData,
  selectedDataIds = [],
  setSelectedDataIds,
  multiSelect = false,
  placeholder = 'Select...',
  customSearchPlaceholder,
  renderItem,
  labelKey,
  nullable = false,
  buttonClassName,
  popoverContentClassName,
  initialSearch,
  customLabel,
  onSearchChange,
  disabledSearchState = true,
}: GenericDataSelectorProps<TValue>) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch ?? '');
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [fetchedData, setFetchedData] = useState<TValue[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fetchData || data) {
      return;
    }

    let isActive = true;

    const load = async () => {
      setLoading(true);

      try {
        const next = await fetchData({
          search: debouncedSearchTerm.trim() || undefined,
        });

        if (!isActive) {
          return;
        }

        const mapped = dataMapper ? dataMapper(next) : next;
        setFetchedData(Array.isArray(mapped) ? (mapped as TValue[]) : []);
      } catch (error) {
        console.error('Failed to load selector options', error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [data, dataMapper, debouncedSearchTerm, fetchData]);

  useEffect(() => {
    if (!onSearchChange) {
      return;
    }

    onSearchChange(searchTerm);
  }, [onSearchChange, searchTerm]);

  const items = data ?? fetchedData;
  const labelKeyToUse = (labelKey ?? (DEFAULT_LABEL_KEY as keyof TValue));

  const selectedItem = useMemo(() => {
    if (multiSelect || selectedDataId === null) {
      return null;
    }

    return items.find((item) => item.id === selectedDataId) ?? null;
  }, [items, multiSelect, selectedDataId]);

  useEffect(() => {
    if (!multiSelect || selectedDataIds.length === 0 || data) {
      return;
    }

    const missing = selectedDataIds.filter(
      (identifier) => !items.some((item) => item.id === identifier)
    );

    if (missing.length === 0) {
      return;
    }

    setFetchedData((current) => [
      ...current,
      ...missing.map((identifier) => ({ id: identifier } as TValue)),
    ]);
  }, [data, items, multiSelect, selectedDataIds]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSelect = (identifier: number | string) => {
    if (multiSelect) {
      if (!setSelectedDataIds) {
        return;
      }

      const exists = selectedDataIds.includes(identifier);
      const next = exists
        ? selectedDataIds.filter((value) => value !== identifier)
        : [...selectedDataIds, identifier];

      setSelectedDataIds(next);
      return;
    }

    setSelectedData?.(identifier);
    setOpen(false);
  };

  const handleClear = () => {
    if (multiSelect) {
      setSelectedDataIds?.([]);
      return;
    }

    setSelectedData?.(null);
    setOpen(false);
  };

  const resolveLabel = (item: TValue): string => {
    if (customLabel) {
      return customLabel(item);
    }

    return coerceLabel(item[labelKeyToUse]);
  };

  const buttonLabel = (() => {
    if (multiSelect) {
      return selectedDataIds.length > 0
        ? `${selectedDataIds.length} selected`
        : placeholder;
    }

    if (selectedItem) {
      return resolveLabel(selectedItem);
    }

    if (selectedDataId !== null) {
      return `#${selectedDataId}`;
    }

    return placeholder;
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger id={id} asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', buttonClassName)}
        >
          <span className="truncate">{buttonLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-[240px] p-0', popoverContentClassName)}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={customSearchPlaceholder ?? 'Search...'}
            value={searchTerm}
            onInput={handleSearchChange}
            disabled={disabledSearchState && loading}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? 'Loading...' : 'No results found'}
            </CommandEmpty>
            <CommandGroup>
              {nullable ? (
                <CommandItem onSelect={handleClear}>
                  {multiSelect ? 'Clear selections' : 'Clear selection'}
                </CommandItem>
              ) : null}
              {items.map((item) => {
                const isSelected = multiSelect
                  ? selectedDataIds.includes(item.id)
                  : selectedDataId === item.id;

                return (
                  <CommandItem
                    key={item.id}
                    value={String(item.id)}
                    onSelect={() => handleSelect(item.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {renderItem ? renderItem(item) : resolveLabel(item)}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default memo(GenericDataSelector) as typeof GenericDataSelector;