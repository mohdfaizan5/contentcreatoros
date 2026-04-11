import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';
import {
    CalendarClock,
    Flame,
    MessageSquareHeart,
    PenSquare,
    TrendingUp,
    TriangleAlert,
    Users,
} from 'lucide-react';

import { getDashboardSnapshot } from '@/actions/dashboard';
import { SevenDayPlanner } from '@/components/dashboard/seven-day-planner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const quickActions = [
    {
        title: 'Capture Idea',
        description: 'Drop a raw idea before it disappears.',
        href: '/app/ideas',
        icon: PenSquare,
    },
    {
        title: 'Content Calendar',
        description: 'View and refine your upcoming schedule.',
        href: '/app/calendar',
        icon: CalendarClock,
    },
    {
        title: 'X Workspace',
        description: 'Track generated posts and publishing.',
        href: '/app/x',
        icon: TrendingUp,
    },
];

function scoreTone(score: number) {
    if (score >= 80) {
        return 'text-emerald-600';
    }

    if (score >= 60) {
        return 'text-sky-600';
    }

    if (score >= 40) {
        return 'text-amber-600';
    }

    return 'text-red-600';
}

export default async function DashboardPage() {
    const snapshot = await getDashboardSnapshot();

    const relativeNextScheduled = snapshot.nextScheduledAt
        ? formatDistanceToNowStrict(new Date(snapshot.nextScheduledAt), { addSuffix: true })
        : null;

    return (
        <div className="mx-auto grid w-full max-w-6xl gap-6 pb-8">
            <section className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
                <Card className="border-slate-200/80 bg-linear-to-br from-white to-slate-50">
                    <CardHeader>
                        <CardTitle className="text-2xl">Content Health Score</CardTitle>
                        <CardDescription>
                            Momentum score based on posting cadence, scheduling coverage, and engagement.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <p className={`text-5xl font-semibold leading-none ${scoreTone(snapshot.score)}`}>
                                    {snapshot.score}
                                </p>
                                <p className="mt-2 text-sm text-muted-foreground">{snapshot.scoreLabel}</p>
                            </div>

                            <Badge variant={snapshot.score >= 60 ? 'default' : 'destructive'}>
                                {snapshot.score >= 60 ? 'On track' : 'Needs attention'}
                            </Badge>
                        </div>

                        <Progress value={snapshot.score} className="h-2" />

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-md border border-slate-200 bg-white p-3">
                                <p className="text-xs text-muted-foreground">Published (7d)</p>
                                <p className="mt-1 text-xl font-semibold">{snapshot.publishedLast7DaysCount}</p>
                            </div>

                            <div className="rounded-md border border-slate-200 bg-white p-3">
                                <p className="text-xs text-muted-foreground">Scheduled</p>
                                <p className="mt-1 text-xl font-semibold">{snapshot.scheduledUpcomingCount}</p>
                            </div>

                            <div className="rounded-md border border-slate-200 bg-white p-3">
                                <p className="text-xs text-muted-foreground">Engagement (7d)</p>
                                <p className="mt-1 text-xl font-semibold">{snapshot.engagementLast7DaysCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Audience Pulse</CardTitle>
                        <CardDescription>Live account snapshot from X.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="rounded-md border bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Followers</p>
                            <p className="mt-1 inline-flex items-center gap-2 text-xl font-semibold">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                {snapshot.followersCount?.toLocaleString() ?? '--'}
                            </p>
                        </div>

                        <div className="rounded-md border bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Next scheduled post</p>
                            <p className="mt-1 inline-flex items-center gap-2 text-sm font-medium">
                                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                                {relativeNextScheduled || 'No upcoming post scheduled'}
                            </p>
                        </div>

                        <SevenDayPlanner />
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="inline-flex items-center gap-2 text-base">
                            <TriangleAlert className="h-4 w-4 text-amber-600" />
                            Posting and Activity Alerts
                        </CardTitle>
                        <CardDescription>
                            Flags for inactivity and weak engagement so you can correct quickly.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {snapshot.activityAlerts.map((alert) => (
                                <li key={alert} className="flex items-start gap-2 rounded-md border bg-muted/20 p-3">
                                    <MessageSquareHeart className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <span className="text-sm">{alert}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="inline-flex items-center gap-2 text-base">
                            <Flame className="h-4 w-4 text-rose-500" />
                            Quick Actions
                        </CardTitle>
                        <CardDescription>Jump into the highest-leverage workflows.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {quickActions.map((action) => {
                            const Icon = action.icon;

                            return (
                                <Link
                                    key={action.href}
                                    href={action.href}
                                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
                                >
                                    <div className="space-y-0.5">
                                        <p className="font-medium">{action.title}</p>
                                        <p className="text-xs text-muted-foreground">{action.description}</p>
                                    </div>
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                </Link>
                            );
                        })}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
