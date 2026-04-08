"use client";

import { format, isSameDay, setHours, setMinutes, startOfToday } from "date-fns";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";

type CalendarSelectWithTimeProps = {
  confirmLabel?: string;
  initialValue?: Date | null;
  isSubmitting?: boolean;
  onConfirm?: (value: Date) => void;
};

const MINUTES_STEP = 30;

function buildTimeSlots(selectedDate: Date) {
  const now = new Date();

  return Array.from({ length: (24 * 60) / MINUTES_STEP }, (_, index) => {
    const totalMinutes = index * MINUTES_STEP;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const slotDate = setMinutes(setHours(selectedDate, hours), minutes);
    const disabled = isSameDay(selectedDate, now) && slotDate.getTime() <= now.getTime();

    return {
      disabled,
      label: format(slotDate, "HH:mm"),
      value: slotDate,
    };
  });
}

export default function CalendarSelectWithTime({
  confirmLabel = "Schedule tweet",
  initialValue,
  isSubmitting = false,
  onConfirm,
}: CalendarSelectWithTimeProps) {
  const [date, setDate] = useState<Date>(initialValue ?? new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(
    initialValue ? format(initialValue, "HH:mm") : null,
  );

  const timeSlots = useMemo(() => buildTimeSlots(date), [date]);
  const selectedDateTime =
    selectedTime
      ? timeSlots.find((slot) => slot.label === selectedTime)?.value ?? null
      : null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex max-sm:flex-col">
          <Calendar
            className="p-3 sm:pe-5"
            disabled={[{ before: startOfToday() }]}
            mode="single"
            onSelect={(newDate) => {
              if (newDate) {
                setDate(newDate);
                setSelectedTime(null);
              }
            }}
            selected={date}
          />
          <div className="relative w-full max-sm:h-56 sm:w-44">
            <div className="absolute inset-0 py-4 max-sm:border-t sm:border-s">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  <div className="flex h-5 shrink-0 items-center px-5">
                    <p className="font-medium text-sm text-slate-700">
                      {format(date, "EEEE, MMM d")}
                    </p>
                  </div>
                  <div className="grid gap-1.5 px-5 max-sm:grid-cols-2">
                    {timeSlots.map((slot) => (
                      <Button
                        className="w-full"
                        disabled={slot.disabled}
                        key={slot.label}
                        onClick={() => setSelectedTime(slot.label)}
                        size="sm"
                        type="button"
                        variant={selectedTime === slot.label ? "default" : "outline"}
                      >
                        {slot.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-900">
            {selectedDateTime
              ? `Selected: ${format(selectedDateTime, "PPP p")}`
              : "Choose a date and time"}
          </p>
          <p className="text-xs text-slate-500">
            Past time slots for today are automatically disabled.
          </p>
        </div>
        <Button
          disabled={!selectedDateTime || isSubmitting}
          onClick={() => {
            if (selectedDateTime) {
              onConfirm?.(selectedDateTime);
            }
          }}
          type="button"
        >
          {isSubmitting ? "Scheduling..." : confirmLabel}
        </Button>
      </div>
    </div>
  );
}
