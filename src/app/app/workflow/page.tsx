import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ArrowRight, Sparkles } from 'lucide-react';

import { listWorkflowPlannerRuns } from '@/actions/workflow-planner';
import { WorkflowRunStatusBadge } from '@/components/workflow/workflow-run-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function formatDateRange(startDate: string, endDate: string) {
    return `${format(parseISO(startDate), 'MMM d')} — ${format(parseISO(endDate), 'MMM d, yyyy')}`;
}

export default async function WorkflowPage() {
    const runs = await listWorkflowPlannerRuns({ limit: 24 });

    return (
        <div className="space-y-4 max-w-3xl">
            <section className="flex flex-wrap items-center justify-between gap-3 mb-8">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight">Workflow</h1>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                        Queue 7-day planning runs, review generated days, and schedule approved posts later.
                    </p>
                </div>

                <Button asChild className="gap-2">
                    <Link href="/app/workflow/new">
                        <Sparkles className="h-4 w-4" />
                        New 7-Day Run
                    </Link>
                </Button>
            </section>

            {runs.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-start gap-3 py-8">
                        <p className="text-sm text-muted-foreground">
                            No workflow runs yet. Create your first 7-day run to start reviewing and scheduling.
                        </p>
                        <Button asChild>
                            <Link href="/app/workflow/new">Create your first run</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {runs.map((run) => (
                        <Card key={run.id}>
                            <CardHeader className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <CardTitle className="text-lg">{formatDateRange(run.start_date, run.end_date)}</CardTitle>
                                        <CardDescription>
                                            Created {format(parseISO(run.created_at), 'MMM d, yyyy h:mm a')}
                                        </CardDescription>
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

                                <div>
                                    <Button asChild variant="outline" className="gap-2">
                                        <Link href={`/app/workflow/${run.id}`}>
                                            Open run
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}