import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';
import {
    ArrowUpSquare,
    CalendarClock,
    Flame,
    MessageSquareHeart,
    PenSquare,
    TrendingUp,
    TriangleAlert,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { getDashboardSnapshot } from '@/features/dashboard/actions/dashboard';
import WelcomeContentOsxModal from '@/features/dashboard/components/welcome-content-osx-modal';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { AnimatedCircularProgressBar } from '@/shared/components/ui/animated-circular-progress-bar';

// const quickActions = [
//     {
//         title: 'Capture Idea',
//         description: 'Drop a raw idea before it disappears.',
//         href: '/app/ideas',
//         icon: PenSquare,
//     },
//     {
//         title: 'Content Calendar',
//         description: 'View and refine your upcoming schedule.',
//         href: '/app/calendar',
//         icon: CalendarClock,
//     },
//     {
//         title: 'X Workspace',
//         description: 'Track generated posts and publishing.',
//         href: '/app/x',
//         icon: TrendingUp,
//     },
// ];

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

type GaugePalette = {
    primary: string;
    secondary: string;
    label: string;
};

function getGaugePalette(score: number): GaugePalette {
    if (score < 50) {
        return {
            primary: 'rgb(239 68 68)',
            secondary: 'rgba(239, 68, 68, 0.2)',
            label: 'Risk zone',
        };
    }

    if (score < 60) {
        return {
            primary: 'rgb(249 115 22)',
            secondary: 'rgba(249, 115, 22, 0.2)',
            label: 'Warming up',
        };
    }

    if (score < 75) {
        return {
            primary: 'rgb(234 179 8)',
            secondary: 'rgba(234, 179, 8, 0.2)',
            label: 'Building momentum',
        };
    }

    if (score < 85) {
        return {
            primary: 'rgb(59 130 246)',
            secondary: 'rgba(59, 130, 246, 0.2)',
            label: 'Strong progress',
        };
    }

    if (score < 100) {
        return {
            primary: 'rgb(16 185 129)',
            secondary: 'rgba(16, 185, 129, 0.2)',
            label: 'Excellent consistency',
        };
    }

    return {
        primary: 'rgb(168 85 247)',
        secondary: 'rgba(168, 85, 247, 0.2)',
        label: 'Perfect score',
    };
}

type ActivityAlertVisual = {
    Icon: LucideIcon;
    iconClassName: string;
};

function getActivityAlertVisual(alert: string): ActivityAlertVisual {
    const normalizedAlert = alert.toLowerCase();

    if (normalizedAlert.includes('not engaged')) {
        return { Icon: MessageSquareHeart, iconClassName: 'text-rose-500' };
    }

    if (normalizedAlert.includes('not posted')) {
        return { Icon: PenSquare, iconClassName: 'text-amber-500' };
    }

    if (normalizedAlert.includes('scheduled posts')) {
        return { Icon: CalendarClock, iconClassName: 'text-sky-500' };
    }

    if (normalizedAlert.includes('connect your x account')) {
        return { Icon: Users, iconClassName: 'text-violet-500' };
    }

    if (normalizedAlert.includes('reconnect x')) {
        return { Icon: TrendingUp, iconClassName: 'text-indigo-500' };
    }

    if (normalizedAlert.includes('great momentum')) {
        return { Icon: Flame, iconClassName: 'text-emerald-500' };
    }

    return { Icon: TriangleAlert, iconClassName: 'text-amber-600' };
}
import { ClockIcon } from "lucide-react";
import { useId } from "react";
import {
    Frame,
    FrameDescription,
    FrameFooter,
    FrameHeader,
    FramePanel,
    FrameTitle,
} from "@/shared/components/ui/frame"
import { Label } from "@/shared/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select";
import { CalendarIcon } from '@phosphor-icons/react/dist/ssr';
import { GrowthChart } from '@/features/dashboard/components/growth-chart';

type PageProps = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams;
    const welcomeFlag = resolvedSearchParams.welcomeToContentOSX;
    const welcomeToContentOSX =
        (Array.isArray(welcomeFlag) ? welcomeFlag[0] : welcomeFlag)?.toLowerCase() === 'true';

    const snapshot = await getDashboardSnapshot();
    const gaugePalette = getGaugePalette(snapshot.score);
    const xProfile = snapshot.xProfile;

    const relativeNextScheduled = snapshot.nextScheduledAt
        ? formatDistanceToNowStrict(new Date(snapshot.nextScheduledAt), { addSuffix: true })
        : null;

    return (
        <div className="mx-auto grid w-full max-w-6xl gap-2 pb-8">
            <WelcomeContentOsxModal initialOpen={welcomeToContentOSX} />

            <div className="*:not-first:mt-2 max-w-32 flex-1 justify-self-end mr-4">
                {/* <Label htmlFor={"date-range"}>Select with icon</Label> */}
                <Select defaultValue="this-week" disabled>
                    <SelectTrigger className="relative ps-9" id={"date-range"}>
                        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 group-has-[select[disabled]]:opacity-50">
                            <CalendarIcon aria-hidden="true" size={16} />
                        </div>
                        <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="this-week">This week</SelectItem>
                        <SelectItem value="last-week">Last week</SelectItem>
                        <SelectItem value="last-28-days">last 28 days</SelectItem>
                        <SelectItem value="all-time">All time</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <section className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
                <Card className="border-border/80 ">
                    <CardHeader>
                        <CardTitle className="text-2xl">Content Health Score</CardTitle>
                        <CardDescription>
                            Momentum score based on posting cadence, scheduling coverage, and engagement.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 xl:grid-cols-[auto_minmax(0,1fr)] xl:items-start">
                            <div className="space-y-2">
                                {/* <p className={`text-5xl font-semibold leading-none ${scoreTone(snapshot.score)}`}>
                                    {snapshot.score}
                                </p> */}
                                <AnimatedCircularProgressBar value={snapshot.score}
                                    gaugePrimaryColor={gaugePalette.primary}
                                    gaugeSecondaryColor={gaugePalette.secondary}
                                />
                                <div className='flex items-center gap-2 '>
                                    <Badge variant={snapshot.score >= 60 ? 'default' : 'destructive'}>
                                        {snapshot.score >= 60 ? 'On track' : 'Needs attention'}
                                    </Badge>
                                    <p className="mt-2 text-sm text-muted-foreground">{snapshot.scoreLabel}</p>
                                    <p className="text-xs text-muted-foreground/80">{gaugePalette.label}</p>
                                </div>
                            </div>

                            {xProfile ? (
                                <div className="rounded-3xl border border-border/40  p-5">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex items-center gap-4">
                                            {xProfile.profileImageUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={xProfile.profileImageUrl}
                                                    alt={xProfile.name}
                                                    className="size-16 rounded-2xl border border-border/40 object-cover"
                                                />
                                            ) : (
                                                <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-900 text-white">
                                                    <TrendingUp className="size-7" />
                                                </div>
                                            )}

                                            <div>
                                                <p className="text-lg font-semibold ">{xProfile.name}</p>
                                                <p className="text-sm text-muted-foreground">@{xProfile.username}</p>
                                            </div>
                                        </div>

                                        <Link
                                            href={`https://x.com/${xProfile.username}`}
                                            target="_blank"
                                            className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-600"
                                        >
                                            Open on X
                                            <ArrowUpSquare className="size-4" />
                                        </Link>
                                    </div>

                                    {xProfile.description ? (
                                        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                                            {xProfile.description}
                                        </p>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="rounded-3xl border border-dashed border-border/50 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
                                    Connect X from Analytics to show profile photo, username, and bio here.
                                </div>
                            )}
                        </div>


                        {/* <Progress value={snapshot.score} className="h-2" /> */}
                        <Frame className="grid gap-3 sm:grid-cols-3">
                            {/* <FrameHeader>
                                <FrameTitle>Section header</FrameTitle>
                                <FrameDescription>Brief description about the section</FrameDescription>
                            </FrameHeader> */}
                            <FramePanel>
                                <p className="text-muted-foreground text-sm">Published (7d)</p>
                                <h2 className="font-semibold text-sm">{snapshot.publishedLast7DaysCount}</h2>
                            </FramePanel>
                            <FramePanel>
                                <p className="text-muted-foreground text-sm">Scheduled</p>
                                <h2 className="font-semibold text-sm">{snapshot.scheduledUpcomingCount}</h2>
                            </FramePanel>
                            <FramePanel>
                                <p className="text-muted-foreground text-sm">Engagement Actions (7d)</p>
                                <h2 className="font-semibold text-sm">{snapshot.engagementLast7DaysCount}</h2>
                            </FramePanel>
                        </Frame>
                        {/* <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-md border border-border/40 p-3">
                                <p className="text-xs text-muted-foreground">Published (7d)</p>
                                <p className="mt-1 text-xl font-semibold">{snapshot.publishedLast7DaysCount}</p>
                            </div>

                            <div className="rounded-md border border-border/40 p-3">
                                <p className="text-xs text-muted-foreground">Scheduled</p>
                                <p className="mt-1 text-xl font-semibold">{snapshot.scheduledUpcomingCount}</p>
                            </div>

                            <div className="rounded-md border border-border/40 p-3">
                                <p className="text-xs text-muted-foreground">Engagement Actions (7d)</p>
                                <p className="mt-1 text-xl font-semibold">{snapshot.engagementLast7DaysCount}</p>
                            </div>
                        </div> */}
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

                        <Button asChild className="w-full">
                            <Link href="/app/workflow/new">Plan Content (7 Days)</Link>
                        </Button>
                        <div className='relative '>
                            <p className='z-10 absolute  top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground'>coming soon...</p>
                            <GrowthChart />
                        </div>
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
                            {snapshot.activityAlerts.map((alert) => {
                                const { Icon, iconClassName } = getActivityAlertVisual(alert);

                                return (
                                    <li key={alert} className="flex items-start gap-2 rounded-md border bg-muted/20 p-3">
                                        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClassName}`} />
                                        <span className="text-sm">{alert}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </CardContent>
                </Card>


            </section>
        </div>
    );
}


