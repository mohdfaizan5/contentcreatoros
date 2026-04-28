"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { differenceInDays } from "date-fns";
import { useRef, useState } from "react";

import { useCalendarDnd } from "./calendar-dnd-context";
import { EventItem } from "./event-item";
import type { CalendarEvent } from "./types";

interface DraggableEventProps {
  event: CalendarEvent;
  view: "month" | "week" | "day";
  disabled?: boolean;
  showTime?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  height?: number;
  isMultiDay?: boolean;
  multiDayWidth?: number;
  isFirstDay?: boolean;
  isLastDay?: boolean;
  "aria-hidden"?: boolean | "true" | "false";
}

export function DraggableEvent({
  event,
  view,
  disabled = false,
  showTime,
  onClick,
  height,
  isMultiDay,
  multiDayWidth,
  isFirstDay = true,
  isLastDay = true,
  "aria-hidden": ariaHidden,
}: DraggableEventProps) {
  const { activeId } = useCalendarDnd();
  const elementRef = useRef<HTMLDivElement>(null);
  const [dragHandlePosition, setDragHandlePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Check if this is a multi-day event
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  const isMultiDayEvent =
    isMultiDay || event.allDay || differenceInDays(eventEnd, eventStart) >= 1;
  const resolvedHeight = height ?? null;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      data: {
        dragHandlePosition,
        event,
        height: resolvedHeight,
        isFirstDay,
        isLastDay,
        isMultiDay: isMultiDayEvent,
        multiDayWidth: multiDayWidth,
        view,
      },
      disabled,
      id: `${event.id}-${view}`,
    });

  // Handle mouse down to track where on the event the user clicked
  const handleMouseDown = (e: React.MouseEvent) => {
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      setDragHandlePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // Don't render if this event is being dragged
  if (isDragging || activeId === `${event.id}-${view}`) {
    return (
      <div
        className="opacity-0"
        ref={setNodeRef}
        style={{ height: resolvedHeight || "auto" }}
      />
    );
  }

  const style = transform
    ? {
        height: resolvedHeight || "auto",
        transform: CSS.Translate.toString(transform),
        width:
          isMultiDayEvent && multiDayWidth ? `${multiDayWidth}%` : undefined,
      }
    : {
        height: resolvedHeight || "auto",
        width:
          isMultiDayEvent && multiDayWidth ? `${multiDayWidth}%` : undefined,
      };

  // Handle touch start to track where on the event the user touched
  const handleTouchStart = (e: React.TouchEvent) => {
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      if (touch) {
        setDragHandlePosition({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        });
      }
    }
  };

  return (
    <div
      className={disabled ? undefined : "touch-none"}
      ref={(node) => {
        setNodeRef(node);
        if (elementRef) elementRef.current = node;
      }}
      style={style}
    >
      <EventItem
        aria-hidden={ariaHidden}
        dndAttributes={disabled ? undefined : attributes}
        dndListeners={disabled ? undefined : listeners}
        event={event}
        isDragging={isDragging}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
        onClick={onClick}
        onMouseDown={disabled ? undefined : handleMouseDown}
        onTouchStart={disabled ? undefined : handleTouchStart}
        showTime={showTime}
        view={view}
      />
    </div>
  );
}
