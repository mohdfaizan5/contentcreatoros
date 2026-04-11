'use client';

import { CalendarDays, CheckCircle2, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  generateSevenDayContentPlan,
  regenerateSevenDayPlanItem,
  scheduleSevenDayContentPlan,
  type SevenDayPlanItem,
} from '@/actions/dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

function toDateInputValue(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function statusTone(status: SevenDayPlanItem['status']) {
  return status === 'approved' ? 'default' : 'secondary';
}

export function SevenDayPlanner() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<'range' | 'review' | 'scheduled'>('range');
  const [items, setItems] = useState<SevenDayPlanItem[]>([]);
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [regeneratingItemId, setRegeneratingItemId] = useState<string | null>(null);
  const [isGenerating, startGenerating] = useTransition();
  const [isScheduling, startScheduling] = useTransition();

  const today = useMemo(() => new Date(), []);
  const [startDateISO, setStartDateISO] = useState(toDateInputValue(today));
  const [endDateISO, setEndDateISO] = useState(toDateInputValue(addDays(today, 6)));

  const approvedCount = useMemo(
    () => items.filter((item) => item.status === 'approved').length,
    [items],
  );

  const hasPendingItems = items.some((item) => item.status === 'pending');

  function resetPlanner() {
    setPhase('range');
    setItems([]);
    setNoteById({});
    setRegeneratingItemId(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetPlanner();
    }
  }

  function handleGeneratePlan() {
    startGenerating(async () => {
      try {
        const response = await generateSevenDayContentPlan({
          startDateISO,
          endDateISO,
        });

        setItems(response.items);
        setPhase('review');
        toast.success('7-day plan generated. Review and approve each day.');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to generate the plan.');
      }
    });
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
        <div className="grid max-h-[90vh] gap-0 md:grid-cols-[2.2fr_1fr]">
          <div className="overflow-y-auto p-6">
            <DialogHeader className="space-y-3 pb-4">
              <DialogTitle className="text-xl">7-Day Planning Workflow</DialogTitle>
              <DialogDescription>
                Pick exactly seven days, generate your timeline, then approve or regenerate each day
                with notes before scheduling.
              </DialogDescription>

              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant={phase === 'range' ? 'default' : 'secondary'}>1. Select Range</Badge>
                <Badge variant={phase === 'review' ? 'default' : 'secondary'}>2. Review Drafts</Badge>
                <Badge variant={phase === 'scheduled' ? 'default' : 'secondary'}>
                  3. Scheduled
                </Badge>
              </div>
            </DialogHeader>

            {phase === 'range' ? (
              <div className="space-y-4 rounded-lg border border-border bg-background p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Start date</p>
                    <Input
                      type="date"
                      value={startDateISO}
                      onChange={(event) => setStartDateISO(event.target.value)}
                    />
                  </label>

                  <label className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">End date</p>
                    <Input
                      type="date"
                      value={endDateISO}
                      onChange={(event) => setEndDateISO(event.target.value)}
                    />
                  </label>
                </div>

                <p className="text-xs text-muted-foreground">
                  This flow requires a 7-day range exactly.
                </p>

                <Button onClick={handleGeneratePlan} disabled={isGenerating} className="gap-2">
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate Timeline
                </Button>
              </div>
            ) : null}

            {phase !== 'range' ? (
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

                        <Button
                          variant={item.status === 'approved' ? 'secondary' : 'default'}
                          onClick={() => handleToggleApproval(item.id)}
                          className="gap-2"
                          size="sm"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {item.status === 'approved' ? 'Unapprove' : 'Approve'}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Angle
                        </p>
                        <p className="text-sm text-foreground">{item.angle}</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Why this works
                        </p>
                        <p className="text-sm text-foreground">{item.rationale}</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Suggested post
                        </p>
                        <p className="rounded-md bg-muted/40 p-3 text-sm leading-relaxed text-foreground">
                          {item.suggestedPost}
                        </p>
                      </div>

                      <div className="space-y-2">
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
                      </div>

                      <div className="flex flex-wrap gap-2">
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
                      </div>
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
            <div className="mt-4 space-y-3">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Generate a range to visualize the 7-day sequence.
                </p>
              ) : (
                items.map((item, index) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex w-6 flex-col items-center">
                      <span
                        className={`mt-1 h-2.5 w-2.5 rounded-full ${
                          item.status === 'approved' ? 'bg-emerald-500' : 'bg-slate-400'
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
