"use client"

import { useState } from "react"
import { Calendar, RangeCalendar } from "@/components/ui/calendar-rac"
import { parseDate, DateValue, today, getLocalTimeZone } from "@internationalized/date"
import { RangeValue } from "react-aria-components"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon } from "lucide-react"

interface DateRangePickerProps {
  startDate: string // Expects YYYY-MM-DD
  endDate: string   // Expects YYYY-MM-DD
  onChange: (range: { startDate: string; endDate: string }) => void
}

function formatDateDisplay(dateStr: string) {
  if (!dateStr) return "Pick a date"
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return "Pick a date"
  }
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
      <SingleDatePicker
        label="Start Date *"
        date={startDate}
        onChange={(newStart) => onChange({ startDate: newStart, endDate })}
      />
      <SingleDatePicker
        label="Expiry Date *"
        date={endDate}
        onChange={(newEnd) => onChange({ startDate, endDate: newEnd })}
      />
    </div>
  )
}

interface SingleDatePickerProps {
  date: string // Expects YYYY-MM-DD
  onChange: (date: string) => void
  label?: string
}

export function SingleDatePicker({ date, onChange, label = "Select Date" }: SingleDatePickerProps) {
  const [value, setValue] = useState<DateValue | null>(() => {
    try {
      return date ? parseDate(date) : today(getLocalTimeZone())
    } catch {
      return null
    }
  })

  // Close popover when selecting single date
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (selected: DateValue) => {
    setValue(selected)
    onChange(selected.toString())
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex-1 w-full">
        {label && (
          <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-[#F5F0E8]/40 mb-1.5" style={{ fontFamily: 'DM Mono, monospace' }}>
            {label}
          </label>
        )}
        <PopoverTrigger asChild>
          <button
            className={cn(
              "w-full flex flex-row items-center justify-between bg-[#111018] border border-[#1e1c1f] px-3 py-2.5 text-xs text-[#F5F0E8] placeholder:text-[#F5F0E8]/20 focus:outline-none focus:border-amber-500 transition-colors",
              !date && "text-muted-foreground"
            )}
            style={{ borderRadius: 0, fontFamily: 'DM Mono, monospace' }}
          >
            {formatDateDisplay(date)}
            <CalendarIcon className="h-4 w-4 opacity-50 ml-2" />
          </button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0 bg-transparent border-none" align="start">
        <Calendar
          value={value}
          onChange={handleSelect}
        />
      </PopoverContent>
    </Popover>
  )
}
