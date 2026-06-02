"use client"

import { cn } from "@/lib/utils"
import { getLocalTimeZone, today } from "@internationalized/date"
import { ComponentProps } from "react"
import {
  Button,
  CalendarCell as CalendarCellRac,
  CalendarGridBody as CalendarGridBodyRac,
  CalendarGridHeader as CalendarGridHeaderRac,
  CalendarGrid as CalendarGridRac,
  CalendarHeaderCell as CalendarHeaderCellRac,
  Calendar as CalendarRac,
  Heading as HeadingRac,
  RangeCalendar as RangeCalendarRac,
  composeRenderProps,
} from "react-aria-components"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface BaseCalendarProps {
  className?: string
}

type CalendarProps = ComponentProps<typeof CalendarRac> & BaseCalendarProps
type RangeCalendarProps = ComponentProps<typeof RangeCalendarRac> &
  BaseCalendarProps

const CalendarHeader = () => (
  <header className="flex w-full items-center gap-1 pb-1">
    <Button
      slot="previous"
      className="flex size-9 items-center justify-center rounded-lg text-[#F5F0E8]/50 outline-offset-2 transition-colors hover:bg-amber-500 hover:text-black focus:outline-none data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-amber-500/70"
    >
      <ChevronLeft size={16} strokeWidth={2} />
    </Button>
    <HeadingRac className="grow text-center text-sm font-bold text-[#F5F0E8]" />
    <Button
      slot="next"
      className="flex size-9 items-center justify-center rounded-lg text-[#F5F0E8]/50 outline-offset-2 transition-colors hover:bg-amber-500 hover:text-black focus:outline-none data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-amber-500/70"
    >
      <ChevronRight size={16} strokeWidth={2} />
    </Button>
  </header>
)

const CalendarGridComponent = ({ isRange = false }: { isRange?: boolean }) => {
  const now = today(getLocalTimeZone())

  return (
    <CalendarGridRac>
      <CalendarGridHeaderRac>
        {(day) => (
          <CalendarHeaderCellRac className="size-9 rounded-lg p-0 text-xs font-medium text-[#F5F0E8]/40">
            {day}
          </CalendarHeaderCellRac>
        )}
      </CalendarGridHeaderRac>
      <CalendarGridBodyRac className="[&_td]:px-0">
        {(date) => (
          <CalendarCellRac
            date={date}
            className={cn(
              "relative flex size-9 items-center justify-center whitespace-nowrap rounded-lg border border-transparent p-0 text-sm font-normal text-[#F5F0E8] outline-offset-2 duration-150 [transition-property:color,background-color,border-radius,box-shadow] focus:outline-none data-[disabled]:pointer-events-none data-[unavailable]:pointer-events-none data-[focus-visible]:z-10 data-[hovered]:bg-amber-500/20 data-[selected]:bg-amber-500 data-[hovered]:text-amber-400 data-[selected]:text-black data-[selected]:font-bold data-[unavailable]:line-through data-[disabled]:opacity-30 data-[unavailable]:opacity-30 data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-amber-500/70",
              // Range-specific styles
              isRange &&
                "data-[selected]:rounded-none data-[selection-end]:rounded-e-lg data-[selection-start]:rounded-s-lg data-[invalid]:bg-red-500/20 data-[selected]:bg-amber-500/15 data-[selected]:text-[#F5F0E8] data-[invalid]:data-[selection-end]:[&:not([data-hover])]:bg-red-500 data-[invalid]:data-[selection-start]:[&:not([data-hover])]:bg-red-500 data-[selection-end]:[&:not([data-hover])]:bg-amber-500 data-[selection-start]:[&:not([data-hover])]:bg-amber-500 data-[invalid]:data-[selection-end]:[&:not([data-hover])]:text-white data-[invalid]:data-[selection-start]:[&:not([data-hover])]:text-white data-[selection-end]:[&:not([data-hover])]:text-black data-[selection-start]:[&:not([data-hover])]:text-black",
              // Today indicator styles
              date.compare(now) === 0 &&
                cn(
                  "after:pointer-events-none after:absolute after:bottom-1 after:start-1/2 after:z-10 after:size-[3px] after:-translate-x-1/2 after:rounded-full after:bg-amber-500",
                  isRange
                    ? "data-[selection-end]:[&:not([data-hover])]:after:bg-black data-[selection-start]:[&:not([data-hover])]:after:bg-black"
                    : "data-[selected]:after:bg-black",
                ),
            )}
          />
        )}
      </CalendarGridBodyRac>
    </CalendarGridRac>
  )
}

const Calendar = ({ className, ...props }: CalendarProps) => {
  return (
    <CalendarRac
      {...props}
      className={composeRenderProps(className, (className) =>
        cn("w-fit bg-[#0d0c0e] border border-[#1e1c1f] rounded-lg p-3 text-[#F5F0E8] shadow-2xl", className),
      )}
    >
      <CalendarHeader />
      <CalendarGridComponent />
    </CalendarRac>
  )
}

const RangeCalendar = ({ className, ...props }: RangeCalendarProps) => {
  return (
    <RangeCalendarRac
      {...props}
      className={composeRenderProps(className, (className) =>
        cn("w-fit bg-[#0d0c0e] border border-[#1e1c1f] rounded-lg p-3 text-[#F5F0E8] shadow-2xl", className),
      )}
    >
      <CalendarHeader />
      <CalendarGridComponent isRange />
    </RangeCalendarRac>
  )
}

export { Calendar, RangeCalendar }
