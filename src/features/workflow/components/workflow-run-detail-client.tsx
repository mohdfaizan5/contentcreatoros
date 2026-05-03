'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    ChevronDownIcon,
    ChevronLeft,
    ChevronRight,
    Heart,
    ImagePlus,
    Loader2,
    MessageCircle,
    RefreshCcw,
    Repeat2,
    Timer,
    TrendingUp,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
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
} from '@/features/workflow/actions/workflow-planner';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Textarea } from '@/shared/components/ui/textarea';
import { useFileUpload, type FileWithPreview } from '@/features/workflow/hooks/use-file-upload';
import { cn } from '@/shared/lib/utils';
import { POST_GIF_MAX_BYTES, POST_MEDIA_ACCEPT } from '@/features/x/lib/post-media';
import type {
    GeneratedTweetStatus,
    PostMediaAttachment,
    SevenDayPlanningItem,
    SevenDayPlanningItemApprovalStatus,
    SevenDayPlanningRun,
    WorkflowThreadReply,
} from '@/shared/types/database';
import type { BrandVisualIdentity } from '@/features/inspiration/lib/brand-visuals';
import { WorkflowRunStatusBadge } from './workflow-run-status-badge';
import { Tooltip, TooltipPopup, TooltipTrigger } from '../../../shared/components/ui/tooltip';
import { ArticleNyTimesIcon, QuestionMarkIcon } from '@phosphor-icons/react/dist/ssr';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/shared/components/ui/popover";
import CalendarSelectWithTime from '@/shared/components/calendar-select-with-time';
import { Avatar, AvatarFallback, AvatarImage, } from '../../../shared/components/ui/avatar';
import {
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogPanel,
    DialogPopup,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { ImageTemplateWorkbench } from '@/features/image-studio/components/image-template-workbench';
import { CampaignGrowthChart } from './campaign-growth-chart';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { TextShimmerWave } from '@/shared/components/text-shimmer-wave';


import {
    Timeline,
    TimelineContent,
    TimelineHeader,
    TimelineIndicator,
    TimelineItem,
    TimelineSeparator,
    TimelineTitle,
} from "@/shared/components/ui/timeline";
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

type WorkflowCampaignMetrics = {
    totals: {
        totalPosts: number;
        publishedPosts: number;
        scheduledPosts: number;
        failedPosts: number;
        totalLikes: number;
        totalReplies: number;
        totalReposts: number;
        totalQuotes: number;
        totalEngagement: number;
    };
    trend: Array<{
        date: string;
        label: string;
        posts: number;
        likes: number;
        replies: number;
        reposts: number;
        quotes: number;
        engagement: number;
    }>;
    hasLiveMetrics: boolean;
};

type WorkflowItemDisplayStatus =
    | SevenDayPlanningItemApprovalStatus
    | GeneratedTweetStatus
    | 'publishing';

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

function ItemStatusBadge({ status }: { status: WorkflowItemDisplayStatus }) {
    const className =
        status === 'published'
            ? 'bg-violet-50 text-violet-700'
            : status === 'publishing'
                ? 'bg-amber-50 text-amber-700'
                : status === 'failed'
                    ? 'bg-rose-50 text-rose-500'
                    : status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : status === 'rejected'
                            ? 'bg-rose-50 text-rose-400'
                            : status === 'scheduled'
                                ? 'bg-sky-50 text-sky-700'
                                : '';

    const label =
        status === 'published'
            ? 'Published'
            : status === 'publishing'
                ? 'Publishing'
                : status === 'failed'
                    ? 'Failed'
                    : status === 'approved'
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

function formatCompactNumber(value: number) {
    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: value >= 1000 ? 1 : 0,
        notation: value >= 1000 ? 'compact' : 'standard',
    }).format(value);
}

function MetricCard({
    label,
    value,
    accent,
    icon,
    helper,
}: {
    label: string;
    value: string;
    accent: string;
    icon: ReactNode;
    helper: string;
}) {
    return (
        <div className="relative flex h-28 flex-col justify-between rounded-2xl border bg-card px-4 py-3 shadow-sm">
            <div className="flex items-start justify-between gap-1">
                <div className='flex flex-col'>
                    <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
                    <div className=''>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>  <Tooltip>
                            <TooltipTrigger
                                className={"inline-flex"}
                                render={<Button className="rounded-full inline-flex" size="icon-xs" variant="outline" />}
                            >
                                <QuestionMarkIcon size={16} />
                            </TooltipTrigger>
                            <TooltipPopup>{helper}</TooltipPopup>
                        </Tooltip>
                    </div>
                </div>
                <div className={cn('absolute top-0 right-0 p-2.5', accent)}>
                    {icon}
                </div>
            </div>
            {/* <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="truncate">{helper}</span>
              
            </div> */}
        </div>
    );
}

function CampaignPerformanceChart({ metrics }: { metrics: WorkflowCampaignMetrics }) {
    if (!metrics.trend.length) {
        return (
            <div className="rounded-2xl border bg-gradient-to-br from-muted/50 via-background to-muted/20 p-5">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Campaign performance
                </div>
                <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                    Live campaign metrics will show up here after the first scheduled post publishes and returns an X post id.
                </p>
            </div>
        );
    }

    return <CampaignGrowthChart data={metrics.trend} />;
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

function normalizeThreadReplies(replies: WorkflowThreadReply[] | null | undefined) {
    return (replies ?? []).map((reply) => ({
        content: reply.content ?? '',
        created_at: reply.created_at ?? new Date().toISOString(),
        generated_tweet_id: reply.generated_tweet_id ?? null,
        id: reply.id,
        updated_at: reply.updated_at ?? new Date().toISOString(),
    }));
}

function serializeReplyDrafts(replies: WorkflowThreadReply[]) {
    return JSON.stringify(
        normalizeThreadReplies(replies).map((reply) => ({
            content: reply.content.trim(),
            generated_tweet_id: reply.generated_tweet_id ?? null,
            id: reply.id,
        })),
    );
}

export default function WorkflowRunDetailClient({
    run,
    items,
    itemDeliveryStatusByItemId,
    generatedTweetStatusById,
    xProfile,
    campaignMetrics,
    imageStudioContext,
}: {
    run: SevenDayPlanningRun;
    items: SevenDayPlanningItem[];
    itemDeliveryStatusByItemId: Record<string, WorkflowItemDisplayStatus>;
    generatedTweetStatusById: Record<string, GeneratedTweetStatus | 'publishing'>;
    xProfile: WorkflowPostingAccountProfile | null;
    campaignMetrics: WorkflowCampaignMetrics;
    imageStudioContext: WorkflowImageStudioContext;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [scheduleFeedback, setScheduleFeedback] = useState<{
        kind: 'error' | 'success';
        message: string;
    } | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [noteByItemId, setNoteByItemId] = useState<Record<string, string>>({});
    const [suggestedPostByItemId, setSuggestedPostByItemId] = useState<Record<string, string>>({});
    const [threadRepliesByItemId, setThreadRepliesByItemId] = useState<Record<string, WorkflowThreadReply[]>>({});
    const [scheduledAtByItemId, setScheduledAtByItemId] = useState<Record<string, string>>({});
    const [mediaAttachmentsByItemId, setMediaAttachmentsByItemId] = useState<Record<string, PostMediaAttachment[]>>({});
    const [uploadingMediaItemId, setUploadingMediaItemId] = useState<string | null>(null);
    const [removingMediaAttachmentId, setRemovingMediaAttachmentId] = useState<string | null>(null);
    const [isSchedulePickerOpen, setIsSchedulePickerOpen] = useState(false);
    const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);
    const [imageStudioNonce, setImageStudioNonce] = useState(0);
    const mediaUploadActionsRef = useRef<{ clearFiles: () => void } | null>(null);
    const autoStartedRunIdRef = useRef<string | null>(null);

    const boundedSelectedIndex = items.length > 0
        ? Math.min(selectedIndex, items.length - 1)
        : 0;
    const selectedItem = items[boundedSelectedIndex] ?? null;
    const selectedItemDisplayStatus = selectedItem
        ? (itemDeliveryStatusByItemId[selectedItem.id] ?? selectedItem.approval_status)
        : 'pending';
    const CHARACTER_LIMIT = 280;
    const suggestedPostText = selectedItem
        ? (suggestedPostByItemId[selectedItem.id] ?? selectedItem.suggested_post ?? '')
        : '';
    const suggestedPostCharacterCount = suggestedPostText.length;
    const suggestedPostRemainingCharacters = CHARACTER_LIMIT - suggestedPostCharacterCount;
    const hasExceededSuggestedPostLimit = suggestedPostRemainingCharacters < 0;
    const selectedItemThreadReplies = selectedItem
        ? (threadRepliesByItemId[selectedItem.id] ?? normalizeThreadReplies(selectedItem.thread_replies))
        : [];
    const hasSuggestedPostUnsavedChanges = selectedItem
        ? suggestedPostText !== (selectedItem.suggested_post ?? '') ||
        serializeReplyDrafts(selectedItemThreadReplies) !== serializeReplyDrafts(selectedItem.thread_replies)
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
        setThreadRepliesByItemId(
            Object.fromEntries(
                items.map((item) => [item.id, normalizeThreadReplies(item.thread_replies)]),
            ),
        );
    }, [items]);

    useEffect(() => {
        if (!shouldPollRun) {
            return;
        }

        const interval = window.setInterval(() => {
            router.refresh();
        }, 3000);

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
        setScheduleFeedback(null);

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

                if (!result.ok) {
                    setScheduleFeedback({
                        kind: 'error',
                        message: result.error,
                    });
                    toast.error(result.error);
                    return;
                }

                const successMessage = `Scheduled ${result.scheduledCount} approved post(s). Open Calendar to review publish times.`;
                setScheduleFeedback({
                    kind: 'success',
                    message: successMessage,
                });
                toast.success(`Scheduled ${result.scheduledCount} approved post(s).`);
                router.refresh();
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : 'Unable to schedule this run.';
                setScheduleFeedback({
                    kind: 'error',
                    message,
                });
                toast.error(message);
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

    const handleAddReply = (itemId: string) => {
        const now = new Date().toISOString();

        setThreadRepliesByItemId((current) => ({
            ...current,
            [itemId]: [
                ...(current[itemId] ?? []),
                {
                    content: '',
                    created_at: now,
                    generated_tweet_id: null,
                    id: crypto.randomUUID(),
                    updated_at: now,
                },
            ],
        }));
    };

    const handleReplyChange = (itemId: string, replyId: string, content: string) => {
        setThreadRepliesByItemId((current) => ({
            ...current,
            [itemId]: (current[itemId] ?? []).map((reply) =>
                reply.id === replyId
                    ? {
                        ...reply,
                        content,
                        updated_at: new Date().toISOString(),
                    }
                    : reply,
            ),
        }));
    };

    const handleRemoveReply = (itemId: string, replyId: string) => {
        setThreadRepliesByItemId((current) => ({
            ...current,
            [itemId]: (current[itemId] ?? []).filter((reply) => reply.id !== replyId),
        }));
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

    useEffect(() => {
        if (run.status !== 'queued') {
            return;
        }

        if (autoStartedRunIdRef.current === run.id) {
            return;
        }

        autoStartedRunIdRef.current = run.id;

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
    }, [router, run.id, run.status, startTransition]);

    const handleSaveSuggestedPost = (itemId: string) => {
        startTransition(async () => {
            try {
                const suggestedPost = suggestedPostByItemId[itemId] ?? '';
                const threadReplies = threadRepliesByItemId[itemId] ?? [];

                const result = await updateWorkflowPlannerItemSuggestedPost({
                    itemId,
                    runId: run.id,
                    suggestedPost,
                    threadReplies,
                });

                setSuggestedPostByItemId((current) => ({
                    ...current,
                    [itemId]: result.suggestedPost,
                }));
                setThreadRepliesByItemId((current) => ({
                    ...current,
                    [itemId]: result.threadReplies,
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

    const campaignTotals = campaignMetrics.totals;
    const hasCampaignOutput =
        campaignTotals.totalPosts > 0 || campaignTotals.publishedPosts > 0 || campaignTotals.scheduledPosts > 0;
    const deliveryRate = campaignTotals.totalPosts > 0
        ? Math.round((campaignTotals.publishedPosts / campaignTotals.totalPosts) * 100)
        : 0;
    const engagementPerPost = campaignTotals.publishedPosts > 0
        ? (campaignTotals.totalEngagement / campaignTotals.publishedPosts).toFixed(1)
        : '0.0';

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

                    {scheduleFeedback ? (
                        <div
                            className={cn(
                                "rounded-md border p-3 text-sm",
                                scheduleFeedback.kind === 'error'
                                    ? "border-rose-300 bg-rose-50 text-rose-700"
                                    : "border-emerald-300 bg-emerald-50 text-emerald-700",
                            )}
                        >
                            {scheduleFeedback.message}
                        </div>
                    ) : null}

                    {hasCampaignOutput ? (
                        <div className="space-y-4">
                            <div className='flex gap-2 h-56'>

                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    <MetricCard
                                        accent=" text-rose-400"
                                        helper={`${campaignTotals.publishedPosts} published across this campaign`}
                                        icon={<Heart className="h-4 w-4" />}
                                        label="Likes"
                                        value={formatCompactNumber(campaignTotals.totalLikes)}
                                    />
                                    <MetricCard
                                        accent=" text-sky-400"
                                        helper={`${engagementPerPost} interactions per published post`}
                                        icon={<TrendingUp className="h-4 w-4" />}
                                        label="Engagement"
                                        value={formatCompactNumber(campaignTotals.totalEngagement)}
                                    />
                                    <MetricCard
                                        accent=" text-emerald-400"
                                        helper={`${deliveryRate}% of campaign output is already live`}
                                        icon={<CalendarDays className="h-4 w-4" />}
                                        label="Published"
                                        value={formatCompactNumber(campaignTotals.publishedPosts)}
                                    />
                                    <MetricCard
                                        accent=" text-amber-400"
                                        helper={`${campaignTotals.totalQuotes} quotes and ${campaignTotals.failedPosts} failed`}
                                        icon={<Repeat2 className="h-4 w-4" />}
                                        label="Reposts"
                                        value={formatCompactNumber(campaignTotals.totalReposts)}
                                    />
                                    <div className="rounded-2xl border bg-muted/20 px-3 py-2 h-28">
                                        <p className="mt-3 text-2xl font-semibold">
                                            {formatCompactNumber(campaignTotals.totalReplies)}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <MessageCircle className="h-4 w-4 text-primary" />
                                            Conversation
                                        </div>
                                        {/* <p className="mt-1 text-sm text-muted-foreground">
                                            Replies collected across campaign posts.
                                        </p> */}
                                    </div>
                                    {/* <div className="rounded-2xl border bg-muted/20 p-4">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <Repeat2 className="h-4 w-4 text-primary" />
                                            Scheduled queue
                                        </div>
                                        <p className="mt-3 text-2xl font-semibold">
                                            {formatCompactNumber(campaignTotals.scheduledPosts)}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Posts still waiting for their publish time.
                                        </p>
                                    </div> */}
                                    {/* <div className="rounded-2xl border bg-muted/20 p-4">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            Data source
                                        </div>
                                        <p className="mt-3 text-2xl font-semibold">
                                            {campaignMetrics.hasLiveMetrics ? 'Live' : 'Ready'}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {campaignMetrics.hasLiveMetrics
                                                ? 'Metrics are coming from published X posts.'
                                                : 'The campaign is wired. Metrics will appear after publishing starts.'}
                                        </p>
                                    </div> */}
                                </div>

                                <CampaignPerformanceChart metrics={campaignMetrics} />

                            </div>
                            {/* 
                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="rounded-2xl border bg-muted/20 p-4">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <MessageCircle className="h-4 w-4 text-primary" />
                                        Conversation
                                    </div>
                                    <p className="mt-3 text-2xl font-semibold">
                                        {formatCompactNumber(campaignTotals.totalReplies)}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Replies collected across campaign posts.
                                    </p>
                                </div>
                                <div className="rounded-2xl border bg-muted/20 p-4">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <Repeat2 className="h-4 w-4 text-primary" />
                                        Scheduled queue
                                    </div>
                                    <p className="mt-3 text-2xl font-semibold">
                                        {formatCompactNumber(campaignTotals.scheduledPosts)}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Posts still waiting for their publish time.
                                    </p>
                                </div>
                                <div className="rounded-2xl border bg-muted/20 p-4">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <TrendingUp className="h-4 w-4 text-primary" />
                                        Data source
                                    </div>
                                    <p className="mt-3 text-2xl font-semibold">
                                        {campaignMetrics.hasLiveMetrics ? 'Live' : 'Ready'}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {campaignMetrics.hasLiveMetrics
                                            ? 'Metrics are coming from published X posts.'
                                            : 'The campaign is wired. Metrics will appear after publishing starts.'}
                                    </p>
                                </div>
                            </div> */}
                        </div>
                    ) : (
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
                    )}


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
                        {/* <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {run.status === 'queued'
                                ? 'This run is queued. It will be picked by the background dispatcher.'
                                : 'Generation is in progress. The page auto-refreshes every 5 seconds.'}
                        </div> */}
                        <div className="flex w-full max-w-2xl flex-col gap-2">
                            <div className=' flex '>
                                {/* <Loader2 className="h-4 w-4 animate-spin" /> */}
                                <TextShimmerWave className='font-mono text-sm' duration={1}>
                                    Generating...
                                </TextShimmerWave>
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </CardContent>

                </Card>
            ) : null}

            {/* <div className="flex w-full max-w-92 items-center gap-4">
                <Skeleton className="size-10 rounded-full" />
                <TextShimmerWave className='font-mono text-sm' duration={1}>
                    Generating...
                </TextShimmerWave>
                <div className="flex flex-1 flex-col">
                    <Skeleton className="my-0.5 h-4 max-w-54" />
                    <div className="flex max-w-54 items-center gap-1">
                        <Skeleton className="my-0.5 h-4 w-1/2" />
                        <Skeleton className="my-0.5 h-4 w-1/2" />
                    </div>
                </div>
                <Skeleton className="h-6 w-17" />
            </div> */}
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
                                                <ItemStatusBadge status={selectedItemDisplayStatus} />
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
                                <Timeline className="max-w-xl space-y-0 pb-10 pt-2">
                                    <TimelineItem
                                        className="group-data-[orientation=vertical]/timeline:ms-10 group-data-[orientation=vertical]/timeline:not-last:pb-6"
                                        step={1}
                                    >
                                        <TimelineHeader>
                                            <TimelineSeparator className="group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-6.5" />
                                            <TimelineTitle className="mt-0.5 flex items-center gap-2">
                                                <span>Post</span>
                                                <ItemStatusBadge status={selectedItemDisplayStatus} />
                                            </TimelineTitle>
                                            <TimelineIndicator className="group-data-[orientation=vertical]/timeline:-left-7 flex size-10 items-center justify-center border-none bg-primary/10">
                                                <Avatar className="size-10">
                                                    <AvatarImage alt={postingAccountName} src={xProfile?.avatarUrl ?? undefined} />
                                                    <AvatarFallback>{postingAccountInitials}</AvatarFallback>
                                                </Avatar>
                                            </TimelineIndicator>
                                        </TimelineHeader>
                                        <TimelineContent className="mt-2 rounded-lg border px-4 py-3 text-foreground">
                                            <div className="space-y-2">
                                                <Textarea
                                                    textareaClassName='text-base'
                                                    aria-describedby="twitter-post-input-description"
                                                    className="max-w-xl text-base"
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
                                            {canEditSuggestedPost && selectedItem ? (
                                                <Button
                                                    className="gap-2"
                                                    disabled={isPending}
                                                    onClick={() => handleAddReply(selectedItem.id)}
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <MessageCircle className="h-4 w-4" />
                                                    Reply
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
                                        </TimelineContent>
                                    </TimelineItem>
                                    {selectedItemThreadReplies.length > 0 ? (
                                        <>
                                            <div className="flex items-center justify-between pb-3 pl-12">
                                                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                                    Thread Replies
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Replies publish in order beneath the main post.
                                                </p>
                                            </div>
                                            {selectedItemThreadReplies.map((reply, replyIndex) => {
                                                const replyStatus = reply.generated_tweet_id
                                                    ? (generatedTweetStatusById[reply.generated_tweet_id] ?? 'scheduled')
                                                    : 'pending';
                                                const replyRemainingCharacters = CHARACTER_LIMIT - reply.content.length;

                                                return (
                                                    <TimelineItem
                                                        className="group-data-[orientation=vertical]/timeline:ms-10 group-data-[orientation=vertical]/timeline:not-last:pb-6"
                                                        key={reply.id}
                                                        step={replyIndex + 2}
                                                    >
                                                        <TimelineHeader>
                                                            <TimelineSeparator className="group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-6.5" />
                                                            <TimelineTitle className="mt-0.5 flex items-center gap-2">
                                                                <span>Reply</span>
                                                                <ItemStatusBadge status={replyStatus} />
                                                            </TimelineTitle>
                                                            <TimelineIndicator className="group-data-[orientation=vertical]/timeline:-left-7 flex size-10 items-center justify-center border-none bg-primary/10">
                                                                <Avatar className="size-10">
                                                                    <AvatarImage
                                                                        alt={postingAccountName}
                                                                        src={xProfile?.avatarUrl ?? undefined}
                                                                    />
                                                                    <AvatarFallback>{postingAccountInitials}</AvatarFallback>
                                                                </Avatar>
                                                            </TimelineIndicator>
                                                        </TimelineHeader>
                                                        <TimelineContent className="mt-2 rounded-lg border px-4 py-3 text-foreground">
                                                            <Textarea
                                                                aria-label={`Reply ${replyIndex + 1}`}
                                                                className="max-w-xl text-base"
                                                                onChange={(event) =>
                                                                    selectedItem
                                                                        ? handleReplyChange(selectedItem.id, reply.id, event.target.value)
                                                                        : undefined
                                                                }
                                                                readOnly={!canEditSuggestedPost}
                                                                rows={4}
                                                                value={reply.content}
                                                            />
                                                            <div className="mt-3 flex items-center justify-between gap-3">
                                                                <p
                                                                    className={cn(
                                                                        'text-xs',
                                                                        replyRemainingCharacters < 0
                                                                            ? 'text-destructive'
                                                                            : 'text-muted-foreground',
                                                                    )}
                                                                >
                                                                    {replyRemainingCharacters < 0
                                                                        ? `${Math.abs(replyRemainingCharacters)} characters exceeded`
                                                                        : `${replyRemainingCharacters} characters left`}
                                                                </p>
                                                                {canEditSuggestedPost ? (
                                                                    <Button
                                                                        disabled={isPending}
                                                                        onClick={() =>
                                                                            selectedItem
                                                                                ? handleRemoveReply(selectedItem.id, reply.id)
                                                                                : undefined
                                                                        }
                                                                        size="sm"
                                                                        type="button"
                                                                        variant="ghost"
                                                                    >
                                                                        Remove
                                                                    </Button>
                                                                ) : null}
                                                            </div>
                                                        </TimelineContent>
                                                    </TimelineItem>
                                                );
                                            })}
                                        </>
                                    ) : null}
                                </Timeline>
                                {/* <AspectRatio ratio={16 / 9} className='max-w-xl'>
                                    <Image fill src={"/contentosx-template-1-16x9.png"}
                                        alt="Image" className="rounded-md object-cover" />
                                </AspectRatio> */}
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
                                        <ItemStatusBadge
                                            status={itemDeliveryStatusByItemId[item.id] ?? item.approval_status}
                                        />
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
