import MainCalendar from "@/components/main-calendar";

export default function XCalendarPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          X Content Calendar
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Plan, move, and review your upcoming X content in calendar form.
        </p>
      </div>

      <MainCalendar />
    </div>
  );
}
