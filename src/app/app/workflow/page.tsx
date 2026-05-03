import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr';

import { listWorkflowPlannerRuns } from '@/features/workflow/actions/workflow-planner';
import { WorkflowRunCardMenu } from '@/features/workflow/components/workflow-run-card-menu';
import { WorkflowRunStatusBadge } from '@/features/workflow/components/workflow-run-status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';

function formatDateRange(startDate: string, endDate: string) {
    return `${format(parseISO(startDate), 'MMM d')} - ${format(parseISO(endDate), 'MMM d, yyyy')}`;
}

function getInitials(value: string) {
    const parts = value.split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '');

    return initials.join('') || 'X';
}

export default async function WorkflowPage() {
    const runs = await listWorkflowPlannerRuns({ limit: 24 });

    return (
        <div className="mx-auto max-w-3xl space-y-4">
            <section className="mt-4 mb-8 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight">Workflow</h1>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                        Queue campaign planning runs, review generated days, and schedule approved posts later.
                    </p>
                </div>

                <Button asChild className="flex gap-2">
                    <Link href="/app/workflow/new">
                        New Campain
                        <PlusIcon size={28} />
                    </Link>
                </Button>
            </section>

            {runs.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-start gap-3 py-8">
                        <p className="text-sm text-muted-foreground">
                            No workflow runs yet. Create your first campaign to start reviewing and scheduling.
                        </p>
                        <Button asChild>
                            <Link href="/app/workflow/new">Create your first run</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {runs.map((run) => {
                        const rangeLabel = formatDateRange(run.start_date, run.end_date);

                        return (
                            <Card key={run.id}>
                                <CardHeader className="space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex gap-2">
                                            <Avatar>
                                                <AvatarImage
                                                    alt={run.xProfile?.name ?? run.xProfile?.username ?? 'X account avatar'}
                                                    src={run.xProfile?.avatarUrl ?? undefined}
                                                />
                                                <AvatarFallback>
                                                    {getInitials(run.xProfile?.name ?? run.xProfile?.username ?? 'X')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-lg">{rangeLabel}</CardTitle>
                                                <CardDescription>
                                                    <span className="mr-1 font-medium">Created</span>
                                                    {format(parseISO(run.created_at), 'MMM d, yyyy h:mm a')}
                                                    <span className="mx-1">·</span>
                                                    <WorkflowRunStatusBadge status={run.status} />
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button asChild className="group gap-2" variant="outline">
                                                <Link href={`/app/workflow/${run.id}`}>
                                                    Open Campain
                                                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:-rotate-45" />
                                                </Link>
                                            </Button>
                                            <WorkflowRunCardMenu rangeLabel={rangeLabel} runId={run.id} />
                                        </div>
                                    </div>

                                    <div className="grid gap-2 sm:grid-cols-4">
                                        <div className="flex items-center justify-between rounded-md border bg-muted/20 px-2 py-1">
                                            <p className="text-xs text-muted-foreground">Pending</p>
                                            <p className="text-lg font-semibold">{run.pending_count}</p>
                                        </div>
                                        <div className="flex items-center justify-between rounded-md border bg-muted/20 px-2 py-1">
                                            <p className="text-xs text-muted-foreground">Approved</p>
                                            <p className="text-lg font-semibold">{run.approved_count}</p>
                                        </div>
                                        <div className="flex items-center justify-between rounded-md border bg-muted/20 px-2 py-1">
                                            <p className="text-xs text-muted-foreground">Rejected</p>
                                            <p className="text-lg font-semibold">{run.rejected_count}</p>
                                        </div>
                                        <div className="flex items-center justify-between rounded-md border bg-muted/20 px-2 py-1">
                                            <p className="text-xs text-muted-foreground">Scheduled</p>
                                            <p className="text-lg font-semibold">{run.scheduled_count}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
