'use client';
import { useId } from "react";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";

import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { Loader2, Sparkles } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import type { DateRange } from 'react-day-picker';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronDownIcon } from "lucide-react";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import { Frame, FrameHeader, FramePanel } from "@/shared/components/ui/frame";
import { enqueueWorkflowPlannerRun } from '@/features/workflow/actions/workflow-planner';
import TwoCalendarRange from '@/shared/components/two-calendar-range';
import { Button } from '@/shared/components/ui/button';
import {
  WORKFLOW_PLANNER_MAX_DAYS,
  WORKFLOW_PLANNER_MIN_DAYS,
} from '@/features/workflow/lib/workflow-planner-limits';
import type { XAccountRole } from '@/shared/types/database';
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";

function toDateInputValue(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

export default function WorkflowNewRunClient({
  xAccounts,
}: {
  xAccounts: Array<{
    id: string;
    role: XAccountRole;
    username: string;
  }>;
}) {
  const id = useId();
  const [selectedValue, setSelectedValue] = useState("on");
  const [campaignBrief, setCampaignBrief] = useState('');
  const [selectedXAccountId, setSelectedXAccountId] = useState<string | null>(null);

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

    if (!selectedXAccountId) {
      toast.error('Choose a founder or company X account before queueing this workflow.');
      return;
    }

    startTransition(async () => {
      try {
        const { runId } = await enqueueWorkflowPlannerRun({
          campaignBrief,
          endDateISO,
          postsPerDay: selectedValue === 'on' ? 2 : 1,
          startDateISO,
          targetXAccountId: selectedXAccountId,
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
      <Frame className="w-full">
        <Collapsible>
          <FrameHeader className="flex-row items-center justify-end px-2 py-2">
            <CollapsibleTrigger
              className="data-panel-open:[&_svg]:rotate-180"
              render={<Button variant="ghost" />}
            >
              <ChevronDownIcon className="size-4" />
              More
            </CollapsibleTrigger>
            {/* <Button aria-label="Delete" size="icon" variant="ghost">
                <TrashIcon />
              </Button> */}
          </FrameHeader>
          <CollapsiblePanel>
            <FramePanel>
              {/* <h2 className="font-semibold text-sm">Section title</h2> */}
              {/* <p className="text-muted-foreground text-sm">Section description</p> */}
              <Label className="pr-4 mb-8 relative z-10 inline-flex h-full min-w-8 cursor-pointer select-none items-center justify-center whitespace-nowrap  transition-colors group-data-[state=on]:text-muted-foreground/70">
                How many posts per day?
              </Label>
              <div className="inline-flex my-2 h-9 rounded-md bg-input/50 p-0.5">
                <RadioGroup
                  className="group relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 font-medium text-sm after:absolute after:inset-y-0 after:w-1/2 after:rounded-sm after:bg-background after:shadow-xs after:transition-[translate,box-shadow] after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)] has-focus-visible:after:border-ring has-focus-visible:after:ring-[3px] has-focus-visible:after:ring-ring/50 data-[state=off]:after:translate-x-0 data-[state=on]:after:translate-x-full"
                  data-state={selectedValue}
                  onValueChange={setSelectedValue}
                  value={selectedValue}
                >
                  <label className="relative z-10 inline-flex h-full min-w-8 cursor-pointer select-none items-center justify-center whitespace-nowrap px-4 transition-colors group-data-[state=on]:text-muted-foreground/70">
                    1 post/day
                    <RadioGroupItem className="sr-only" id={`${id}-1`} value="off" />
                  </label>
                  <label className="relative z-10 inline-flex h-full min-w-8 cursor-pointer select-none items-center justify-center whitespace-nowrap px-4 transition-colors group-data-[state=off]:text-muted-foreground/70">
                    <span>
                      2 posts/day
                      <span className="transition-colors group-data-[state=off]:text-muted-foreground/70 group-data-[state=on]:text-emerald-500">
                        -20%
                      </span>
                    </span>
                    <RadioGroupItem className="sr-only" id={`${id}-2`} value="on" />
                  </label>
                </RadioGroup>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                  <div className="inline-flex w-full items-center justify-between gap-2">
                    <Label>Publish from</Label>
                    <Label className="font-normal text-muted-foreground text-xs" render={<span />}>
                      Required
                    </Label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {xAccounts.length > 0 ? (
                      xAccounts.map((account) => (
                        <button
                          key={account.id}
                          type="button"
                          onClick={() => setSelectedXAccountId(account.id)}
                          className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                            selectedXAccountId === account.id
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-border/50 bg-background text-foreground hover:bg-muted/50'
                          }`}
                        >
                          {account.role === 'company' ? 'Company' : 'Founder'} @{account.username}
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Connect a founder or company X account in Analytics first.
                      </p>
                    )}
                  </div>
                </div>
                <div className="inline-flex w-full items-center justify-between gap-2">
                  <Label>Tell us about your campaign</Label>
                  <Label className="font-normal text-muted-foreground text-xs" render={<span />}>
                    Optional
                  </Label>
                </div>
                <Textarea
                  onChange={(event) => setCampaignBrief(event.target.value)}
                  placeholder="What are you launching, who is it for, what angle should the posts push, and any must-mention details?"
                  rows={5}
                  value={campaignBrief}
                />
              </div>
            </FramePanel>
          </CollapsiblePanel>
        </Collapsible>
      </Frame>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          className="gap-2 w-full"
          disabled={isPending || !hasValidSelectedRange || !selectedXAccountId}
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
          Runs process in the background
          {/* queue. If cron is delayed, you can manually start it from the run page. */}
        </p>
      </div>
    </div>
  );
}

