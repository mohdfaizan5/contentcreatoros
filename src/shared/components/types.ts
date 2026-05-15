import type { PostMediaAttachment } from "@/shared/types/database";

export type CalendarView = "month" | "week" | "day" | "agenda";

export interface CalendarEventMetadata {
  source?: "generated_tweet";
  generatedTweetStatus?: string;
  scheduledFor?: string | null;
  errorMessage?: string | null;
  xAccountId?: string | null;
  xAccountRole?: "founder" | "company" | null;
  xAccountUsername?: string | null;
  xAccountAvatarUrl?: string | null;
  xAccountName?: string | null;
  xTweetId?: string | null;
  publishedUrl?: string | null;
  mediaAttachments?: PostMediaAttachment[];
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
  extends Omit<CalendarEvent, "start" | "end" | "tweetContent" | "tweetStatus"> {
  start: Date | string;
  end: Date | string;
  tweetContent: string;
  tweetStatus: string;
}

export type EventColor =
  | "sky"
  | "amber"
  | "violet"
  | "rose"
  | "emerald"
  | "orange";
