"use client";

import { RiCalendarLine, RiDeleteBinLine } from "@remixicon/react";
import { format, isBefore } from "date-fns";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { toast } from "sonner";

import {
  DefaultEndHour,
  DefaultStartHour,
  EndHour,
  StartHour,
} from "@/shared/components/constants";
import { scheduleGeneratedTweet } from "@/features/(legacy)/templates/generated-tweets";
import CalendarSelectWithTime from "@/shared/components/calendar-select-with-time";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import type { CalendarEvent, EventColor } from "./types";
import { Badge } from "./ui/badge";

interface EventDialogProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  readOnly?: boolean;
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
}

function formatTimeForInput(date: Date) {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = Math.floor(date.getMinutes() / 15) * 15;
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

function createDraftFromEvent(event: CalendarEvent | null) {
  const start = event ? new Date(event.start) : new Date();
  const end = event ? new Date(event.end) : new Date();

  return {
    allDay: event?.allDay || false,
    color: (event?.color as EventColor) || "sky",
    description: event?.description || "",
    endDate: end,
    endTime: formatTimeForInput(end),
    location: event?.location || "",
    startDate: start,
    startTime: formatTimeForInput(start),
    title: event?.title || "",
  };
}

const RETRY_TIME_STEP_MINUTES = 30;

function roundUpToNextRetrySlot(date: Date) {
  const rounded = new Date(date);

  rounded.setSeconds(0, 0);

  const minuteRemainder = rounded.getMinutes() % RETRY_TIME_STEP_MINUTES;

  if (minuteRemainder !== 0) {
    rounded.setMinutes(
      rounded.getMinutes() + (RETRY_TIME_STEP_MINUTES - minuteRemainder),
    );
  }

  return rounded;
}

function getRetryInitialDate(event: CalendarEvent | null) {
  const now = new Date();
  const metadataDate = event?.metadata?.scheduledFor
    ? new Date(event.metadata.scheduledFor)
    : null;
  const startDate = event ? new Date(event.start) : null;
  const candidate = metadataDate ?? startDate;

  if (!candidate || Number.isNaN(candidate.getTime())) {
    return roundUpToNextRetrySlot(now);
  }

  if (candidate.getTime() <= now.getTime()) {
    return roundUpToNextRetrySlot(now);
  }

  return candidate;
}

function getAccountInitials(event: CalendarEvent | null) {
  const source =
    event?.metadata?.xAccountName ||
    event?.metadata?.xAccountUsername ||
    event?.metadata?.xAccountRole ||
    "X";

  return source.trim().slice(0, 2).toUpperCase();
}

export function EventDialog({
  event,
  isOpen,
  onClose,
  readOnly = false,
  onSave,
  onDelete,
}: EventDialogProps) {
  const router = useRouter();
  console.log("EventDialog render", { event, isOpen, readOnly });
  const initialDraft = createDraftFromEvent(event);
  const [title] = useState(initialDraft.title);
  const [description, setDescription] = useState(initialDraft.description);
  const [startDate, setStartDate] = useState<Date>(initialDraft.startDate);
  const [endDate, setEndDate] = useState<Date>(initialDraft.endDate);
  const [startTime, setStartTime] = useState(
    initialDraft.startTime || `${DefaultStartHour}:00`,
  );
  const [endTime] = useState(
    initialDraft.endTime || `${DefaultEndHour}:00`,
  );
  const [allDay] = useState(initialDraft.allDay);
  const [location] = useState(initialDraft.location);
  const [color] = useState<EventColor>(initialDraft.color);
  const [error, setError] = useState<string | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [isRetrySchedulerOpen, setIsRetrySchedulerOpen] = useState(false);
  const [isRetrying, startRetryTransition] = useTransition();
  const isGeneratedTweetEvent =
    readOnly && event?.metadata?.source === "generated_tweet";
  const isFailedGeneratedTweet =
    isGeneratedTweetEvent &&
    event?.metadata?.generatedTweetStatus === "failed";
  const retryInitialDate = useMemo(() => getRetryInitialDate(event), [event]);

  // Memoize time options so they're only calculated once
  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = StartHour; hour <= EndHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        const value = `${formattedHour}:${formattedMinute}`;
        // Use a fixed date to avoid unnecessary date object creations
        const date = new Date(2000, 0, 1, hour, minute);
        const label = format(date, "h:mm a");
        options.push({ label, value });
      }
    }
    return options;
  }, []); // Empty dependency array ensures this only runs once

  const handleSave = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!allDay) {
      const [startHours = 0, startMinutes = 0] = startTime
        .split(":")
        .map(Number);
      const [endHours = 0, endMinutes = 0] = endTime.split(":").map(Number);

      if (
        startHours < StartHour ||
        startHours > EndHour ||
        endHours < StartHour ||
        endHours > EndHour
      ) {
        setError(
          `Selected time must be between ${StartHour}:00 and ${EndHour}:00`,
        );
        return;
      }

      start.setHours(startHours, startMinutes, 0);
      end.setHours(endHours, endMinutes, 0);
    } else {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    // Validate that end date is not before start date
    if (isBefore(end, start)) {
      setError("End date cannot be before start date");
      return;
    }

    // Use generic title if empty
    const eventTitle = title.trim() ? title : "(no title)";

    onSave({
      allDay,
      color,
      description,
      end,
      id: event?.id || "",
      location,
      start,
      title: eventTitle,
    });
  };

  const handleDelete = () => {
    if (event?.id) {
      onDelete(event.id);
    }
  };

  const handleRetrySchedule = (scheduledAt: Date) => {
    if (!event?.id) {
      return;
    }

    setRetryError(null);

    startRetryTransition(async () => {
      try {
        await scheduleGeneratedTweet({
          generatedTweetId: event.id,
          scheduledFor: scheduledAt.toISOString(),
        });
        toast.success("Failed post moved back to scheduled.");
        setIsRetrySchedulerOpen(false);
        onClose();
        router.refresh();
      } catch (retryScheduleError) {
        setRetryError(
          retryScheduleError instanceof Error
            ? retryScheduleError.message
            : "Unable to retry this post.",
        );
      }
    });
  };

  // Updated color options to match types.ts
  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setIsRetrySchedulerOpen(false);
          setRetryError(null);
          onClose();
        }
      }}
      open={isOpen}
    >
      <DialogPopup className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {readOnly
              ? "Post details"
              : event?.id
                ? "Edit Post"
                : "Create Post"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {readOnly
              ? "Review the details of this event"
              : event?.id
                ? "Edit the details of this event"
                : "Add a new event to your calendar"}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="rounded-md bg-destructive/15 px-3 py-2 text-destructive text-sm">
            {error}
          </div>
        )}
        <DialogPanel>
          <div className="grid gap-4 py-1">
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarImage
                  alt={event?.metadata?.xAccountName || event?.metadata?.xAccountUsername || "X account"}
                  src={event?.metadata?.xAccountAvatarUrl ?? undefined}
                />
                <AvatarFallback>{getAccountInitials(event)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium text-sm">
                    {event?.metadata?.xAccountName ||
                      (event?.metadata?.xAccountUsername
                        ? `@${event.metadata.xAccountUsername}`
                        : "X account")}
                  </p>
                  <Badge>{event?.metadata?.generatedTweetStatus || "Default"}</Badge>
                </div>
                {event?.metadata?.xAccountRole ? (
                  <p className="text-xs text-muted-foreground capitalize">
                    {event.metadata.xAccountRole} post
                  </p>
                ) : null}
              </div>
            </div>
            {/* <div className="*:not-first:mt-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                disabled={readOnly}
                id="title"
                onChange={(e) => setTitle(e.target.value)}
                readOnly={readOnly}
                value={title}
              />
            </div> */}

            <div className="*:not-first:mt-1.5">
              <Label htmlFor="description">Content</Label>
              <Textarea
                textareaClassName="text-[15px]"
                disabled={readOnly}
                id="description"
                onChange={(e) => setDescription(e.target.value)}
                readOnly={readOnly}
                rows={3}
                value={description}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1 *:not-first:mt-1.5">
                <Label htmlFor="start-date">Scheduled Date & Time</Label>
                <Popover onOpenChange={setStartDateOpen} open={startDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      className={cn(
                        "group w-full justify-between border-input bg-background px-3 font-normal outline-none outline-offset-0 hover:bg-background focus-visible:outline-[3px]",
                        !startDate && "text-muted-foreground",
                      )}
                      disabled={readOnly}
                      id="start-date"
                      variant={"outline"}
                    >
                      <span
                        className={cn(
                          "truncate",
                          !startDate && "text-muted-foreground",
                        )}
                      >
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </span>
                      <RiCalendarLine
                        aria-hidden="true"
                        className="shrink-0 text-muted-foreground/80"
                        size={16}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-2">
                    <Calendar
                      defaultMonth={startDate}
                      mode="single"
                      onSelect={(date) => {
                        if (date) {
                          setStartDate(date);
                          // If end date is before the new start date, update it to match the start date
                          if (isBefore(endDate, date)) {
                            setEndDate(date);
                          }
                          setError(null);
                          setStartDateOpen(false);
                        }
                      }}
                      selected={startDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {!allDay && (
                <div className="min-w-28 *:not-first:mt-1.5">
                  <Label htmlFor="start-time">-</Label>
                  <Select
                    onValueChange={(value) => setStartTime(value ?? "")}
                    value={startTime}
                  >
                    <SelectTrigger disabled={readOnly} id="start-time">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* <div className="flex gap-4">
              <div className="flex-1 *:not-first:mt-1.5">
                <Label htmlFor="end-date">End Date</Label>
                <Popover onOpenChange={setEndDateOpen} open={endDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      className={cn(
                        "group w-full justify-between border-input bg-background px-3 font-normal outline-none outline-offset-0 hover:bg-background focus-visible:outline-[3px]",
                        !endDate && "text-muted-foreground",
                      )}
                      disabled={readOnly}
                      id="end-date"
                      variant={"outline"}
                    >
                      <span
                        className={cn(
                          "truncate",
                          !endDate && "text-muted-foreground",
                        )}
                      >
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </span>
                      <RiCalendarLine
                        aria-hidden="true"
                        className="shrink-0 text-muted-foreground/80"
                        size={16}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-2">
                    <Calendar
                      defaultMonth={endDate}
                      disabled={{ before: startDate }}
                      mode="single"
                      onSelect={(date) => {
                        if (date) {
                          setEndDate(date);
                          setError(null);
                          setEndDateOpen(false);
                        }
                      }}
                      selected={endDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {!allDay && (
                <div className="min-w-28 *:not-first:mt-1.5">
                  <Label htmlFor="end-time">End Time</Label>
                  <Select
                    onValueChange={(value) => setEndTime(value ?? "")}
                    value={endTime}
                  >
                    <SelectTrigger disabled={readOnly} id="end-time">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div> */}

            {/* <div className="flex items-center gap-2">
              <Checkbox
                checked={allDay}
                disabled={readOnly}
                id="all-day"
                onCheckedChange={(checked) => setAllDay(checked === true)}
              />
              <Label htmlFor="all-day">All day</Label>
            </div> */}

            {/* <div className="*:not-first:mt-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                disabled={readOnly}
                id="location"
                onChange={(e) => setLocation(e.target.value)}
                readOnly={readOnly}
                value={location}
              />
            </div> */}
            {/* <fieldset className="space-y-4">
              <legend className="font-medium text-foreground text-sm leading-none">
                Etiquette
              </legend>
              <RadioGroup
                className="flex gap-1.5"
                defaultValue={colorOptions[0]?.value}
                disabled={readOnly}
                onValueChange={(value: EventColor) => setColor(value)}
                value={color}
              >
                {colorOptions.map((colorOption) => (
                  <RadioGroupItem
                    aria-label={colorOption.label}
                    className={cn(
                      "size-6 shadow-none",
                      colorOption.bgClass,
                      colorOption.borderClass,
                    )}
                    id={`color-${colorOption.value}`}
                    key={colorOption.value}
                    value={colorOption.value}
                  />
                ))}
              </RadioGroup>
            </fieldset> */}
          </div>

          {isFailedGeneratedTweet ? (
            <div className="mt-4 space-y-3 rounded-md border border-rose-200 bg-rose-50/70 p-3">
              <p className="text-sm font-medium text-rose-700">
                This post failed to publish.
              </p>
              {event?.metadata?.errorMessage ? (
                <p className="text-xs text-rose-700/90">
                  {event.metadata.errorMessage}
                </p>
              ) : (
                <p className="text-xs text-rose-700/90">
                  Pick a new date and time to retry this post.
                </p>
              )}

              {isRetrySchedulerOpen ? (
                <CalendarSelectWithTime
                  confirmLabel="Retry and schedule"
                  initialValue={retryInitialDate}
                  isSubmitting={isRetrying}
                  onConfirm={handleRetrySchedule}
                />
              ) : null}

              {retryError ? (
                <p className="text-xs text-rose-700">{retryError}</p>
              ) : null}
            </div>
          ) : null}
        </DialogPanel>
        <DialogFooter className="flex-row sm:justify-between">
          {!readOnly && event?.id && (
            <Button
              aria-label="Delete event"
              onClick={handleDelete}
              size="icon"
              variant="outline"
            >
              <RiDeleteBinLine aria-hidden="true" size={16} />
            </Button>
          )}
          {readOnly ? (
            <div className="flex flex-1 justify-end gap-2">
              {isFailedGeneratedTweet ? (
                <Button
                  disabled={isRetrying}
                  onClick={() => {
                    setRetryError(null);
                    setIsRetrySchedulerOpen((current) => !current);
                  }}
                  variant={isRetrySchedulerOpen ? "secondary" : "default"}
                >
                  {isRetrySchedulerOpen ? "Hide retry picker" : "Retry post"}
                </Button>
              ) : null}
              <DialogClose render={<Button variant="outline" />}>
                Close
              </DialogClose>
            </div>
          ) : (
            <div className="flex flex-1 justify-end gap-2">
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button onClick={handleSave}>Save</Button>
            </div>
          )}
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
