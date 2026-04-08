"use client";

import { format, isSameDay } from "date-fns";
import { X } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";

import { EventItem } from "./event-item";
import type { CalendarEvent } from "./types";

interface EventsPopupProps {
  date: Date;
  events: CalendarEvent[];
  position: { top: number; left: number };
  onClose: () => void;
  onEventSelect: (event: CalendarEvent) => void;
}

export function EventsPopup({
  date,
  events,
  position,
  onClose,
  onEventSelect,
}: EventsPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Handle escape key to close popup
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [onClose]);

  const handleEventClick = (event: CalendarEvent) => {
    onEventSelect(event);
    onClose();
  };

  return (
    <div
      className="fixed z-50 max-h-[min(24rem,calc(100vh-1rem))] w-80 max-w-[calc(100vw-1rem)] overflow-auto rounded-md border bg-background shadow-lg"
      ref={popupRef}
      style={{
        left: `clamp(0.5rem, ${position.left}px, calc(100vw - 20.5rem))`,
        top: `clamp(0.5rem, ${position.top}px, calc(100vh - 24.5rem))`,
      }}
    >
      <div className="sticky top-0 flex items-center justify-between border-b bg-background p-3">
        <h3 className="font-medium">{format(date, "d MMMM yyyy")}</h3>
        <button
          aria-label="Close"
          className="rounded-full p-1 hover:bg-muted"
          onClick={onClose}
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-2 p-3">
        {events.length === 0 ? (
          <div className="py-2 text-muted-foreground text-sm">No events</div>
        ) : (
          events.map((event) => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            const isFirstDay = isSameDay(date, eventStart);
            const isLastDay = isSameDay(date, eventEnd);

            return (
              <div
                className="cursor-pointer"
                key={event.id}
                onClick={() => handleEventClick(event)}
              >
                <EventItem
                  event={event}
                  isFirstDay={isFirstDay}
                  isLastDay={isLastDay}
                  view="agenda"
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
