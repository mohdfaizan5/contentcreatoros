import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ArrowRight, Sparkles } from 'lucide-react';

import { listWorkflowPlannerRuns } from '@/features/workflow/actions/workflow-planner';
import { WorkflowRunStatusBadge } from '@/features/workflow/components/workflow-run-status-badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

import {
    BoltIcon,
    BookOpenIcon,
    ChevronDownIcon,
    Layers2Icon,
    LogOutIcon,
    PinIcon,
    UserPenIcon,
} from "lucide-react";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/shared/components/ui/avatar";

import { PlusIcon } from '@phosphor-icons/react/dist/ssr';
function formatDateRange(startDate: string, endDate: string) {
    return `${format(parseISO(startDate), 'MMM d')} — ${format(parseISO(endDate), 'MMM d, yyyy')}`;
}

export default async function WorkflowPage() {
    const runs = await listWorkflowPlannerRuns({ limit: 24 });

    return (
        <div className="space-y-4 max-w-3xl mx-auto">
            <section className="flex flex-wrap items-center justify-between gap-3 mt-4 mb-8">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight">Workflow</h1>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                        Queue campaign planning runs, review generated days, and schedule approved posts later.
                    </p>
                </div>

                <div className='flex gap-0'>
                    <Button asChild className="flex gap-2">
                        <Link href="/app/workflow/new">
                            {/* <Sparkles className="h-4 w-4" />
                            New 7-Day Run */}
                            New Campain
                            <PlusIcon size={28} />
                        </Link>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="h-auto px-2 hover:bg-primary/85" variant="default">
                                {/* <Avatar>
                                    <AvatarImage alt="Profile image" src="/origin/avatar.jpg" />
                                    <AvatarFallback>KK</AvatarFallback>
                                </Avatar> */}
                                <ChevronDownIcon
                                    aria-hidden="true"
                                    className="opacity-60"
                                    size={16}
                                />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="max-w-64">
                            <DropdownMenuLabel className="flex min-w-0 flex-col">
                                <span className="truncate font-medium text-foreground text-sm">
                                    Keith Kennedy
                                </span>
                                <span className="truncate font-normal text-muted-foreground text-xs">
                                    k.kennedy@coss.com
                                </span>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem>
                                    <BoltIcon aria-hidden="true" className="opacity-60" size={16} />
                                    <span>Option 1</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Layers2Icon aria-hidden="true" className="opacity-60" size={16} />
                                    <span>Option 2</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <BookOpenIcon aria-hidden="true" className="opacity-60" size={16} />
                                    <span>Option 3</span>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem>
                                    <PinIcon aria-hidden="true" className="opacity-60" size={16} />
                                    <span>Option 4</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <UserPenIcon aria-hidden="true" className="opacity-60" size={16} />
                                    <span>Option 5</span>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <LogOutIcon aria-hidden="true" className="opacity-60" size={16} />
                                <span>Logout</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

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
                    {runs.map((run) => (
                        <Card key={run.id} >
                            <CardHeader className=" space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <CardTitle className="text-lg">{formatDateRange(run.start_date, run.end_date)}</CardTitle>
                                        <CardDescription>
                                            <span className='font-medium mr-1'>
                                                Created
                                            </span>
                                            {format(parseISO(run.created_at), 'MMM d, yyyy h:mm a')}
                                            <span className='mx-1'>·</span>
                                            <WorkflowRunStatusBadge status={run.status} />
                                        </CardDescription>
                                    </div>
                                    <div>
                                        <Button asChild variant="outline" className="gap-2">
                                            <Link href={`/app/workflow/${run.id}`}>
                                                Open Campain
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline">
                                                    {/* Rich menu */}
                                                    <ChevronDownIcon
                                                        aria-hidden="true"
                                                        className="-me-1 opacity-60"
                                                        size={16}
                                                    />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuGroup>
                                                    <DropdownMenuItem>
                                                        <span>Edit</span>
                                                        <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <span>Duplicate</span>
                                                        <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
                                                    </DropdownMenuItem>
                                                </DropdownMenuGroup>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuGroup>
                                                    <DropdownMenuItem>
                                                        <span>Archive</span>
                                                        <DropdownMenuShortcut>⌘A</DropdownMenuShortcut>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
                                                        <DropdownMenuPortal>
                                                            <DropdownMenuSubContent>
                                                                <DropdownMenuItem>Move to project</DropdownMenuItem>
                                                                <DropdownMenuItem>Move to folder</DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem>Advanced options</DropdownMenuItem>
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuPortal>
                                                    </DropdownMenuSub>
                                                </DropdownMenuGroup>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuGroup>
                                                    <DropdownMenuItem>Share</DropdownMenuItem>
                                                    <DropdownMenuItem>Add to favorites</DropdownMenuItem>
                                                </DropdownMenuGroup>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem variant="destructive">
                                                    <span>Delete</span>
                                                    <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                    </div>

                                </div>

                                <div className="grid gap-2 sm:grid-cols-4">
                                    <div className="rounded-md flex items-center justify-between border bg-muted/20 px-2 py-1">
                                        <p className="text-xs text-muted-foreground">Pending</p>
                                        <p className="text-lg font-semibold">{run.pending_count}</p>
                                    </div>
                                    <div className="rounded-md flex items-center justify-between border bg-muted/20 px-2 py-1">
                                        <p className="text-xs text-muted-foreground">Approved</p>
                                        <p className="text-lg font-semibold">{run.approved_count}</p>
                                    </div>
                                    <div className="rounded-md flex items-center justify-between border bg-muted/20 px-2 py-1">
                                        <p className="text-xs text-muted-foreground">Rejected</p>
                                        <p className="text-lg font-semibold">{run.rejected_count}</p>
                                    </div>
                                    <div className="rounded-md flex items-center justify-between border bg-muted/20 px-2 py-1  ">
                                        <p className="text-xs text-muted-foreground">Scheduled</p>
                                        <p className="text-lg font-semibold">{run.scheduled_count}</p>
                                    </div>
                                </div>


                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

