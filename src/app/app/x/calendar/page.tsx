import MainCalendar from "@/components/main-calendar";
import { getGeneratedTweetCalendarEvents } from "@/actions/generated-tweets";

export default async function XCalendarPage() {
  const calendarEvents = await getGeneratedTweetCalendarEvents();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          X Content Calendar
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Review the X posts you have scheduled, published, or attempted to
          publish.
        </p>
      </div>

      <MainCalendar initialEvents={calendarEvents} readOnly />
    </div>
  );
}
