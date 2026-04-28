"use client";

import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/shared/components/ui/calendar";
import { cn } from "@/shared/lib/utils";

type TwoCalendarRangeProps = {
  value: DateRange | undefined;
  onChange: (nextRange: DateRange | undefined) => void;
  maxDays?: number;
  minDate?: Date;
  className?: string;
};

export default function TwoCalendarRange({
  value,
  onChange,
  maxDays = 7,
  minDate,
  className
}: TwoCalendarRangeProps) {
  const maxOffset = maxDays - 1;

  const handleSelect = (nextRange: DateRange | undefined) => {
    if (!nextRange?.from || !nextRange.to) {
      onChange(nextRange);
      return;
    }

    const totalDays = differenceInCalendarDays(nextRange.to, nextRange.from) + 1;

    if (totalDays > maxDays) {
      onChange({
        from: nextRange.from,
        to: addDays(nextRange.from, maxOffset),
      });
      return;
    }

    onChange(nextRange);
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && startOfDay(date) < startOfDay(minDate)) {
      return true;
    }

    if (!value?.from || value.to) {
      return false;
    }

    return differenceInCalendarDays(date, value.from) > maxOffset;
  };

  return (
      <Calendar
        className={cn("rounded-md border p-2", className)}
        classNames={{
          month:
            "relative first-of-type:before:hidden before:absolute max-sm:before:inset-x-2 max-sm:before:h-px max-sm:before:-top-2 sm:before:inset-y-2 sm:before:w-px before:bg-border sm:before:-left-4",
          months: "gap-8",
        }}
        disabled={isDateDisabled}
        mode="range"
        numberOfMonths={2}
        onSelect={handleSelect}
        pagedNavigation
        selected={value}
        showOutsideDays={false}
      />
  );
}
