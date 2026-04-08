"use client";

import { useMemo, useState } from "react";

import { EventCalendar } from "./event-calendar";
import type { CalendarEvent, CalendarEventInput } from "./types";

const EMPTY_EVENTS: CalendarEventInput[] = [];

interface MainCalendarProps {
  initialEvents?: CalendarEventInput[];
  readOnly?: boolean;
}

function normalizeEventDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function normalizeEvents(events: CalendarEventInput[]) {
  return events
    .map((event) => ({
      ...event,
      end: normalizeEventDate(event.end),
      start: normalizeEventDate(event.start),
    }))
    .filter(
      (event): event is CalendarEvent =>
        !Number.isNaN(event.start.getTime()) && !Number.isNaN(event.end.getTime()),
    );
}

export default function MainCalendar({
  initialEvents = EMPTY_EVENTS,
  readOnly = false,
}: MainCalendarProps) {
  const normalizedInitialEvents = useMemo(
    () => normalizeEvents(initialEvents),
    [initialEvents],
  );
  const [editableEvents, setEditableEvents] = useState<CalendarEvent[]>(
    normalizedInitialEvents,
  );
  const events = readOnly ? normalizedInitialEvents : editableEvents;

  const handleEventAdd = (event: CalendarEvent) => {
    if (readOnly) {
      return;
    }

    setEditableEvents((currentEvents) => [...currentEvents, event]);
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    if (readOnly) {
      return;
    }

    setEditableEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event,
      ),
    );
  };

  const handleEventDelete = (eventId: string) => {
    if (readOnly) {
      return;
    }

    setEditableEvents((currentEvents) =>
      currentEvents.filter((event) => event.id !== eventId),
    );
  };

  return (
    <EventCalendar
      events={events}
      onEventAdd={readOnly ? undefined : handleEventAdd}
      onEventDelete={readOnly ? undefined : handleEventDelete}
      onEventUpdate={readOnly ? undefined : handleEventUpdate}
      readOnly={readOnly}
    />
  );
}
