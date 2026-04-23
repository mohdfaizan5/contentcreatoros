'use client';

import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { Loader2, Sparkles } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import type { DateRange } from 'react-day-picker';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { enqueueWorkflowPlannerRun } from '@/actions/workflow-planner';
import TwoCalendarRange from '@/components/two-calendar-range';
import { Button } from '@/components/ui/button';
import {
  WORKFLOW_PLANNER_MAX_DAYS,
  WORKFLOW_PLANNER_MIN_DAYS,
} from '@/lib/workflow-planner-limits';

function toDateInputValue(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

export default function WorkflowNewRunClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const today = useMemo(() => new Date(), []);
  const defaultRange = useMemo<DateRange>(
    () => ({
      from: today,
      to: addDays(today, Math.min(6, WORKFLOW_PLANNER_MAX_DAYS - 1)),
    }),
    [today],
  );

  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(defaultRange);

  const selectedDayCount = useMemo(() => {
    if (!selectedRange?.from || !selectedRange?.to) {
      return 0;
    }

    return differenceInCalendarDays(selectedRange.to, selectedRange.from) + 1;
  }, [selectedRange]);

  const hasValidSelectedRange =
    selectedDayCount >= WORKFLOW_PLANNER_MIN_DAYS &&
    selectedDayCount <= WORKFLOW_PLANNER_MAX_DAYS;

  const startDateISO = selectedRange?.from
    ? toDateInputValue(selectedRange.from)
    : '';
  const endDateISO = selectedRange?.to ? toDateInputValue(selectedRange.to) : '';

  const handleQueueRun = () => {
    if (!hasValidSelectedRange || !startDateISO || !endDateISO) {
      toast.error(
        `Select ${WORKFLOW_PLANNER_MIN_DAYS}-${WORKFLOW_PLANNER_MAX_DAYS} days before queueing this workflow run.`,
      );
      return;
    }

    startTransition(async () => {
      try {
        const { runId } = await enqueueWorkflowPlannerRun({
          endDateISO,
          startDateISO,
        });

        toast.success('Workflow run queued. Opening detail view.');
        router.push(`/app/workflow/${runId}`);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Unable to queue workflow generation.',
        );
      }
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-card p-5">
      <TwoCalendarRange
        value={selectedRange}
        onChange={setSelectedRange}
        maxDays={WORKFLOW_PLANNER_MAX_DAYS}
        className='bg-background/70'
        minDate={today}
      />

      <p className="text-sm text-muted-foreground">
        {selectedRange?.from && selectedRange?.to
          ? `${format(selectedRange.from, 'MMM d')} - ${format(selectedRange.to, 'MMM d, yyyy')} (${selectedDayCount} days selected)`
          : `Select ${WORKFLOW_PLANNER_MIN_DAYS}-${WORKFLOW_PLANNER_MAX_DAYS} days for your next campaign.`}
      </p>

      {selectedDayCount > 0 && !hasValidSelectedRange ? (
        <p className="text-sm text-destructive">
          Select {WORKFLOW_PLANNER_MIN_DAYS}-{WORKFLOW_PLANNER_MAX_DAYS} days to continue.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          className="gap-2"
          disabled={isPending || !hasValidSelectedRange}
          onClick={handleQueueRun}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Queue Campaign
        </Button>

        <p className="text-xs text-muted-foreground">
          Runs process in the background queue. If cron is delayed, you can manually start it from the run page.
        </p>
      </div>
    </div>
  );
}
