import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import DataTableDataSelector from '@/components/ui/data-table-data-selector';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { Filter, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ColumnFilter, CustomFilterProps } from './data-table-types';

type FilterOptions = {
  search?: string;
  [key: string]: unknown;
};

interface ColumnFilterProps extends React.HTMLAttributes<HTMLDivElement> {
  column: {
    id: string;
    header: string;
  };
  filter: ColumnFilter;
  value?: unknown;
  onChange: (value: unknown) => void;
  onClear: () => void;
}

function renderCustomFilter(
  component: NonNullable<ColumnFilter['component']>,
  props: CustomFilterProps
): React.ReactNode {
  const Component = component;
  return <Component {...props} />;
}

function resolveDisplayValue(
  filter: ColumnFilter,
  value: unknown,
  columnLabel: string
): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  switch (filter.type) {
    case 'multiselect': {
      const selected = Array.isArray(value) ? value : [];
      if (filter.options) {
        const labels = filter.options.filter((opt) => selected.includes(opt.value)).map((opt) => opt.label);
        if (labels.length > 0) {
          return `${labels.length} selected`;
        }
      }
      return selected.length > 0 ? `${selected.length} selected` : null;
    }
    case 'select': {
      const match = filter.options?.find((option) => option.value === value);
      return match?.label ?? String(value);
    }
    case 'numberrange': {
      if (Array.isArray(value) && value.length === 2) {
        return `${value[0]} - ${value[1]}`;
      }
      return null;
    }
    case 'daterange': {
      if (Array.isArray(value) && value[0]) {
        const from = new Date(String(value[0]));
        const toRaw = value[1] ? new Date(String(value[1])) : null;
        if (!Number.isNaN(from.getTime())) {
          const fromLabel = from.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          if (toRaw && !Number.isNaN(toRaw.getTime())) {
            const toLabel = toRaw.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return `${fromLabel} - ${toLabel}`;
          }
          return fromLabel;
        }
      }
      return null;
    }
    case 'boolean':
      return value === true ? 'Yes' : value === false ? 'No' : null;
    case 'custom':
      return filter.getDisplayValue ? filter.getDisplayValue(value) : `${columnLabel} filtered`;
    default:
      return String(value);
  }
}

const normalizeSelectorItems = (payload: unknown): Array<Record<string, unknown>> => {
  if (Array.isArray(payload)) {
    return payload as Array<Record<string, unknown>>;
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidateKeys = ['data', 'records', 'items', 'results'];

    for (const key of candidateKeys) {
      const value = record[key];

      if (Array.isArray(value)) {
        return value as Array<Record<string, unknown>>;
      }

      if (
        value &&
        typeof value === 'object' &&
        Array.isArray((value as Record<string, unknown>).data)
      ) {
        return (value as Record<string, unknown>).data as Array<Record<string, unknown>>;
      }
    }

    for (const value of Object.values(record)) {
      if (Array.isArray(value)) {
        return value as Array<Record<string, unknown>>;
      }

      if (
        value &&
        typeof value === 'object' &&
        Array.isArray((value as Record<string, unknown>).data)
      ) {
        return (value as Record<string, unknown>).data as Array<Record<string, unknown>>;
      }
    }
  }

  return [];
};


export function ColumnFilterComponent({
  column,
  filter,
  value,
  onChange,
  onClear,
  className,
}: ColumnFilterProps) {
  const [open, setOpen] = useState(false);
  const hasValue = value !== undefined && value !== null && value !== '';
  const displayValue = useMemo(
    () => resolveDisplayValue(filter, value, column.header),
    [filter, value, column.header]
  );

  const handleMultiSelectToggle = (optionValue: string, checked: boolean) => {
    const next = new Set<string>(Array.isArray(value) ? (value as string[]) : []);
    if (checked) {
      next.add(optionValue);
    } else {
      next.delete(optionValue);
    }

    onChange(Array.from(next));
  };

  const fetchSelectorData = async (filters: FilterOptions) => {
    if (!filter.fetchDataUrl) {
      return [];
    }

    try {
      const response = await axios.get(filter.fetchDataUrl, {
        params: {
          'filter[search]': filters.search,
          page_size: 50,
        },
      });

      if (typeof filter.dataMapper === 'function') {
        try {
          const mapped = filter.dataMapper(response);

          if (Array.isArray(mapped)) {
            return mapped as Array<Record<string, unknown>>;
          }
        } catch (mapperError) {
          console.error('Selector data mapper failed', mapperError);
        }
      }

      const normalized = normalizeSelectorItems(response.data);

      if (normalized.length > 0) {
        return normalized;
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch selector data', error);
      return [];
    }
  };

  const content = () => {
    switch (filter.type) {
      case 'text':
        return (
          <div className={cn('w-64 p-4', className)}>
            <Label htmlFor={`${column.id}-filter`} className="mb-2 block text-sm font-medium">
              {column.header}
            </Label>
            <Input
              id={`${column.id}-filter`}
              placeholder={filter.placeholder ?? `Filter ${column.header.toLowerCase()}...`}
              value={(value as string) ?? ''}
              onChange={(event) => onChange(event.target.value)}
            />
          </div>
        );
      case 'number':
        return (
          <div className={cn('w-64 p-4', className)}>
            <Label className="mb-2 block text-sm font-medium">{column.header}</Label>
            <Input
              type="number"
              placeholder={filter.placeholder ?? `Filter ${column.header.toLowerCase()}...`}
              value={value === undefined || value === null ? '' : String(value)}
              min={filter.min}
              max={filter.max}
              step={filter.step}
              onChange={(event) => {
                const next = event.target.value;
                onChange(next.length ? Number(next) : '');
              }}
            />
          </div>
        );
      case 'numberrange': {
        const range = Array.isArray(value) ? (value as number[]) : [filter.min ?? 0, filter.max ?? 100];
        return (
          <div className={cn('w-80 p-4', className)}>
            <Label className="mb-3 block text-sm font-medium">{column.header}</Label>
            <div className="space-y-4">
              <Slider
                value={range}
                onValueChange={(next) => onChange(next)}
                min={filter.min ?? 0}
                max={filter.max ?? 100}
                step={filter.step ?? 1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{range[0]}</span>
                <span>{range[1]}</span>
              </div>
            </div>
          </div>
        );
      }
      case 'select':
        return (
          <div className={cn('w-64 p-4', className)}>
            <Label className="mb-2 block text-sm font-medium">{column.header}</Label>
            <Select value={(value as string) ?? ''} onValueChange={onChange as (val: string) => void}>
              <SelectTrigger>
                <SelectValue placeholder={filter.placeholder ?? `Select ${column.header.toLowerCase()}...`} />
              </SelectTrigger>
              <SelectContent>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'multiselect':
        return (
          <div className={cn('w-72 p-4', className)}>
            <Label className="mb-2 block text-sm font-medium">{column.header}</Label>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {filter.options?.map((option) => {
                const selected = new Set<string>(Array.isArray(value) ? (value as string[]) : []);
                return (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`${column.id}-${option.value}`}
                      checked={selected.has(option.value)}
                      onCheckedChange={(checked) =>
                        handleMultiSelectToggle(option.value, Boolean(checked))
                      }
                    />
                    <Label htmlFor={`${column.id}-${option.value}`} className="text-sm">
                      {option.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'boolean':
        return (
          <div className={cn('w-64 p-4', className)}>
            <Label className="mb-2 block text-sm font-medium">{column.header}</Label>
            <Select
              value={value === undefined || value === null ? '' : String(value)}
              onValueChange={(val) => onChange(val === 'true')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 'date':
        return (
          <div className={cn('w-80 p-4', className)}>
            <Label className="mb-2 block text-sm font-medium">{column.header}</Label>
            <Calendar
              mode="single"
              selected={value ? new Date(String(value)) : undefined}
              onSelect={(date) => onChange(date ? date.toISOString().split('T')[0] : null)}
              className="rounded-md border"
            />
          </div>
        );
      case 'daterange': {
        const range = Array.isArray(value) ? (value as (string | null)[]) : [null, null];
        const fromDate = range[0] ? new Date(range[0]) : undefined;
        const toDate = range[1] ? new Date(range[1]) : undefined;
        return (
          <div className={cn('w-96 p-4', className)}>
            <Label className="mb-3 block text-sm font-medium">{column.header}</Label>
            <DateRangePicker
              initialDateFrom={fromDate}
              initialDateTo={toDate ?? fromDate}
              align="start"
              showCompare={false}
              onUpdate={({ range }) => {
                const from = range.from ? range.from.toISOString().split('T')[0] : null;
                const to = range.to ? range.to.toISOString().split('T')[0] : null;
                onChange([from, to]);
              }}
            />
          </div>
        );
      }
      case 'selector':
        return (
          <div className={cn('w-72 p-4', className)}>
            <Label className="mb-2 block text-sm font-medium">{column.header}</Label>
            <DataTableDataSelector
              placeholder={filter.placeholder ?? `Select ${column.header.toLowerCase()}...`}
              customSearchPlaceholder={filter.searchPlaceholder ?? 'Search...'}
              fetchData={filter.fetchDataUrl ? fetchSelectorData : undefined}
              selectedDataId={value ? Number(value) : null}
              setSelectedData={(id) => onChange(id === null ? null : String(id))}
              renderItem={(item: Record<string, unknown>) =>
                String(item[filter.labelKey ?? 'name'] ?? item.id ?? 'Item')
              }
              labelKey={(filter.labelKey ?? 'name') as keyof Record<string, unknown>}
              nullable
            />
          </div>
        );
      case 'custom':
        if (filter.component) {
          return (
            <div className={cn('p-4', className)}>
              {renderCustomFilter(filter.component, {
                column,
                value,
                onChange,
                onClear,
              })}
            </div>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-8 border-dashed', hasValue && 'border-solid bg-muted/50')}
        >
          <Filter className="mr-2 h-3 w-3" />
          {displayValue && (
            <Badge variant="secondary" className="mr-1 text-xs">
              {displayValue}
            </Badge>
          )}
          {column.header}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {content()}
        {hasValue && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              className="w-full text-muted-foreground"
            >
              <X className="mr-2 h-3 w-3" />
              Clear Filter
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}