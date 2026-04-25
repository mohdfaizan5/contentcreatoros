'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import {
    AlertCircle,
    CheckCircle2,
    ChevronDownIcon,
    ChevronLeft,
    ChevronRight,
    ImagePlus,
    Loader2,
    RefreshCcw,
    Timer,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MagicWandIcon } from '@phosphor-icons/react/dist/ssr';
import {
    formatWorkflowPlannerItemSuggestedPost,
    regenerateWorkflowPlannerItem,
    removeWorkflowPlannerItemMedia,
    retryWorkflowPlannerRun,
    scheduleWorkflowPlannerRun,
    setWorkflowPlannerItemDecision,
    triggerWorkflowPlannerRun,
    updateWorkflowPlannerItemSuggestedPost,
    uploadWorkflowPlannerItemMedia,
} from '@/actions/workflow-planner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useFileUpload, type FileWithPreview } from '@/hooks/use-file-upload';
import { cn } from '@/lib/utils';
import { POST_GIF_MAX_BYTES, POST_MEDIA_ACCEPT } from '@/lib/x/post-media';
import type {
    PostMediaAttachment,
    SevenDayPlanningItem,
    SevenDayPlanningItemApprovalStatus,
    SevenDayPlanningRun,
} from '@/types/database';
import type { BrandVisualIdentity } from '@/lib/brand-visuals';
import { WorkflowRunStatusBadge } from './workflow-run-status-badge';
import { Tooltip, TooltipPopup, TooltipTrigger } from '../ui/tooltip';
import { ArticleNyTimesIcon, QuestionMarkIcon } from '@phosphor-icons/react/dist/ssr';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import CalendarSelectWithTime from '@/components/calendar-select-with-time';
import { Avatar, AvatarFallback, AvatarImage, } from '../ui/avatar';
import {
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogPanel,
    DialogPopup,
    DialogTitle,
} from '@/components/ui/dialog';
import { ImageTemplateWorkbench } from '@/components/images/image-template-workbench';

type WorkflowPostingAccountProfile = {
    name: string;
    title: string | null;
    username: string;
    avatarUrl: string | null;
};

type WorkflowImageStudioContext = {
    brandIdentity: BrandVisualIdentity;
    companyOverview: string;
    initialWebsiteUrl: string;
};

function formatUsername(username: string) {
    return username.startsWith('@') ? username : `@${username}`;
}

function getInitials(value: string) {
    const tokens = value.split(' ');
    const initials: string[] = [];

    for (const token of tokens) {
        const trimmed = token.trim();

        if (!trimmed) {
            continue;
        }

        initials.push(trimmed[0]?.toUpperCase() ?? '');

        if (initials.length === 2) {
            break;
        }
    }

    return initials.join('') || 'X';
}

function ItemStatusBadge({ status }: { status: SevenDayPlanningItemApprovalStatus }) {
    const className =
        status === 'approved'
            ? 'bg-emerald-50 text-emerald-700'
            : status === 'rejected'
                ? 'bg-rose-50 text-rose-400'
                : status === 'scheduled'
                    ? 'bg-sky-50 text-sky-700'
                    : '';

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

function buildDefaultItemScheduleDate(itemDateISO: string, approvedIndex: number) {
    const date = parseISO(itemDateISO);

    if (Number.isNaN(date.getTime())) {
        return new Date();
    }

    date.setUTCHours(14 + approvedIndex * 3, 0, 0, 0);

    return date;
}

function getItemSlotIndex(dayLabel: string) {
    const match = dayLabel.match(/post\s+(\d+)$/i);

    if (!match) {
        return 0;
    }

    const parsedIndex = Number.parseInt(match[1] ?? '1', 10);
    return Number.isFinite(parsedIndex) && parsedIndex > 0 ? parsedIndex - 1 : 0;
}

function formatAttachmentSize(bytes: number) {
    if (bytes < 1024 * 1024) {
        return `${Math.max(1, Math.round(bytes / 1024))}KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function getAttachmentLabel(attachment: PostMediaAttachment) {
    return attachment.media_type === 'gif' ? 'GIF' : 'Image';
}

export default function WorkflowRunDetailClient({
    run,
    items,
    xProfile,
    imageStudioContext,
}: {
    run: SevenDayPlanningRun;
    items: SevenDayPlanningItem[];
    xProfile: WorkflowPostingAccountProfile | null;
    imageStudioContext: WorkflowImageStudioContext;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [noteByItemId, setNoteByItemId] = useState<Record<string, string>>({});
    const [suggestedPostByItemId, setSuggestedPostByItemId] = useState<Record<string, string>>({});
    const [scheduledAtByItemId, setScheduledAtByItemId] = useState<Record<string, string>>({});
    const [mediaAttachmentsByItemId, setMediaAttachmentsByItemId] = useState<Record<string, PostMediaAttachment[]>>({});
    const [uploadingMediaItemId, setUploadingMediaItemId] = useState<string | null>(null);
    const [removingMediaAttachmentId, setRemovingMediaAttachmentId] = useState<string | null>(null);
    const [isSchedulePickerOpen, setIsSchedulePickerOpen] = useState(false);
    const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);
    const [imageStudioNonce, setImageStudioNonce] = useState(0);
    const mediaUploadActionsRef = useRef<{ clearFiles: () => void } | null>(null);

    const boundedSelectedIndex = items.length > 0
        ? Math.min(selectedIndex, items.length - 1)
        : 0;
    const selectedItem = items[boundedSelectedIndex] ?? null;
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
    const canEditSelectedItemMedia = Boolean(
        selectedItem && canEditSuggestedPost && selectedItem.approval_status !== 'scheduled',
    );
    const selectedItemMediaAttachments = selectedItem
        ? (mediaAttachmentsByItemId[selectedItem.id] ?? selectedItem.media_attachments ?? [])
        : [];
    const selectedItemHasMedia = selectedItemMediaAttachments.length > 0;
    const selectedItemHasGif = selectedItemMediaAttachments.some(
        (attachment) => attachment.media_type === 'gif',
    );
    const selectedItemHasMaxImages =
        !selectedItemHasGif && selectedItemMediaAttachments.length >= 4;
    const canAddSelectedItemMedia =
        canEditSelectedItemMedia && !selectedItemHasGif && !selectedItemHasMaxImages;
    const isMediaBusy = Boolean(uploadingMediaItemId || removingMediaAttachmentId);
    const remainingMediaSlots = selectedItemHasGif
        ? 0
        : Math.max(1, 4 - selectedItemMediaAttachments.length);
    const shouldPollRun = run.status === 'queued' || run.status === 'generating';
    const getItemScheduledDate = (item: SevenDayPlanningItem) => {
        const savedISO = scheduledAtByItemId[item.id];

        if (savedISO) {
            const savedDate = new Date(savedISO);

            if (!Number.isNaN(savedDate.getTime())) {
                return savedDate;
            }
        }

        return buildDefaultItemScheduleDate(item.item_date, getItemSlotIndex(item.day_label));
    };

    const selectedItemScheduledDate = selectedItem ? getItemScheduledDate(selectedItem) : null;
    const postingAccountName = xProfile?.name?.trim() || 'Connected X Account';
    const postingAccountTitle = xProfile?.title?.trim() || null;
    const postingAccountUsername = xProfile?.username
        ? formatUsername(xProfile.username)
        : '@x-account';
    const postingAccountInitials = useMemo(
        () => getInitials(postingAccountName),
        [postingAccountName],
    );

    const handleSelectIndex = (nextIndex: number) => {
        setSelectedIndex(nextIndex);
        setIsSchedulePickerOpen(false);
    };

    useEffect(() => {
        setMediaAttachmentsByItemId(
            Object.fromEntries(
                items.map((item) => [item.id, item.media_attachments ?? []]),
            ),
        );
    }, [items]);

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
                const scopedScheduleOverrides = Object.fromEntries(
                    Object.entries(scheduledAtByItemId).filter(([itemId]) =>
                        items.some((item) => item.id === itemId),
                    ),
                );

                const result = await scheduleWorkflowPlannerRun({
                    runId: run.id,
                    scheduleByItemId:
                        Object.keys(scopedScheduleOverrides).length > 0
                            ? scopedScheduleOverrides
                            : undefined,
                });
                toast.success(`Scheduled ${result.scheduledCount} approved post(s).`);
                router.refresh();
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Unable to schedule this run.');
            }
        });
    };

    const handleUpdateItemSchedule = (itemId: string, scheduledAt: Date) => {
        setScheduledAtByItemId((current) => ({
            ...current,
            [itemId]: scheduledAt.toISOString(),
        }));
        setIsSchedulePickerOpen(false);
        toast.success('Date and time updated for this post.');
    };

    const handleMediaUpload = async (itemId: string, files: FileList | File[] | null) => {
        const selectedFiles = Array.from(files ?? []);

        if (!selectedFiles.length) {
            return;
        }

        setUploadingMediaItemId(itemId);

        try {
            const formData = new FormData();
            formData.append('runId', run.id);
            formData.append('itemId', itemId);

            for (const file of selectedFiles) {
                formData.append('files', file);
            }

            const result = await uploadWorkflowPlannerItemMedia(formData);

            setMediaAttachmentsByItemId((current) => ({
                ...current,
                [result.itemId]: result.mediaAttachments,
            }));
            toast.success(
                result.mediaAttachments.length === 1
                    ? 'Media attached to this post.'
                    : `${result.mediaAttachments.length} media files attached to this post.`,
            );
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to upload media.');
        } finally {
            setUploadingMediaItemId(null);
        }
    };

    const handleRemoveMedia = async (itemId: string, attachmentId: string) => {
        setRemovingMediaAttachmentId(attachmentId);

        try {
            const result = await removeWorkflowPlannerItemMedia({
                attachmentId,
                itemId,
                runId: run.id,
            });

            setMediaAttachmentsByItemId((current) => ({
                ...current,
                [result.itemId]: result.mediaAttachments,
            }));
            toast.success('Media removed from this post.');
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to remove media.');
        } finally {
            setRemovingMediaAttachmentId(null);
        }
    };

    const handleOpenImageStudio = () => {
        if (!selectedItem) {
            return;
        }

        setImageStudioNonce((current) => current + 1);
        setIsImageStudioOpen(true);
    };

    const [
        { errors: mediaUploadErrors },
        {
            clearFiles: clearMediaUploadFiles,
            getInputProps: getMediaInputProps,
            openFileDialog: openMediaFileDialog,
        },
    ] = useFileUpload({
        accept: POST_MEDIA_ACCEPT,
        maxFiles: remainingMediaSlots,
        maxSize: POST_GIF_MAX_BYTES,
        multiple: true,
        onFilesAdded: (addedFiles: FileWithPreview[]) => {
            if (!selectedItem) {
                return;
            }

            const files = addedFiles
                .map((fileWithPreview) => fileWithPreview.file)
                .filter((file): file is File => file instanceof File);

            void handleMediaUpload(selectedItem.id, files).finally(() => {
                mediaUploadActionsRef.current?.clearFiles();
            });
        },
    });

    mediaUploadActionsRef.current = {
        clearFiles: clearMediaUploadFiles,
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

    const handleFormatSuggestedPost = (itemId: string) => {
        startTransition(async () => {
            try {
                const suggestedPost = suggestedPostByItemId[itemId] ?? '';

                const result = await formatWorkflowPlannerItemSuggestedPost({
                    itemId,
                    runId: run.id,
                    suggestedPost,
                });

                setSuggestedPostByItemId((current) => ({
                    ...current,
                    [itemId]: result.suggestedPost,
                }));

                toast.success(
                    result.changed
                        ? 'Formatting applied without changing content.'
                        : 'Already well-formatted. No changes made.',
                );
                router.refresh();
            } catch (error) {
                toast.error(
                    error instanceof Error ? error.message : 'Unable to format suggested post.',
                );
            }
        });
    };

    return (
        <div className="space-y-4 max-w-5xl mx-auto">
            <Card>
                <CardHeader className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <CardTitle className="text-2xl">Workflow Campaign</CardTitle>
                            <div className='flex items-center gap-2'>
                                <p className="mt-1 text-sm text-muted-foreground">{rangeLabel}</p>
                                <WorkflowRunStatusBadge status={run.status} />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {/* <Button asChild variant="outline">
                            <Link href="/app/workflow">Back to Workflow</Link>
                        </Button> */}

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
                                <Button className="gap-2" disabled={isPending || isMediaBusy} onClick={handleSchedule}>
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
                <div className="grid gap-4 lg:grid-cols-[4fr_2fr]">
                    {selectedItem ? (
                        <Card>
                            <CardHeader className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <div className='flex items-center gap-2 '>
                                            <Avatar className={"size-10"}>
                                                <AvatarImage alt={postingAccountName} src={xProfile?.avatarUrl ?? undefined} />
                                                <AvatarFallback>{postingAccountInitials}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className='font-bold text-sm'>{postingAccountName}</p>
                                                {postingAccountTitle ? (
                                                    <p className='max-w-[30ch] truncate text-xs text-muted-foreground'>
                                                        {postingAccountTitle}
                                                    </p>
                                                ) : null}
                                                <p className='text-muted-foreground text-sm'>{postingAccountUsername}</p>
                                            </div>
                                        </div>
                                        {/* <CardTitle className="text-xl">{selectedItem.day_label}</CardTitle> */}

                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex flex-wrap gap-2 text-sm">
                                            <div className=' flex gap-2 items-center'>
                                                <ItemStatusBadge status={selectedItem.approval_status} />
                                            </div>
                                            <Badge variant="outline">{selectedItem.pillar}</Badge>
                                            <Badge variant="secondary">{selectedItem.content_type}</Badge>
                                        </div>
                                        <Button
                                            disabled={boundedSelectedIndex === 0 || isPending}
                                            onClick={() => handleSelectIndex(Math.max(0, boundedSelectedIndex - 1))}
                                            size="icon"
                                            variant="outline"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            disabled={boundedSelectedIndex === items.length - 1 || isPending}
                                            onClick={() => handleSelectIndex(Math.min(items.length - 1, boundedSelectedIndex + 1))}
                                            size="icon"
                                            variant="outline"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>


                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* <div className='flex items-center gap-2 '>
                                    <Avatar className={"size-10"}>
                                        <AvatarImage alt={postingAccountName} src={xProfile?.avatarUrl ?? undefined} />
                                        <AvatarFallback>{postingAccountInitials}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className='font-bold text-sm'>{postingAccountName}</p>
                                        {postingAccountTitle ? (
                                            <p className='max-w-[30ch] truncate text-xs text-muted-foreground'>
                                                {postingAccountTitle}
                                            </p>
                                        ) : null}
                                        <p className='text-muted-foreground text-sm'>{postingAccountUsername}</p>
                                    </div>
                                </div> */}
                                <div className="max-w space-y-2 pb-10 pt-2">
                                    <div className='flex gap-2 items-start'>
                                        {/* <Avatar className={"size-10"}>
                                            <AvatarImage alt="Kelly King" src="" />
                                            <AvatarFallback>KK</AvatarFallback>
                                        </Avatar> */}
                                        <Textarea
                                            textareaClassName='text-base'
                                            aria-describedby="twitter-post-input-description"
                                            className="max-w-xl text-base  "
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
                                    </div>

                                    <div className="flex items-center justify-between gap-3 max-w-xl">
                                        <div>
                                            {selectedItemScheduledDate ? (
                                                canModerateRun(run.status) ? (
                                                    <Popover open={isSchedulePickerOpen} onOpenChange={setIsSchedulePickerOpen}>
                                                        <PopoverTrigger asChild>
                                                            <button
                                                                className="text-sm text-muted-foreground underline-offset-4 transition hover:underline focus-visible:underline"
                                                                disabled={isPending}
                                                                type="button"
                                                            >
                                                                {format(selectedItemScheduledDate, 'p · MMM d, yyyy')}
                                                            </button>
                                                        </PopoverTrigger>
                                                        <PopoverContent
                                                            align="start"
                                                            className="w-105 max-w-full p-3"
                                                        >
                                                            <CalendarSelectWithTime
                                                                confirmLabel="Save date & time"
                                                                initialValue={selectedItemScheduledDate}
                                                                isSubmitting={isPending}
                                                                onConfirm={(value) =>
                                                                    handleUpdateItemSchedule(selectedItem.id, value)
                                                                }
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                ) : (
                                                    <p className='text-sm text-muted-foreground'>
                                                        {format(selectedItemScheduledDate, 'p · MMM d, yyyy')}
                                                    </p>
                                                )
                                            ) : null}

                                        </div>
                                        <div className='flex gap-2 '>
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
                                    {selectedItem ? (
                                        <div className="max-w-xl space-y-2">
                                            {selectedItemHasMedia ? (
                                                <div className="space-y-3">
                                                    {selectedItemMediaAttachments.map((attachment) => (
                                                        <div
                                                            className="overflow-hidden rounded-lg border bg-background"
                                                            key={attachment.id}
                                                        >
                                                            <div
                                                                aria-label="Upload preview"
                                                                className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-muted"
                                                            >
                                                                {attachment.signed_url ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img
                                                                        alt={attachment.file_name}
                                                                        className="size-full object-contain"
                                                                        src={attachment.signed_url}
                                                                    />
                                                                ) : (
                                                                    <ImagePlus className="h-4 w-4 opacity-60" />
                                                                )}
                                                            </div>
                                                            <div className="flex min-w-0 items-center justify-between gap-3 p-2 text-xs">
                                                                <p className="truncate text-muted-foreground">
                                                                    {attachment.file_name}
                                                                </p>
                                                                <div className="inline-flex gap-2">
                                                                    <span className="text-muted-foreground">
                                                                        {getAttachmentLabel(attachment)} - {formatAttachmentSize(attachment.size_bytes)}
                                                                    </span>
                                                                    {canEditSelectedItemMedia ? (
                                                                        <button
                                                                            aria-label={`Remove ${attachment.file_name}`}
                                                                            className="font-medium text-destructive hover:underline disabled:opacity-60"
                                                                            disabled={isMediaBusy}
                                                                            onClick={() => handleRemoveMedia(selectedItem.id, attachment.id)}
                                                                            type="button"
                                                                        >
                                                                            {removingMediaAttachmentId === attachment.id ? 'Removing...' : 'Remove'}
                                                                        </button>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : null}
                                            <div className="flex flex-wrap items-center gap-2">
                                                {canEditSelectedItemMedia ? (
                                                    <>
                                                        <div className="flex flex-wrap items-center gap-2">

                                                            <Button
                                                                className="gap-2"
                                                                disabled={!canAddSelectedItemMedia || isMediaBusy}
                                                                onClick={openMediaFileDialog}
                                                                size="sm"
                                                                variant="outline"
                                                            >
                                                                {uploadingMediaItemId === selectedItem.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <ImagePlus className="h-4 w-4" />
                                                                )}
                                                                {selectedItemHasMedia ? 'Add media' : 'Upload media'}
                                                            </Button>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button className="h-auto px-2 hover:bg-primary/85" variant="default">
                                                                        <ChevronDownIcon
                                                                            aria-hidden="true"
                                                                            className="opacity-60"
                                                                            size={16}
                                                                        />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent className="min-w-40">
                                                                    <DropdownMenuGroup>
                                                                        <DropdownMenuItem onClick={handleOpenImageStudio}>
                                                                            <MagicWandIcon aria-hidden="true" size={32} weight="duotone" />
                                                                            <span>Generate with AI</span>
                                                                        </DropdownMenuItem>

                                                                    </DropdownMenuGroup>

                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>

                                                        <input
                                                            {...getMediaInputProps({
                                                                'aria-label': 'Upload image or GIF file',
                                                                className: 'sr-only',
                                                                disabled: !canAddSelectedItemMedia || isMediaBusy,
                                                                tabIndex: -1,
                                                            })}
                                                        />
                                                    </>
                                                ) : null}
                                                {canEditSelectedItemMedia || selectedItemHasMedia ? (
                                                    <p className="text-xs text-muted-foreground">
                                                        {selectedItemHasGif
                                                            ? 'GIF attached. X allows only 1 GIF per post.'
                                                            : selectedItemHasMaxImages
                                                                ? '4 images attached. X image limit reached.'
                                                                : 'Images up to 5MB, GIFs up to 15MB.'}
                                                    </p>
                                                ) : null}
                                            </div>

                                            {mediaUploadErrors.length > 0 ? (
                                                <div className="space-y-1">
                                                    {mediaUploadErrors.map((error) => (
                                                        <p className="text-xs text-destructive" key={error}>
                                                            {error}
                                                        </p>
                                                    ))}
                                                </div>
                                            ) : null}


                                        </div>
                                    ) : null}
                                    {/* <AspectRatio ratio={16 / 9} className='max-w-xl'>
                                        <Image fill src={"/contentosx-template-1-16x9.png"}
                                            alt="Image" className="rounded-md object-cover" />
                                    </AspectRatio> */}
                                </div>
                                {/* <Image
                                    alt="Selected item"
                                    className="h-full w-full object-cover"
                                    height={50}
                                    src={"/contentosx-template-1-16x9.png"}
                                    width={200}
                                /> */}

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
                                                <Button variant="outline" size={"icon-sm"}>
                                                    {isPending ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <RefreshCcw className="h-3 w-3" />
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-72">
                                                <h2 className="mb-2 font-semibold text-sm">Anything specific you&apos;d like to share?</h2>
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
                                                    <div className="flex flex-col sm:flex-row sm:justify-end gap-1">
                                                        <Button
                                                            className="gap-2"
                                                            disabled={isPending}
                                                            onClick={() => handleFormatSuggestedPost(selectedItem.id)}
                                                            size="sm"
                                                            variant="outline"
                                                            type="button"
                                                            aria-label="Format post text"
                                                        >
                                                            {isPending ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <ArticleNyTimesIcon className="h-4 w-4" />
                                                            )}
                                                            Format
                                                        </Button>
                                                        <Button
                                                            className="gap-2"
                                                            disabled={isPending}
                                                            onClick={() => handleRegenerate(selectedItem.id)}
                                                            size="sm"
                                                            variant="default"
                                                            type="button"
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
                    <Dialog onOpenChange={setIsImageStudioOpen} open={isImageStudioOpen}>
                        <DialogPopup className="max-w-7xl">
                            <DialogHeader>
                                <DialogTitle>Generate Workflow Visual</DialogTitle>
                                <DialogDescription>
                                    Reuse Image Studio with this post as the source context, then remix colors or export without leaving the workflow.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogPanel className="pt-0">
                                <ImageTemplateWorkbench
                                    autoGenerateNonce={imageStudioNonce}
                                    brandIdentity={imageStudioContext.brandIdentity}
                                    companyOverview={imageStudioContext.companyOverview}
                                    embedded
                                    initialDirection={suggestedPostText}
                                    initialWebsiteUrl={imageStudioContext.initialWebsiteUrl}
                                    key={`${selectedItem?.id ?? 'workflow'}-${imageStudioNonce}`}
                                    sourceTweet={suggestedPostText}
                                />
                            </DialogPanel>
                        </DialogPopup>
                    </Dialog>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Run Days</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {items.map((item, index) => (
                                <button
                                    className={cn(
                                        'w-full rounded-md border px-3 py-2 text-left transition-colors',
                                        boundedSelectedIndex === index
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:bg-muted/40',
                                    )}
                                    key={item.id}
                                    onClick={() => handleSelectIndex(index)}
                                    type="button"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-medium text-sm">{item.day_label}</p> -
                                        <ItemStatusBadge status={item.approval_status} />
                                    </div>
                                    {/* <p className="mt-1 truncate text-xs text-muted-foreground">
                                        {scheduledAtByItemId[item.id] ? 'Custom' : 'Default'}:{' '}
                                        {format(getItemScheduledDate(item), 'MMM d, yyyy p')}
                                    </p> */}
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
