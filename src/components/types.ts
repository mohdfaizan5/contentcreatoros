export type CalendarView = "month" | "week" | "day" | "agenda";

export interface CalendarEventMetadata {
  source?: "generated_tweet";
  generatedTweetStatus?: string;
  scheduledFor?: string | null;
  errorMessage?: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: EventColor;
  location?: string;
  metadata?: CalendarEventMetadata;
}

export interface CalendarEventInput
  extends Omit<CalendarEvent, "start" | "end"> {
  start: Date | string;
  end: Date | string;
}

export type EventColor =
  | "sky"
  | "amber"
  | "violet"
  | "rose"
  | "emerald"
  | "orange";
