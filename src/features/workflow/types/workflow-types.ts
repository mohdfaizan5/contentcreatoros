import type {
    SevenDayPlanningItem,
    SevenDayPlanningItemApprovalStatus,
    SevenDayPlanningRun,
    GeneratedTweetStatus,
} from '@/shared/types/database';
export type WorkflowRunListOptions = {
    limit?: number;
};

export type WorkflowPostingAccountProfile = {
    name: string;
    title: string | null;
    username: string;
    avatarUrl: string | null;
};

export type WorkflowPlannerRunListItem = SevenDayPlanningRun & {
    xProfile: WorkflowPostingAccountProfile | null;
};

export type WorkflowPlannerRunDetails = {
    run: SevenDayPlanningRun;
    items: SevenDayPlanningItem[];
    itemDeliveryStatusByItemId: Record<
        string,
        SevenDayPlanningItemApprovalStatus | GeneratedTweetStatus | 'publishing'
    >;
    generatedTweetStatusById: Record<
        string,
        GeneratedTweetStatus | 'publishing'
    >;
    xProfile: WorkflowPostingAccountProfile | null;
    campaignMetrics: {
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
};
