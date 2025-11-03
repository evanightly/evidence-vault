"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

function parseDate(value?: string): Date | undefined {
  if (!value) {
    return undefined
  }

  const [year, month, day] = value.split("-").map(Number)

  if (!year || !month || !day) {
    return undefined
  }

  const parsed = new Date(year, month - 1, day)

  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function formatForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function formatForDisplay(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

type DatePickerProps = {
  id: string
  name?: string
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  min?: string
  max?: string
  className?: string
  buttonClassName?: string
}

export function DatePicker({
  id,
  name,
  value,
  onChange,
  placeholder = "Pilih tanggal",
  disabled = false,
  min,
  max,
  className,
  buttonClassName,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selectedDate = React.useMemo(() => parseDate(value), [value])
  const fromDate = React.useMemo(() => parseDate(min), [min])
  const toDate = React.useMemo(() => parseDate(max), [max])

  const displayText = selectedDate ? formatForDisplay(selectedDate) : placeholder

  const handleSelect = React.useCallback(
    (next?: Date) => {
      if (!next) {
        return
      }

      onChange(formatForInput(next))
      setOpen(false)
    },
    [onChange]
  )

  return (
    <div className={className}>
      <input type="hidden" id={id} name={name ?? id} value={value ?? ""} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            id={`${id}-trigger`}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !selectedDate && "text-muted-foreground",
              buttonClassName
            )}
          >
            <span>{displayText}</span>
            <ChevronDownIcon className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            captionLayout="dropdown"
            onSelect={handleSelect}
            fromDate={fromDate}
            toDate={toDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
