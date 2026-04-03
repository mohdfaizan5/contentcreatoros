import MainCalendar from "@/components/main-calendar";
import { getGeneratedTweetCalendarEvents } from "@/actions/generated-tweets";

export default async function CalendarPage() {
  const calendarEvents = await getGeneratedTweetCalendarEvents();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Content Calendar
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          See what is queued for X and what has already gone out, all on a
          single calendar.
        </p>
        <p className="text-xs text-muted-foreground/80">
          {calendarEvents.length
            ? `${calendarEvents.length} synced X posts are showing on your calendar.`
            : "No scheduled or published X posts yet. Generate one from Templates to see it here."}
        </p>
      </div>

      <MainCalendar initialEvents={calendarEvents} readOnly />
    </div>
  );
}
