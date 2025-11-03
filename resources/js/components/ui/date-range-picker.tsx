'use client';

import { useMemo, useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type DateInput = Date | string | null | undefined;

export interface DateRangePickerProps {
  onUpdate?: (values: { range: DateRange; rangeCompare?: DateRange }) => void;
  initialDateFrom?: DateInput;
  initialDateTo?: DateInput;
  align?: 'start' | 'center' | 'end';
  locale?: string;
  showCompare?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

function parseValue(value: DateInput): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  }

  return null;
}

function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatRange(range: DateRange, locale: string, placeholder: string): string {
  if (range.from && range.to) {
    return `${formatDate(range.from, locale)} – ${formatDate(range.to, locale)}`;
  }

  if (range.from) {
    return formatDate(range.from, locale);
  }

  return placeholder;
}

function normaliseRange(range: DateRange): DateRange {
  if (!range.from || !range.to) {
    return range;
  }

  if (range.to < range.from) {
    return {
      from: range.to,
      to: range.from,
    };
  }

  return range;
}

export function DateRangePicker({
  onUpdate,
  initialDateFrom,
  initialDateTo,
  align = 'start',
  locale = 'en-US',
  showCompare, // Reserved for future enhancements
  disabled = false,
  placeholder = 'Select dates',
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange>(() => {
    const from = parseValue(initialDateFrom);
    const to = parseValue(initialDateTo);

    return normaliseRange({
      from,
      to: to ?? from,
    });
  });

  const label = useMemo(
    () => formatRange(range, locale, placeholder),
    [range, locale, placeholder]
  );

  const selected = useMemo(
    () => ({
      from: range.from ?? undefined,
      to: range.to ?? undefined,
    }),
    [range]
  );

  const handleSelect = (next: { from?: Date; to?: Date } | undefined) => {
    if (!next?.from) {
      const cleared = { from: null, to: null } satisfies DateRange;
      setRange(cleared);
      onUpdate?.({ range: cleared });
      return;
    }

    const updated = normaliseRange({
      from: next.from,
      to: next.to ?? next.from,
    });

    setRange(updated);
    onUpdate?.({ range: updated });
  };

  const handleReset = () => {
    const cleared = { from: null, to: null } satisfies DateRange;
    setRange(cleared);
    onUpdate?.({ range: cleared });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn('w-full justify-start font-normal', !range.from && 'text-muted-foreground', className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="p-3">
        <div className="space-y-3">
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={selected}
            defaultMonth={selected.from ?? undefined}
            onSelect={handleSelect}
            initialFocus
          />
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              {showCompare ? 'Compare mode unavailable in template implementation.' : 'Select a start and end date.'}
            </div>
            <Button size="sm" variant="ghost" onClick={handleReset} disabled={!range.from}>
              Clear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}