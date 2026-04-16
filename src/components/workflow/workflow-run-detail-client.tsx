'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import {
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Loader2,
    RefreshCcw,
    Timer,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
    regenerateWorkflowPlannerItem,
    retryWorkflowPlannerRun,
    scheduleWorkflowPlannerRun,
    setWorkflowPlannerItemDecision,
    triggerWorkflowPlannerRun,
    updateWorkflowPlannerItemSuggestedPost,
} from '@/actions/workflow-planner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type {
    SevenDayPlanningItem,
    SevenDayPlanningItemApprovalStatus,
    SevenDayPlanningRun,
} from '@/types/database';
import { WorkflowRunStatusBadge } from './workflow-run-status-badge';
import { Tooltip, TooltipPopup, TooltipTrigger } from '../ui/tooltip';
import { QuestionMarkIcon } from '@phosphor-icons/react/dist/ssr';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

function ItemStatusBadge({ status }: { status: SevenDayPlanningItemApprovalStatus }) {
    const className =
        status === 'approved'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : status === 'rejected'
                ? 'border-rose-300 bg-rose-50 text-rose-700'
                : status === 'scheduled'
                    ? 'border-sky-300 bg-sky-50 text-sky-700'
                    : 'border-slate-300 text-slate-600';

    const label =
        status === 'approved'
            ? 'Approved'
            : status === 'rejected'
                ? 'Rejected'
                : status === 'scheduled'
                    ? 'Scheduled'
                    : 'Pending';

    return (
        <Badge className={cn('border', className)} variant="outline">
            {label}
        </Badge>
    );
}

function canModerateRun(status: SevenDayPlanningRun['status']) {
    return status === 'pending_approval';
}

function hasScheduleableItems(items: SevenDayPlanningItem[]) {
    return items.some((item) => item.approval_status === 'approved');
}

export default function WorkflowRunDetailClient({
    run,
    items,
}: {
    run: SevenDayPlanningRun;
    items: SevenDayPlanningItem[];
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [noteByItemId, setNoteByItemId] = useState<Record<string, string>>({});
    const [suggestedPostByItemId, setSuggestedPostByItemId] = useState<Record<string, string>>({});

    const selectedItem = items[selectedIndex] ?? null;
    const CHARACTER_LIMIT = 280;
    const suggestedPostText = selectedItem
        ? (suggestedPostByItemId[selectedItem.id] ?? selectedItem.suggested_post ?? '')
        : '';
    const suggestedPostCharacterCount = suggestedPostText.length;
    const suggestedPostRemainingCharacters = CHARACTER_LIMIT - suggestedPostCharacterCount;
    const hasExceededSuggestedPostLimit = suggestedPostRemainingCharacters < 0;
    const hasSuggestedPostUnsavedChanges = selectedItem
        ? suggestedPostText !== (selectedItem.suggested_post ?? '')
        : false;
    const canEditSuggestedPost = canModerateRun(run.status);
    const shouldPollRun = run.status === 'queued' || run.status === 'generating';

    useEffect(() => {
        if (!shouldPollRun) {
            return;
        }

        const interval = window.setInterval(() => {
            router.refresh();
        }, 5000);

        return () => {
            window.clearInterval(interval);
        };
    }, [router, shouldPollRun]);

    useEffect(() => {
        if (items.length === 0) {
            setSelectedIndex(0);
            return;
        }

        if (selectedIndex > items.length - 1) {
            setSelectedIndex(items.length - 1);
        }
    }, [items.length, selectedIndex]);

    useEffect(() => {
        if (!selectedItem) {
            return;
        }

        const serverSuggestedPost = selectedItem.suggested_post ?? '';

        setSuggestedPostByItemId((current) => {
            const localSuggestedPost = current[selectedItem.id];

            if (localSuggestedPost === undefined) {
                return {
                    ...current,
                    [selectedItem.id]: serverSuggestedPost,
                };
            }

            if (localSuggestedPost === serverSuggestedPost) {
                return current;
            }

            return current;
        });
    }, [selectedItem?.id, selectedItem?.suggested_post]);

    const rangeLabel = useMemo(() => {
        const startDate = parseISO(run.start_date);
        const endDate = parseISO(run.end_date);

        return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
    }, [run.end_date, run.start_date]);

    const handleDecision = (
        itemId: string,
        status: Extract<SevenDayPlanningItemApprovalStatus, 'pending' | 'approved' | 'rejected'>,
    ) => {
        startTransition(async () => {
            try {
                await setWorkflowPlannerItemDecision({
                    itemId,
                    note: noteByItemId[itemId],
                    runId: run.id,
                    status,
                });
                toast.success('Item decision updated.');
                router.refresh();
            } catch (error) {
                toast.error(
                    error instanceof Error ? error.message : 'Unable to update item decision.',
                );
            }
        });
    };

    const handleRegenerate = (itemId: string) => {
        startTransition(async () => {
            try {
                await regenerateWorkflowPlannerItem({
                    itemId,
                    note: noteByItemId[itemId],
                    runId: run.id,
                });
                toast.success('Item regenerated and moved back to pending.');
                router.refresh();
            } catch (error) {
                toast.error(
                    error instanceof Error ? error.message : 'Unable to regenerate this item.',
                );
            }
        });
    };

    const handleSchedule = () => {
        startTransition(async () => {
            try {
                const result = await scheduleWorkflowPlannerRun({ runId: run.id });
                toast.success(`Scheduled ${result.scheduledCount} approved day(s).`);
                router.refresh();
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Unable to schedule this run.');
            }
        });
    };

    const handleRetry = () => {
        startTransition(async () => {
            try {
                await retryWorkflowPlannerRun(run.id);
                toast.success('Run moved back to queue. You can start it immediately.');
                router.refresh();
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Unable to retry this run.');
            }
        });
    };

    const handleStartNow = () => {
        startTransition(async () => {
            try {
                const result = await triggerWorkflowPlannerRun(run.id);

                if (result.code === 'no-queued-runs') {
                    toast.message('Run is no longer queued. Refreshing status.');
                } else if (result.code === 'failed') {
                    toast.error(result.error ?? 'Run failed during generation.');
                } else {
                    toast.success('Run processed. Loading generated items.');
                }

                router.refresh();
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Unable to start this run now.');
            }
        });
    };

    const handleSaveSuggestedPost = (itemId: string) => {
        startTransition(async () => {
            try {
                const suggestedPost = suggestedPostByItemId[itemId] ?? '';

                const result = await updateWorkflowPlannerItemSuggestedPost({
                    itemId,
                    runId: run.id,
                    suggestedPost,
                });

                setSuggestedPostByItemId((current) => ({
                    ...current,
                    [itemId]: result.suggestedPost,
                }));

                toast.success('Suggested post updated.');
                router.refresh();
            } catch (error) {
                toast.error(
                    error instanceof Error ? error.message : 'Unable to update suggested post.',
                );
            }
        });
    };
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-2xl">7-Day Workflow Run</CardTitle>
                            <p className="mt-1 text-sm text-muted-foreground">{rangeLabel}</p>
                        </div>

                        <WorkflowRunStatusBadge status={run.status} />
                    </div>

                    <div className="grid gap-2 sm:grid-cols-4">
                        <div className="rounded-md border bg-muted/20 p-2">
                            <p className="text-xs text-muted-foreground">Pending</p>
                            <p className="text-lg font-semibold">{run.pending_count}</p>
                        </div>
                        <div className="rounded-md border bg-muted/20 p-2">
                            <p className="text-xs text-muted-foreground">Approved</p>
                            <p className="text-lg font-semibold">{run.approved_count}</p>
                        </div>
                        <div className="rounded-md border bg-muted/20 p-2">
                            <p className="text-xs text-muted-foreground">Rejected</p>
                            <p className="text-lg font-semibold">{run.rejected_count}</p>
                        </div>
                        <div className="rounded-md border bg-muted/20 p-2">
                            <p className="text-xs text-muted-foreground">Scheduled</p>
                            <p className="text-lg font-semibold">{run.scheduled_count}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline">
                            <Link href="/app/workflow">Back to Workflow</Link>
                        </Button>

                        {(run.status === 'queued' || run.status === 'generating') && (
                            <Button className="gap-2" disabled={isPending} onClick={handleStartNow}>
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Timer className="h-4 w-4" />
                                )}
                                Start Now
                            </Button>
                        )}

                        {run.status === 'failed' && (
                            <Button className="gap-2" disabled={isPending} onClick={handleRetry}>
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCcw className="h-4 w-4" />
                                )}
                                Retry Run
                            </Button>
                        )}

                        {run.status === 'pending_approval' && hasScheduleableItems(items) && (
                            <Button className="gap-2" disabled={isPending} onClick={handleSchedule}>
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                )}
                                Schedule Approved
                            </Button>
                        )}

                        {run.status === 'scheduled' && (
                            <Button asChild>
                                <Link href="/app/calendar">Open Calendar</Link>
                            </Button>
                        )}
                    </div>

                    {run.generation_error ? (
                        <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
                            <div className="mb-1 inline-flex items-center gap-2 font-medium">
                                <AlertCircle className="h-4 w-4" />
                                Generation Error
                            </div>
                            <p>{run.generation_error}</p>
                        </div>
                    ) : null}
                </CardHeader>
            </Card>

            {run.status === 'queued' || run.status === 'generating' ? (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {run.status === 'queued'
                                ? 'This run is queued. It will be picked by the background dispatcher.'
                                : 'Generation is in progress. The page auto-refreshes every 5 seconds.'}
                        </div>
                    </CardContent>
                </Card>
            ) : null}

            {items.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-[3fr_1fr]">
                    {selectedItem ? (
                        <Card>
                            <CardHeader className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-xl">{selectedItem.day_label}</CardTitle>
                                        <p className="mt-1 text-sm text-muted-foreground">{selectedItem.item_date}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <ItemStatusBadge status={selectedItem.approval_status} />
                                        <Button
                                            disabled={selectedIndex === 0 || isPending}
                                            onClick={() => setSelectedIndex((current) => Math.max(0, current - 1))}
                                            size="icon"
                                            variant="outline"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            disabled={selectedIndex === items.length - 1 || isPending}
                                            onClick={() =>
                                                setSelectedIndex((current) => Math.min(items.length - 1, current + 1))
                                            }
                                            size="icon"
                                            variant="outline"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 text-sm">
                                    <Badge variant="outline">{selectedItem.pillar}</Badge>
                                    <Badge variant="secondary">{selectedItem.content_type}</Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="max-w-2xl space-y-2">
                                    <Textarea
                                        aria-describedby="twitter-post-input-description"
                                        className="max-w-2xl text-[20px] leading-relaxed"
                                        id="twitter-post-input"
                                        onChange={(event) => {
                                            if (!selectedItem) {
                                                return;
                                            }

                                            const nextValue = event.target.value;

                                            setSuggestedPostByItemId((current) => ({
                                                ...current,
                                                [selectedItem.id]: nextValue,
                                            }));
                                        }}
                                        readOnly={!canEditSuggestedPost}
                                        rows={6}
                                        value={suggestedPostText}
                                    />
                                    <div className="flex items-center justify-between gap-3">
                                        <p
                                            aria-live="polite"
                                            className={cn(
                                                'text-xs',
                                                hasExceededSuggestedPostLimit
                                                    ? 'text-destructive'
                                                    : 'text-muted-foreground',
                                            )}
                                            id="twitter-post-input-description"
                                            role="status"
                                        >
                                            {hasExceededSuggestedPostLimit ? (
                                                <>
                                                    <span className="tabular-nums">
                                                        {Math.abs(suggestedPostRemainingCharacters)}
                                                    </span>{' '}
                                                    characters exceeded
                                                </>
                                            ) : (
                                                <>
                                                    <span className="tabular-nums">
                                                        {suggestedPostRemainingCharacters}
                                                    </span>{' '}
                                                    characters left
                                                </>
                                            )}
                                        </p>

                                        {canEditSuggestedPost && hasSuggestedPostUnsavedChanges && selectedItem ? (
                                            <Button
                                                className="gap-2"
                                                disabled={isPending}
                                                onClick={() => handleSaveSuggestedPost(selectedItem.id)}
                                                size="sm"
                                                variant="secondary"
                                            >
                                                {isPending ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : null}
                                                Save text
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-6">
                                    <div className="flex  items-center  gap-2">
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Angle
                                        </p>
                                        <Tooltip>
                                            <TooltipTrigger render={<Button variant="outline" className='rounded-full ' size={"icon-xs"} />}>
                                                <QuestionMarkIcon size={18} />
                                            </TooltipTrigger>
                                            <TooltipPopup>{selectedItem.angle}</TooltipPopup>
                                        </Tooltip>
                                        {/* <p className="mt-1 text-sm">{selectedItem.angle}</p> */}
                                    </div>
                                    <div className="flex  items-center  gap-2">
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Why This Works
                                        </p>

                                        <Tooltip>
                                            <TooltipTrigger render={<Button variant="outline" className='rounded-full ' size={"icon-xs"} />}>
                                                <QuestionMarkIcon size={18} />
                                            </TooltipTrigger>
                                            <TooltipPopup>{selectedItem.rationale}</TooltipPopup>
                                        </Tooltip>
                                        {/* <p className="mt-1 text-sm">{selectedItem.rationale}</p> */}
                                    </div>
                                </div>

                                {/* <div className="space-y-2">
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Decision / Regeneration Note
                                    </p>
                                    <Textarea
                                        onChange={(event) =>
                                            setNoteByItemId((current) => ({
                                                ...current,
                                                [selectedItem.id]: event.target.value,
                                            }))
                                        }
                                        placeholder="Optional context for approve/reject/regenerate"
                                        rows={3}
                                        value={noteByItemId[selectedItem.id] ?? ''}
                                    />
                                </div> */}

                                {canModerateRun(run.status) ? (
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            className="gap-2"
                                            disabled={isPending}
                                            onClick={() => handleDecision(selectedItem.id, 'approved')}
                                            size="sm"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Approve
                                        </Button>
                                        <Button
                                            className="gap-2"
                                            disabled={isPending}
                                            onClick={() => handleDecision(selectedItem.id, 'rejected')}
                                            size="sm"
                                            variant="destructive"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Reject
                                        </Button>
                                        <Button
                                            disabled={isPending}
                                            onClick={() => handleDecision(selectedItem.id, 'pending')}
                                            size="sm"
                                            variant="outline"
                                        >
                                            Reset Pending
                                        </Button>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline">
                                                    {isPending ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <RefreshCcw className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-72">
                                                <h2 className="mb-2 font-semibold text-sm">Anything specific you'd like to share?</h2>
                                                <form className="space-y-3">
                                                    <Textarea
                                                        onChange={(event) =>
                                                            setNoteByItemId((current) => ({
                                                                ...current,
                                                                [selectedItem.id]: event.target.value,
                                                            }))
                                                        }
                                                        value={noteByItemId[selectedItem.id] ?? ''}

                                                        aria-label="Send feedback"
                                                        id="feedback"
                                                        placeholder="eg: 'Generate a post with a more casual tone' or 'The suggested post is great but the angle isn't quite right'"
                                                    />
                                                    <div className="flex flex-col sm:flex-row sm:justify-end">
                                                        <Button
                                                            className="gap-2"
                                                            disabled={isPending}
                                                            onClick={() => handleRegenerate(selectedItem.id)}
                                                            size="sm"
                                                            variant="default"
                                                        >
                                                            {isPending ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <RefreshCcw className="h-4 w-4" />
                                                            )}
                                                            Regenerate
                                                        </Button>
                                                    </div>
                                                </form>
                                            </PopoverContent>
                                        </Popover>

                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        This run is read-only in its current state.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ) : null}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Run Days</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {items.map((item, index) => (
                                <button
                                    className={cn(
                                        'w-full rounded-md border px-3 py-2 text-left transition-colors',
                                        selectedIndex === index
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:bg-muted/40',
                                    )}
                                    key={item.id}
                                    onClick={() => setSelectedIndex(index)}
                                    type="button"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-medium text-sm">{item.day_label}</p> -
                                        <ItemStatusBadge status={item.approval_status} />
                                    </div>
                                    <p className="mt-1 truncate text-xs text-muted-foreground">
                                    </p>
                                    <Badge>
                                        {item.pillar}
                                    </Badge>
                                </button>
                            ))}
                        </CardContent>
                    </Card>


                </div>
            ) : run.status === 'pending_approval' ? (
                <Card>
                    <CardContent className="pt-6 text-sm text-muted-foreground">
                        No generated items were found for this run. Trigger generation again.
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
}
