'use client';

import { CalendarDays, CheckCircle2, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { useEffect, useMemo, useState, useTransition } from 'react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

import {
  generateSevenDayContentPlan,
  regenerateSevenDayPlanItem,
  scheduleSevenDayContentPlan,
  type SevenDayPlanItem,
} from '@/features/dashboard/actions/dashboard';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Terminal } from '@/shared/components/ui/terminal';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/lib/utils';
import TwoCalendarRange from '../../../shared/components/two-calendar-range';

function toDateInputValue(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function statusTone(status: SevenDayPlanItem['status']) {
  return status === 'approved' ? 'default' : 'secondary';
}

const GENERATION_STEPS = [
  'Reading your onboarding context and prior content performance.',
  'Balancing the week across pillars, formats, and CTAs.',
  'Drafting hooks, angles, and high-signal suggested posts.',
  'Running voice and consistency checks for every day.',
  'Finalizing your 7-day timeline for approval and scheduling.',
];
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/shared/components/ui/timeline";
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { ArrowsClockwiseIcon, CaretDownIcon } from '@phosphor-icons/react/dist/ssr';
import { Field } from "@/shared/components/ui/field";
import { Form } from "@/shared/components/ui/form";
import {
  Popover,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@/shared/components/ui/popover";

import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible"

export function SevenDayPlanner() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<'range' | 'generating' | 'review' | 'scheduled'>('range');
  const [items, setItems] = useState<SevenDayPlanItem[]>([]);
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [regeneratingItemId, setRegeneratingItemId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScheduling, startScheduling] = useTransition();
  const [activeGenerationStepIndex, setActiveGenerationStepIndex] = useState(0);
  const [generationElapsedSeconds, setGenerationElapsedSeconds] = useState(0);

  const today = useMemo(() => new Date(), []);
  const defaultRange = useMemo<DateRange>(
    () => ({
      from: today,
      to: addDays(today, 6),
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

  const hasExactSevenDayRange = selectedDayCount === 7;
  const startDateISO = selectedRange?.from ? toDateInputValue(selectedRange.from) : '';
  const endDateISO = selectedRange?.to ? toDateInputValue(selectedRange.to) : '';

  const approvedCount = useMemo(
    () => items.filter((item) => item.status === 'approved').length,
    [items],
  );

  const hasPendingItems = items.some((item) => item.status === 'pending');

  useEffect(() => {
    if (phase !== 'generating') {
      setActiveGenerationStepIndex(0);
      setGenerationElapsedSeconds(0);
      return;
    }

    const stepInterval = window.setInterval(() => {
      setActiveGenerationStepIndex((current) => (current + 1) % GENERATION_STEPS.length);
    }, 900);

    const elapsedInterval = window.setInterval(() => {
      setGenerationElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => {
      window.clearInterval(stepInterval);
      window.clearInterval(elapsedInterval);
    };
  }, [phase]);

  function resetPlanner() {
    setPhase('range');
    setItems([]);
    setNoteById({});
    setRegeneratingItemId(null);
    setIsGenerating(false);
    setSelectedRange(defaultRange);
    setActiveGenerationStepIndex(0);
    setGenerationElapsedSeconds(0);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetPlanner();
    }
  }

  async function handleGeneratePlan() {
    if (!hasExactSevenDayRange || !startDateISO || !endDateISO) {
      toast.error('Select exactly 7 days before generating your timeline.');
      return;
    }

    setPhase('generating');
    setIsGenerating(true);

    try {
      const response = await generateSevenDayContentPlan({
        startDateISO,
        endDateISO,
      });

      setItems(response.items);
      setPhase('review');
      toast.success('7-day plan generated. Review and approve each day.');
    } catch (error) {
      setPhase('range');
      toast.error(error instanceof Error ? error.message : 'Unable to generate the plan.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRegenerateItem(item: SevenDayPlanItem) {
    setRegeneratingItemId(item.id);

    try {
      const updatedItem = await regenerateSevenDayPlanItem({
        dateISO: item.dateISO,
        existingItem: item,
        note: noteById[item.id]?.trim() || undefined,
      });

      setItems((currentItems) =>
        currentItems.map((entry) => (entry.id === item.id ? updatedItem : entry)),
      );

      toast.success(`Updated ${item.dayLabel} draft.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to regenerate this day.');
    } finally {
      setRegeneratingItemId(null);
    }
  }

  function handleToggleApproval(itemId: string) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
            ...item,
            status: item.status === 'approved' ? 'pending' : 'approved',
          }
          : item,
      ),
    );
  }
  const items2 = [
    {
      date: "15 minutes ago",
      description:
        "Submitted PR #342 with new feature implementation. Waiting for code review from team leads.",
      id: 1,
      title: "Pull Request Submitted",
    },
    {
      date: "10 minutes ago",
      description:
        "Automated tests and build process initiated. Running unit tests and code quality checks.",
      id: 2,
      title: "CI Pipeline Started",
    },
    {
      date: "5 minutes ago",
      description:
        "Received comments on PR. Minor adjustments needed in error handling and documentation.",
      id: 3,
      title: "Code Review Feedback",
    },
    {
      description:
        "Implemented requested changes and pushed updates to feature branch. Awaiting final approval.",
      id: 4,
      title: "Changes Pushed",
    },
  ];
  function handleScheduleApproved() {
    startScheduling(async () => {
      try {
        const response = await scheduleSevenDayContentPlan({ items });
        toast.success(`Scheduled ${response.scheduledCount} approved day(s).`);
        setPhase('scheduled');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to schedule content.');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Plan Content (7 Days)
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-6xl">
        <div className="grid max-h-[90vh] gap-0 md:grid-cols-[2.6fr_1fr]">
          <div className="overflow-y-auto p-6 mb-[500px]">
            <DialogHeader className="space-y-3 pb-4">
              <DialogTitle className="text-xl mb-0!">7-Day Planning Workflow</DialogTitle>
              <DialogDescription className={""}>
                Pick exactly seven days, generate your timeline, then approve or regenerate each day
                with notes before scheduling.
              </DialogDescription>

              <div className="flex flex-wrap gap-2 ">
                <Badge variant={phase === 'range' ? 'default' : 'secondary'}>1. Select Range</Badge>
                <Badge variant={phase === 'generating' ? 'default' : 'secondary'}>
                  2. Generate Drafts
                </Badge>
                <Badge variant={phase === 'review' ? 'default' : 'secondary'}>3. Review Drafts</Badge>
                <Badge variant={phase === 'scheduled' ? 'default' : 'secondary'}>
                  4. Scheduled
                </Badge>
              </div>
            </DialogHeader>

            {phase === 'range' ? (
              <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4">
                <TwoCalendarRange
                  value={selectedRange}
                  onChange={setSelectedRange}
                  maxDays={7}
                  minDate={today}
                />

                <p className="text-xs text-muted-foreground">
                  {selectedRange?.from && selectedRange?.to
                    ? `${format(selectedRange.from, 'MMM d')} - ${format(selectedRange.to, 'MMM d, yyyy')} (${selectedDayCount} days selected)`
                    : 'Select a start and end date for your next 7 days.'}
                </p>

                {selectedDayCount > 0 && !hasExactSevenDayRange ? (
                  <p className="text-xs text-destructive">Select exactly 7 days to continue.</p>
                ) : null}

                <Button
                  onClick={handleGeneratePlan}
                  disabled={isGenerating || !hasExactSevenDayRange}
                  className="gap-2"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate Timeline
                </Button>
              </div>
            ) : null}

            {phase === 'generating' ? (
              <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4">
                <Terminal className="w-full max-w-none bg-muted-foreground/5" sequence={false}>
                  <p className="text-sm font-normal tracking-tight text-slate-200">
                    &gt; AI planner is generating your 7-day timeline...
                  </p>

                  {GENERATION_STEPS.map((step, index) => {
                    const isActive = index === activeGenerationStepIndex;

                    return (
                      <div
                        key={step}
                        className={cn(
                          'flex items-center gap-2 text-sm font-normal tracking-tight transition-opacity duration-300',
                          isActive ? 'text-emerald-400 opacity-100' : 'text-emerald-400/60 opacity-80',
                        )}
                      >
                        <span
                          className={cn(
                            'inline-flex size-2 rounded-full',
                            isActive ? 'animate-pulse bg-emerald-400' : 'bg-emerald-400/45',
                          )}
                        />
                        <span>{step}</span>
                      </div>
                    );
                  })}

                  <p className="mt-6 text-sm font-semibold text-muted-foreground">
                    Planning in progress{'.'.repeat((generationElapsedSeconds % 3) + 1)} {generationElapsedSeconds}s
                  </p>
                </Terminal>
              </div>
            ) : null}

            {phase === 'review' || phase === 'scheduled' ? (
              <div className="space-y-3">
                {items.map((item) => {
                  const isRegenerating = regeneratingItemId === item.id;

                  return (
                    <article
                      key={item.id}
                      className="space-y-3 rounded-lg border border-border bg-card p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">{item.dayLabel}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{item.pillar}</Badge>
                            <Badge variant="secondary">{item.contentType}</Badge>
                            <Badge variant={statusTone(item.status)}>{item.status}</Badge>
                          </div>
                        </div>

                        <div className='space-x-1'>
                          <Popover>
                            <PopoverTrigger render={<Button variant="secondary" size={"icon"} />}>
                              <ArrowsClockwiseIcon size={32} />
                            </PopoverTrigger>
                            <PopoverPopup className="w-80">
                              <div className="mb-4">
                                {/* <PopoverTitle className="text-base">Send us feedback</PopoverTitle> */}
                                <PopoverDescription>
                                  Is there something specific you'd like
                                  {/* to see */}
                                  {/* in the regenerated draft?   */}
                                </PopoverDescription>
                              </div>
                              <Form>
                                <Field>
                                  <Textarea
                                    aria-label="Send feedback"
                                    id="feedback"
                                    value={noteById[item.id] ?? ''}
                                    onChange={(event) =>
                                      setNoteById((current) => ({
                                        ...current,
                                        [item.id]: event.target.value,
                                      }))
                                    }
                                    placeholder="For example: `Make this more contrarian and add a stronger hook.`"
                                  />
                                </Field>
                                <Button type="submit" className="gap-2"
                                  disabled={isRegenerating || isScheduling}
                                  onClick={() => handleRegenerateItem(item)}
                                >
                                  {isRegenerating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RotateCcw className="h-4 w-4" />
                                  )} Regenerate</Button>
                              </Form>
                            </PopoverPopup>
                          </Popover>

                          <Button
                            variant={item.status === 'approved' ? 'destructive' : 'default'}
                            onClick={() => handleToggleApproval(item.id)}
                            className="gap-2"
                            size="sm"
                          >

                            <CheckCircle2 className="h-4 w-4" />
                            {item.status === 'approved' ? 'Unapprove' : 'Approve'}
                          </Button>
                          <Button
                            variant={'secondary'}
                            className=""
                            size="icon"
                          >
                            <MdChevronLeft />

                          </Button>
                          <Button
                            variant={'secondary'}
                            className=""
                            size="icon"
                          >
                            <MdChevronRight />

                          </Button>
                        </div>
                      </div>
                      <Collapsible>
                        <CollapsibleTrigger className={"text-sm"}>understand the post <CaretDownIcon className='inline-flex' size={18} weight="duotone" /></CollapsibleTrigger>
                        <CollapsiblePanel>
                        <p className="text-sm text-foreground"><span className='font-mono'>Angle</span>{item.angle}</p>
                        <p className="text-sm text-foreground"><span className='font-mono'>Why this works</span>{item.rationale}</p>
                          
                        </CollapsiblePanel>
                      </Collapsible>
                     
                      <div className="space-y-2 ">
                        {/* <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Suggested post
                        </p> */}
                        <p className="rounded-md bg-muted/70 border p-3 text-sm leading-relaxed text-foreground">
                          {item.suggestedPost}
                        </p>
                      </div>

                      {/* <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Regeneration note (optional)
                        </label>
                        <Textarea
                          rows={2}
                          value={noteById[item.id] ?? ''}
                          onChange={(event) =>
                            setNoteById((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          placeholder="Example: make this more contrarian and add a stronger hook."
                        />
                      </div> */}

                      {/* <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={isRegenerating || isScheduling}
                          onClick={() => handleRegenerateItem(item)}
                        >
                          {isRegenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                          Regenerate
                        </Button>
                      </div> */}
                    </article>
                  );
                })}
              </div>
            ) : null}

            {phase === 'review' ? (
              <div className="sticky bottom-0 mt-4 flex flex-wrap items-center gap-2 border-t border-border bg-background/95 pt-4 backdrop-blur-sm">
                <Button
                  variant="outline"
                  onClick={() => setPhase('range')}
                  disabled={isScheduling || isGenerating || regeneratingItemId !== null}
                >
                  Back to Date Range
                </Button>

                <Button
                  onClick={handleScheduleApproved}
                  disabled={
                    isScheduling || isGenerating || regeneratingItemId !== null || approvedCount === 0
                  }
                  className="gap-2"
                >
                  {isScheduling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarDays className="h-4 w-4" />
                  )}
                  Schedule Approved ({approvedCount})
                </Button>

                {hasPendingItems ? (
                  <p className="text-xs text-muted-foreground">
                    Pending days will not be scheduled until approved.
                  </p>
                ) : null}
              </div>
            ) : null}

            {phase === 'scheduled' ? (
              <div className="mt-4 space-y-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
                <p className="text-sm font-semibold">Approved days have been sent to your calendar.</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setPhase('review')}>
                    Back to Review
                  </Button>
                  <Button onClick={() => setOpen(false)}>Done</Button>
                </div>
              </div>
            ) : null}
          </div>

          <aside className="hidden border-l border-border bg-muted/20 p-5 md:block">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Quick Timeline
            </p>
            <Timeline defaultValue={3}>
              {items.map((item, i) => (
                <TimelineItem key={item.id} step={i + 1}>
                  <TimelineHeader>
                    <TimelineSeparator />
                    <TimelineTitle className="-mt-0.5">
                      <span
                        className={`mt-1 w-2.5 rounded-full ${item.status === 'approved' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                      />
                      {i < items.length - 1 ? <span className="mt-1 h-full w-px bg-border" /> : null}
                    </TimelineTitle>
                    <TimelineIndicator />
                  </TimelineHeader>
                  <TimelineContent>
                    <TimelineDate className="mt-2 mb-0">{item.dayLabel}</TimelineDate>
                    {item.pillar}
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
            <div className="mt-4 space-y-3">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {phase === 'generating'
                    ? 'AI is drafting your timeline. This usually takes a few seconds.'
                    : 'Generate a range to visualize the 7-day sequence.'}
                </p>
              ) : (
                items.map((item, index) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex w-6 flex-col items-center">
                      <span
                        className={`mt-1 h-2.5 w-2.5 rounded-full ${item.status === 'approved' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                      />
                      {index < items.length - 1 ? <span className="mt-1 h-full w-px bg-border" /> : null}
                    </div>

                    <div className="min-w-0 pb-3">
                      <p className="text-xs font-semibold text-foreground">{item.dayLabel}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.pillar}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

