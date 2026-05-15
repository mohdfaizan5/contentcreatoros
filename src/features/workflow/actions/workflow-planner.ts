'use server';

import { parseISO, startOfDay } from 'date-fns';
import { randomUUID } from 'crypto';

import { revalidateAppPaths } from '@/features/inspiration/lib/revalidate-app-paths';
import { createAdminClient } from '@/shared/lib/supabase/server-admin';
import { createClient } from '@/shared/lib/supabase/server';
import { ensureStoredXAccessToken } from '@/features/x/lib/x-auth';
import { buildTweetContentForScheduling } from '@/features/x/lib/tweet-text';
import { splitWorkflowSuggestedPosts } from '@/features/x/lib/tweet-text';
import { getAuthenticatedXUser, getTweetsByIds } from '@/features/x/lib/x';
import {
  getPostMediaExtension,
  normalizePostMediaAttachments,
  POST_MEDIA_BUCKET,
  stripPostMediaSignedUrls,
  validatePostMediaAttachmentSet,
  validatePostMediaFile,
} from '@/features/x/lib/post-media';
import {
  buildDateRange,
  formatWorkflowSuggestedPost,
  getBrandContextForUser,
  regenerateSevenDayDraftItem,
  type PlannerDraftItem,
  type WorkflowPlannerVoiceMode,
} from '@/features/workflow/lib/workflow-planner-ai';
import {
  dispatchWorkflowPlanningRuns,
  type DispatchPlannerSummary,
} from '@/features/workflow/lib/workflow-planner-dispatch';
import type {
  SevenDayPlanningItem,
  SevenDayPlanningItemApprovalStatus,
  SevenDayPlanningRun,
  PostMediaAttachment,
  GeneratedTweet,
  WorkflowThreadReply,
} from '@/shared/types/database';
import {
  WorkflowPlannerRunDetails,
  WorkflowPlannerRunListItem,
  WorkflowPostingAccountProfile,
  WorkflowRunListOptions,
} from '../types/workflow-types';


async function getAuthenticatedUserAndClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  return { supabase, user };
}

async function refreshRunCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  runId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from('seven_day_planning_items')
    .select('approval_status')
    .eq('run_id', runId)
    .eq('user_id', userId);

  if (error) {
    throw new Error('Unable to refresh workflow run counters.');
  }

  const counts = {
    approved: 0,
    pending: 0,
    rejected: 0,
    scheduled: 0,
  };

  for (const row of data ?? []) {
    if (row.approval_status === 'approved') {
      counts.approved += 1;
      continue;
    }

    if (row.approval_status === 'rejected') {
      counts.rejected += 1;
      continue;
    }

    if (row.approval_status === 'scheduled') {
      counts.scheduled += 1;
      continue;
    }

    counts.pending += 1;
  }

  const { error: updateError } = await supabase
    .from('seven_day_planning_runs')
    .update({
      approved_count: counts.approved,
      pending_count: counts.pending,
      rejected_count: counts.rejected,
      scheduled_count: counts.scheduled,
    })
    .eq('id', runId)
    .eq('user_id', userId);

  if (updateError) {
    throw new Error('Unable to update workflow run counters.');
  }

  return counts;
}

function toPlannerDraftItem(item: SevenDayPlanningItem): PlannerDraftItem {
  return {
    angle: item.angle,
    contentType: item.content_type,
    dateISO: item.item_date,
    dayLabel: item.day_label,
    id: item.id,
    pillar: item.pillar,
    rationale: item.rationale,
    suggestedPost: item.suggested_post,
  };
}

function normalizeDecisionNote(note?: string) {
  const trimmed = note?.trim();
  return trimmed ? trimmed : null;
}

function buildDefaultWorkflowScheduledDate(itemDateISO: string, approvedIndex: number) {
  const baseDate = startOfDay(parseISO(itemDateISO));

  if (Number.isNaN(baseDate.getTime())) {
    throw new Error(`Invalid date in workflow item: ${itemDateISO}`);
  }

  baseDate.setUTCHours(14 + approvedIndex * 3, 0, 0, 0);

  return baseDate;
}

function getWorkflowItemSlotIndex(dayLabel: string) {
  const match = dayLabel.match(/post\s+(\d+)$/i);

  if (!match) {
    return 0;
  }

  const parsedIndex = Number.parseInt(match[1] ?? '1', 10);
  return Number.isFinite(parsedIndex) && parsedIndex > 0 ? parsedIndex - 1 : 0;
}

function getWorkflowMediaStoragePath(params: {
  userId: string;
  runId: string;
  itemId: string;
  fileName: string;
  mimeType: string;
}) {
  const extension = getPostMediaExtension(params.fileName, params.mimeType);
  return `${params.userId}/${params.runId}/${params.itemId}/${randomUUID()}.${extension}`;
}

function getAttachmentPreviewName(file: File) {
  return file.name?.trim().slice(0, 120) || 'post-media';
}

function getSupabaseErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const record = error as Record<string, unknown>;
  const message = typeof record.message === 'string' ? record.message : null;
  const details = typeof record.details === 'string' ? record.details : null;
  const hint = typeof record.hint === 'string' ? record.hint : null;

  return [message, details, hint].filter(Boolean).join(' ');
}

async function addSignedUrlsToPostMediaAttachments(
  attachments: PostMediaAttachment[],
): Promise<PostMediaAttachment[]> {
  const normalizedAttachments = normalizePostMediaAttachments(attachments);

  if (!normalizedAttachments.length) {
    return [];
  }

  const paths = normalizedAttachments
    .filter((attachment) => attachment.bucket === POST_MEDIA_BUCKET)
    .map((attachment) => attachment.path);

  if (!paths.length) {
    return normalizedAttachments;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(POST_MEDIA_BUCKET)
    .createSignedUrls(paths, 60 * 60);

  if (error) {
    return normalizedAttachments.map((attachment) => ({
      ...attachment,
      signed_url: null,
    }));
  }

  const signedUrlByPath = new Map(
    (data ?? []).map((item) => [item.path, item.signedUrl ?? null]),
  );

  return normalizedAttachments.map((attachment) => ({
    ...attachment,
    signed_url: signedUrlByPath.get(attachment.path) ?? null,
  }));
}

async function addSignedUrlsToPlanningItems(items: SevenDayPlanningItem[]) {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      media_attachments: await addSignedUrlsToPostMediaAttachments(item.media_attachments),
    })),
  );
}

function stripScheduledWorkflowInsertMetadata<T extends Record<string, unknown>>(row: T) {
  const { itemId, itemIndex, ...insertRow } = row;
  void itemId;
  void itemIndex;
  return insertRow;
}

function normalizeWorkflowThreadReplies(
  replies: WorkflowThreadReply[] | null | undefined,
): WorkflowThreadReply[] {
  return (replies ?? [])
    .filter((reply): reply is WorkflowThreadReply => Boolean(reply?.id))
    .map((reply) => ({
      content: reply.content ?? '',
      created_at: reply.created_at ?? new Date().toISOString(),
      generated_tweet_id: reply.generated_tweet_id ?? null,
      id: reply.id,
      updated_at: reply.updated_at ?? new Date().toISOString(),
    }));
}

function buildEmptyWorkflowCampaignMetrics(): WorkflowPlannerRunDetails['campaignMetrics'] {
  return {
    totals: {
      totalPosts: 0,
      publishedPosts: 0,
      scheduledPosts: 0,
      failedPosts: 0,
      totalLikes: 0,
      totalReplies: 0,
      totalReposts: 0,
      totalQuotes: 0,
      totalEngagement: 0,
    },
    trend: [],
    hasLiveMetrics: false,
  };
}

function buildWorkflowItemDeliveryStatusByItemId(
  items: SevenDayPlanningItem[],
  generatedTweets: GeneratedTweet[],
): WorkflowPlannerRunDetails['itemDeliveryStatusByItemId'] {
  const tweetById = new Map(generatedTweets.map((tweet) => [tweet.id, tweet]));

  return Object.fromEntries(
    items.map((item) => {
      const linkedTweet = item.generated_tweet_id ? tweetById.get(item.generated_tweet_id) : null;

      if (!linkedTweet) {
        return [item.id, item.approval_status];
      }

      if (linkedTweet.status === 'published') {
        return [item.id, 'published'];
      }

      if (linkedTweet.status === 'failed') {
        return [item.id, 'failed'];
      }

      if (linkedTweet.status === 'publishing') {
        return [item.id, 'publishing'];
      }

      if (linkedTweet.status === 'scheduled') {
        return [item.id, 'scheduled'];
      }

      return [item.id, item.approval_status];
    }),
  );
}

function buildGeneratedTweetStatusById(
  generatedTweets: GeneratedTweet[],
): WorkflowPlannerRunDetails['generatedTweetStatusById'] {
  return Object.fromEntries(
    generatedTweets.map((tweet) => [tweet.id, tweet.status]),
  );
}

async function buildWorkflowCampaignMetrics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  run: SevenDayPlanningRun,
  items: SevenDayPlanningItem[],
) {
  const candidateTweetIds = [
    ...(run.scheduled_generated_tweet_ids ?? []),
    ...items.map((item) => item.generated_tweet_id).filter((tweetId): tweetId is string => Boolean(tweetId)),
    ...items.flatMap((item) =>
      normalizeWorkflowThreadReplies(item.thread_replies)
        .map((reply) => reply.generated_tweet_id)
        .filter((tweetId): tweetId is string => Boolean(tweetId)),
    ),
  ];
  const uniqueGeneratedTweetIds = [...new Set(candidateTweetIds)];

  if (!uniqueGeneratedTweetIds.length) {
    return buildEmptyWorkflowCampaignMetrics();
  }

  const { data: generatedTweets, error: generatedTweetsError } = await supabase
    .from('generated_tweets')
    .select('*')
    .eq('user_id', userId)
    .in('id', uniqueGeneratedTweetIds);

  if (generatedTweetsError) {
    throw new Error('Unable to load campaign output for this workflow run.');
  }

  const tweets = (generatedTweets ?? []) as GeneratedTweet[];

  if (!tweets.length) {
    return buildEmptyWorkflowCampaignMetrics();
  }

  const totals = {
    totalPosts: tweets.length,
    publishedPosts: tweets.filter((tweet) => tweet.status === 'published').length,
    scheduledPosts: tweets.filter((tweet) => tweet.status === 'scheduled').length,
    failedPosts: tweets.filter((tweet) => tweet.status === 'failed').length,
    totalLikes: 0,
    totalReplies: 0,
    totalReposts: 0,
    totalQuotes: 0,
    totalEngagement: 0,
  };

  const publishedTweetsWithIds = tweets.filter(
    (tweet) => tweet.status === 'published' && tweet.x_account_id && tweet.x_tweet_id,
  );

  if (!publishedTweetsWithIds.length) {
    return {
      totals,
      trend: [],
      hasLiveMetrics: false,
    };
  }

  const tweetMetricsById = new Map<string, Awaited<ReturnType<typeof getTweetsByIds>>[number]>();
  const accountIds = [...new Set(publishedTweetsWithIds.map((tweet) => tweet.x_account_id as string))];

  for (const accountId of accountIds) {
    try {
      const accessToken = await ensureStoredXAccessToken(accountId);
      const accountTweetIds = publishedTweetsWithIds
        .filter((tweet) => tweet.x_account_id === accountId)
        .map((tweet) => tweet.x_tweet_id as string);
      const accountTweets = await getTweetsByIds(accessToken, accountTweetIds);

      for (const accountTweet of accountTweets) {
        tweetMetricsById.set(accountTweet.id, accountTweet);
      }
    } catch {
      continue;
    }
  }

  const trendByDate = new Map<
    string,
    {
      date: string;
      label: string;
      posts: number;
      likes: number;
      replies: number;
      reposts: number;
      quotes: number;
      engagement: number;
    }
  >();

  for (const tweet of publishedTweetsWithIds) {
    const liveTweet = tweet.x_tweet_id ? tweetMetricsById.get(tweet.x_tweet_id) : null;
    const likeCount = liveTweet?.public_metrics?.like_count ?? 0;
    const replyCount = liveTweet?.public_metrics?.reply_count ?? 0;
    const repostCount = liveTweet?.public_metrics?.retweet_count ?? 0;
    const quoteCount = liveTweet?.public_metrics?.quote_count ?? 0;
    const engagement = likeCount + replyCount + repostCount + quoteCount;
    const publishedAtISO = tweet.published_at ?? tweet.scheduled_for ?? tweet.created_at;
    const publishedDate = startOfDay(parseISO(publishedAtISO));
    const dateKey = Number.isNaN(publishedDate.getTime())
      ? publishedAtISO.slice(0, 10)
      : publishedDate.toISOString().slice(0, 10);
    const label = Number.isNaN(publishedDate.getTime())
      ? dateKey
      : publishedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    totals.totalLikes += likeCount;
    totals.totalReplies += replyCount;
    totals.totalReposts += repostCount;
    totals.totalQuotes += quoteCount;
    totals.totalEngagement += engagement;

    const existingTrendPoint = trendByDate.get(dateKey) ?? {
      date: dateKey,
      label,
      posts: 0,
      likes: 0,
      replies: 0,
      reposts: 0,
      quotes: 0,
      engagement: 0,
    };

    existingTrendPoint.posts += 1;
    existingTrendPoint.likes += likeCount;
    existingTrendPoint.replies += replyCount;
    existingTrendPoint.reposts += repostCount;
    existingTrendPoint.quotes += quoteCount;
    existingTrendPoint.engagement += engagement;
    trendByDate.set(dateKey, existingTrendPoint);
  }

  return {
    totals,
    trend: [...trendByDate.values()].sort((left, right) => left.date.localeCompare(right.date)),
    hasLiveMetrics: tweetMetricsById.size > 0,
  };
}

async function loadWorkflowPostingAccountProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  targetXAccountId: string | null,
): Promise<WorkflowPostingAccountProfile | null> {
  if (!targetXAccountId) {
    return null;
  }

  try {
    const [{ data: xAccount, error: xAccountError }, accessToken] = await Promise.all([
      supabase
        .from('x_accounts')
        .select('id, username')
        .eq('id', targetXAccountId)
        .eq('user_id', userId)
        .maybeSingle(),
      ensureStoredXAccessToken(targetXAccountId),
    ]);

    if (xAccountError || !xAccount?.id) {
      throw new Error('Unable to load the selected X account.');
    }

    const profile = await getAuthenticatedXUser(accessToken);
    return {
      name: profile.name || xAccount.username,
      title: profile.description?.trim() || null,
      username: profile.username || xAccount.username,
      avatarUrl: profile.profile_image_url ?? null,
    };
  } catch {
    const { data: xAccount } = await supabase
      .from('x_accounts')
      .select('username')
      .eq('id', targetXAccountId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!xAccount?.username) {
      return null;
    }

    return {
      name: xAccount.username,
      title: null,
      username: xAccount.username,
      avatarUrl: null,
    };
  }
}

async function resolveWorkflowSchedulingXAccount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  targetXAccountId: string | null,
) {
  if (targetXAccountId) {
    const { data: xAccount } = await supabase
      .from('x_accounts')
      .select('id, account_role')
      .eq('id', targetXAccountId)
      .eq('user_id', userId)
      .maybeSingle();

    if (xAccount?.id && xAccount.account_role) {
      return xAccount;
    }
  }

  const { data: fallbackAccounts, error: fallbackAccountsError } = await supabase
    .from('x_accounts')
    .select('id, account_role')
    .eq('user_id', userId)
    .in('account_role', ['company', 'founder'])
    .order('connected_at', { ascending: false });

  if (fallbackAccountsError) {
    throw new Error('Unable to load connected X accounts for workflow scheduling.');
  }

  const preferredAccount =
    fallbackAccounts?.find((account) => account.account_role === 'company') ??
    fallbackAccounts?.find((account) => account.account_role === 'founder') ??
    null;

  return preferredAccount;
}

export async function enqueueWorkflowPlannerRun(params: {
  campaignBrief?: string;
  startDateISO: string;
  endDateISO: string;
  postsPerDay?: 1 | 2;
  targetXAccountId: string;
  voiceMode?: WorkflowPlannerVoiceMode;
}): Promise<{ runId: string }> {
  const { supabase, user } = await getAuthenticatedUserAndClient();

  const dates = buildDateRange(params.startDateISO, params.endDateISO);
  const startDateISO = params.startDateISO;
  const endDateISO = params.endDateISO;
  const campaignBrief = params.campaignBrief?.trim() ?? '';
  const postsPerDay = params.postsPerDay === 2 ? 2 : 1;
  const voiceMode: WorkflowPlannerVoiceMode =
    params.voiceMode === 'corporate' ? 'corporate' : 'human';

  if (!dates.length) {
    throw new Error('Unable to create this workflow run.');
  }

  const { data: xAccount, error: xAccountError } = await supabase
    .from('x_accounts')
    .select('id, account_role')
    .eq('id', params.targetXAccountId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (xAccountError || !xAccount?.id || !xAccount.account_role) {
    throw new Error('Choose a connected founder or company X account before queueing this workflow.');
  }

  const { data, error } = await supabase
    .from('seven_day_planning_runs')
    .insert({
      approved_count: 0,
      end_date: endDateISO,
      generation_prompt_snapshot: {
        campaignBrief,
        multiPostMode: 'separate_items',
        postsPerDay,
        voiceMode,
      },
      pending_count: 0,
      rejected_count: 0,
      scheduled_count: 0,
      start_date: startDateISO,
      status: 'queued',
      target_x_account_id: xAccount.id,
      user_id: user.id,
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    throw new Error('Unable to queue this workflow run.');
  }

  revalidateAppPaths(['/workflow', '/']);

  return {
    runId: data.id,
  };
}

export async function listWorkflowPlannerRuns(
  options: WorkflowRunListOptions = {},
): Promise<WorkflowPlannerRunListItem[]> {
  const { supabase, user } = await getAuthenticatedUserAndClient();
  const limit = options.limit ? Math.max(1, Math.min(50, options.limit)) : 20;

  const { data, error } = await supabase
    .from('seven_day_planning_runs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error('Unable to load workflow runs.');
  }

  const runs = (data ?? []) as SevenDayPlanningRun[];
  const uniqueAccountIds = [...new Set(
    runs
      .map((run) => run.target_x_account_id)
      .filter((accountId): accountId is string => Boolean(accountId)),
  )];
  const profileEntries = await Promise.all(
    uniqueAccountIds.map(async (accountId) => ([
      accountId,
      await loadWorkflowPostingAccountProfile(supabase, user.id, accountId),
    ] as const)),
  );
  const profileByAccountId = new Map(profileEntries);

  return runs.map((run) => ({
    ...run,
    xProfile: run.target_x_account_id
      ? (profileByAccountId.get(run.target_x_account_id) ?? null)
      : null,
  }));
}

export async function getWorkflowPlannerRun(
  runId: string,
): Promise<WorkflowPlannerRunDetails | null> {
  const { supabase, user } = await getAuthenticatedUserAndClient();

  const [{ data: run, error: runError }, { data: items, error: itemsError }] =
    await Promise.all([
      supabase
        .from('seven_day_planning_runs')
        .select('*')
        .eq('id', runId)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('seven_day_planning_items')
        .select('*')
        .eq('run_id', runId)
        .eq('user_id', user.id)
        .order('day_index', { ascending: true }),
    ]);

  if (runError || itemsError) {
    throw new Error('Unable to load this workflow run.');
  }

  if (!run) {
    return null;
  }

  const typedItems = (items ?? []) as SevenDayPlanningItem[];

  const generatedTweetIds = [
    ...(run.scheduled_generated_tweet_ids ?? []),
    ...typedItems
      .map((item) => item.generated_tweet_id)
      .filter((tweetId): tweetId is string => Boolean(tweetId)),
    ...typedItems.flatMap((item) =>
      normalizeWorkflowThreadReplies(item.thread_replies)
        .map((reply) => reply.generated_tweet_id)
        .filter((tweetId): tweetId is string => Boolean(tweetId)),
    ),
  ];
  const uniqueGeneratedTweetIds = [...new Set(generatedTweetIds)];
  const { data: generatedTweetsRows, error: generatedTweetsError } = uniqueGeneratedTweetIds.length
    ? await supabase
      .from('generated_tweets')
      .select('id, status')
      .eq('user_id', user.id)
      .in('id', uniqueGeneratedTweetIds)
    : { data: [], error: null };

  if (generatedTweetsError) {
    throw new Error('Unable to load workflow publishing status.');
  }

  const generatedTweets = (generatedTweetsRows ?? []) as GeneratedTweet[];

  const xProfile = await loadWorkflowPostingAccountProfile(
    supabase,
    user.id,
    run.target_x_account_id,
  );

  return {
    campaignMetrics: await buildWorkflowCampaignMetrics(
      supabase,
      user.id,
      run as SevenDayPlanningRun,
      typedItems,
    ),
    itemDeliveryStatusByItemId: buildWorkflowItemDeliveryStatusByItemId(
      typedItems,
      generatedTweets,
    ),
    generatedTweetStatusById: buildGeneratedTweetStatusById(generatedTweets),
    items: await addSignedUrlsToPlanningItems(typedItems),
    run: run as SevenDayPlanningRun,
    xProfile,
  };
}

export async function triggerWorkflowPlannerRun(
  runId: string,
): Promise<DispatchPlannerSummary> {
  const { supabase, user } = await getAuthenticatedUserAndClient();

  const { data: run, error } = await supabase
    .from('seven_day_planning_runs')
    .select('id')
    .eq('id', runId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !run?.id) {
    throw new Error('Unable to find this workflow run.');
  }

  const summary = await dispatchWorkflowPlanningRuns({
    runId,
    source: 'manual_ui',
  });

  revalidateAppPaths(['/workflow', '/workflow/' + runId, '/']);

  return summary;
}

export async function retryWorkflowPlannerRun(
  runId: string,
): Promise<{ runId: string }> {
  const { supabase, user } = await getAuthenticatedUserAndClient();

  const { error: deleteItemsError } = await supabase
    .from('seven_day_planning_items')
    .delete()
    .eq('run_id', runId)
    .eq('user_id', user.id);

  if (deleteItemsError) {
    throw new Error('Unable to reset workflow items for retry.');
  }

  const { data, error } = await supabase
    .from('seven_day_planning_runs')
    .update({
      approved_count: 0,
      cancelled_at: null,
      generation_completed_at: null,
      generation_error: null,
      generation_started_at: null,
      pending_count: 0,
      rejected_count: 0,
      scheduled_count: 0,
      scheduled_generated_tweet_ids: [],
      status: 'queued',
    })
    .eq('id', runId)
    .eq('user_id', user.id)
    .select('id')
    .single();

  if (error || !data?.id) {
    throw new Error('Unable to reset this workflow run.');
  }

  revalidateAppPaths(['/workflow', '/workflow/' + runId, '/']);

  return { runId: data.id };
}

export async function deleteWorkflowPlannerRun(
  runId: string,
): Promise<{ runId: string }> {
  const { supabase, user } = await getAuthenticatedUserAndClient();

  const [{ data: run, error: runError }, { data: items, error: itemsError }] =
    await Promise.all([
      supabase
        .from('seven_day_planning_runs')
        .select('id, scheduled_generated_tweet_ids')
        .eq('id', runId)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('seven_day_planning_items')
        .select('id, media_attachments')
        .eq('run_id', runId)
        .eq('user_id', user.id),
    ]);

  if (runError || itemsError || !run?.id) {
    throw new Error('Unable to load this campaign for deletion.');
  }

  const attachmentPaths = new Set<string>();

  for (const item of (items ?? []) as Array<Pick<SevenDayPlanningItem, 'media_attachments'>>) {
    for (const attachment of normalizePostMediaAttachments(item.media_attachments)) {
      if (attachment.bucket === POST_MEDIA_BUCKET) {
        attachmentPaths.add(attachment.path);
      }
    }
  }

  if (run.scheduled_generated_tweet_ids?.length) {
    const { error: deleteGeneratedTweetsError } = await supabase
      .from('generated_tweets')
      .delete()
      .eq('user_id', user.id)
      .in('id', run.scheduled_generated_tweet_ids);

    if (deleteGeneratedTweetsError) {
      throw new Error('Unable to remove scheduled posts for this campaign.');
    }
  }

  const { error: deleteItemsError } = await supabase
    .from('seven_day_planning_items')
    .delete()
    .eq('run_id', runId)
    .eq('user_id', user.id);

  if (deleteItemsError) {
    throw new Error('Unable to remove campaign items.');
  }

  const { error: deleteRunError } = await supabase
    .from('seven_day_planning_runs')
    .delete()
    .eq('id', runId)
    .eq('user_id', user.id);

  if (deleteRunError) {
    throw new Error('Unable to delete this campaign.');
  }

  if (attachmentPaths.size > 0) {
    await createAdminClient()
      .storage
      .from(POST_MEDIA_BUCKET)
      .remove([...attachmentPaths]);
  }

  revalidateAppPaths(['/workflow', '/workflow/' + runId, '/calendar', '/x/calendar', '/']);

  return { runId };
}

export async function setWorkflowPlannerItemDecision(params: {
  runId: string;
  itemId: string;
  status: Extract<SevenDayPlanningItemApprovalStatus, 'pending' | 'approved' | 'rejected'>;
  note?: string;
}): Promise<{ itemId: string }> {
  const { supabase, user } = await getAuthenticatedUserAndClient();
  const now = new Date().toISOString();

  const payload: Record<string, unknown> = {
    approval_status: params.status,
    decision_note: normalizeDecisionNote(params.note),
  };

  if (params.status === 'approved') {
    payload.approved_at = now;
    payload.rejected_at = null;
  } else if (params.status === 'rejected') {
    payload.approved_at = null;
    payload.rejected_at = now;
  } else {
    payload.approved_at = null;
    payload.rejected_at = null;
  }

  const { data, error } = await supabase
    .from('seven_day_planning_items')
    .update(payload)
    .eq('id', params.itemId)
    .eq('run_id', params.runId)
    .eq('user_id', user.id)
    .select('id')
    .single();

  if (error || !data?.id) {
    throw new Error('Unable to update item status.');
  }

  await refreshRunCounts(supabase, params.runId, user.id);

  revalidateAppPaths(['/workflow', '/workflow/' + params.runId, '/']);

  return {
    itemId: data.id,
  };
}

export async function updateWorkflowPlannerItemSuggestedPost(params: {
  runId: string;
  itemId: string;
  suggestedPost: string;
  threadReplies?: WorkflowThreadReply[];
}): Promise<{
  itemId: string;
  suggestedPost: string;
  threadReplies: WorkflowThreadReply[];
}> {
  const { supabase, user } = await getAuthenticatedUserAndClient();

  const normalizedSuggestedPost = params.suggestedPost
    .replace(/\r\n/g, '\n')
    .trim();

  if (!normalizedSuggestedPost) {
    throw new Error('Suggested post cannot be empty.');
  }

  const normalizedThreadReplies = normalizeWorkflowThreadReplies(params.threadReplies)
    .map((reply) => ({
      ...reply,
      content: reply.content.replace(/\r\n/g, '\n').trim(),
    }))
    .filter((reply) => reply.content.length > 0);

  if (normalizedThreadReplies.some((reply) => reply.content.length > 280)) {
    throw new Error('Each reply must stay within 280 characters.');
  }

  const { data, error } = await supabase
    .from('seven_day_planning_items')
    .update({
      suggested_post: normalizedSuggestedPost,
      thread_replies: normalizedThreadReplies,
    })
    .eq('id', params.itemId)
    .eq('run_id', params.runId)
    .eq('user_id', user.id)
    .select('id')
    .single();

  if (error || !data?.id) {
    throw new Error('Unable to update suggested post.');
  }

  revalidateAppPaths(['/workflow', '/workflow/' + params.runId, '/']);

  return {
    itemId: data.id,
    suggestedPost: normalizedSuggestedPost,
    threadReplies: normalizedThreadReplies,
  };
}

export async function formatWorkflowPlannerItemSuggestedPost(params: {
  runId: string;
  itemId: string;
  suggestedPost: string;
}): Promise<{ itemId: string; suggestedPost: string; changed: boolean }> {
  const { supabase, user } = await getAuthenticatedUserAndClient();

  const normalizedSuggestedPost = params.suggestedPost
    .replace(/\r\n/g, '\n')
    .trim();

  if (!normalizedSuggestedPost) {
    throw new Error('Suggested post cannot be empty.');
  }

  const { data: item, error: itemError } = await supabase
    .from('seven_day_planning_items')
    .select('id')
    .eq('id', params.itemId)
    .eq('run_id', params.runId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (itemError || !item?.id) {
    throw new Error('Unable to load this workflow item for formatting.');
  }

  const result = await formatWorkflowSuggestedPost({
    suggestedPost: normalizedSuggestedPost,
  });

  if (!result.changed) {
    return {
      itemId: params.itemId,
      suggestedPost: result.formattedPost,
      changed: false,
    };
  }

  const { data, error } = await supabase
    .from('seven_day_planning_items')
    .update({
      suggested_post: result.formattedPost,
    })
    .eq('id', params.itemId)
    .eq('run_id', params.runId)
    .eq('user_id', user.id)
    .select('id')
    .single();

  if (error || !data?.id) {
    throw new Error('Unable to save formatted suggested post.');
  }

  revalidateAppPaths(['/workflow', '/workflow/' + params.runId, '/']);

  return {
    itemId: data.id,
    suggestedPost: result.formattedPost,
    changed: true,
  };
}

export async function uploadWorkflowPlannerItemMedia(
  formData: FormData,
): Promise<{ itemId: string; mediaAttachments: PostMediaAttachment[] }> {
  const { supabase, user } = await getAuthenticatedUserAndClient();
  const runId = String(formData.get('runId') ?? '');
  const itemId = String(formData.get('itemId') ?? '');
  const files = formData
    .getAll('files')
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (!runId || !itemId) {
    throw new Error('Unable to attach media to this workflow item.');
  }

  if (!files.length) {
    throw new Error('Choose at least one image or GIF to upload.');
  }

  const [{ data: run, error: runError }, { data: item, error: itemError }] =
    await Promise.all([
      supabase
        .from('seven_day_planning_runs')
        .select('id, status')
        .eq('id', runId)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('seven_day_planning_items')
        .select('id, media_attachments, approval_status')
        .eq('id', itemId)
        .eq('run_id', runId)
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

  if (runError) {
    throw new Error(
      `Unable to load this workflow run for media upload. ${getSupabaseErrorMessage(runError) ?? ''}`.trim(),
    );
  }

  if (itemError) {
    throw new Error(
      `Unable to load this workflow item for media upload. ${getSupabaseErrorMessage(itemError) ?? ''}`.trim(),
    );
  }

  if (!run || !item) {
    throw new Error('Unable to find this workflow item for media upload.');
  }

  if (run.status !== 'pending_approval' || item.approval_status === 'scheduled') {
    throw new Error('Media can only be changed before this workflow item is scheduled.');
  }

  const existingAttachments = normalizePostMediaAttachments(item.media_attachments);
  const nextAttachmentDrafts = files.map((file) => {
    const mediaType = validatePostMediaFile({
      mimeType: file.type,
      sizeBytes: file.size,
    });

    return {
      bucket: POST_MEDIA_BUCKET,
      file_name: getAttachmentPreviewName(file),
      id: randomUUID(),
      media_type: mediaType,
      mime_type: file.type,
      path: getWorkflowMediaStoragePath({
        fileName: file.name,
        itemId,
        mimeType: file.type,
        runId,
        userId: user.id,
      }),
      size_bytes: file.size,
      uploaded_at: new Date().toISOString(),
    } satisfies PostMediaAttachment;
  });

  const nextAttachments = [...existingAttachments, ...nextAttachmentDrafts];
  validatePostMediaAttachmentSet(nextAttachments);

  const admin = createAdminClient();
  const uploadedPaths: string[] = [];

  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const attachment = nextAttachmentDrafts[index];

      const { error: uploadError } = await admin.storage
        .from(POST_MEDIA_BUCKET)
        .upload(attachment.path, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      uploadedPaths.push(attachment.path);
    }

    const attachmentsForStorage = stripPostMediaSignedUrls(nextAttachments);
    const { data: updatedItem, error: updateError } = await supabase
      .from('seven_day_planning_items')
      .update({
        media_attachments: attachmentsForStorage,
      })
      .eq('id', itemId)
      .eq('run_id', runId)
      .eq('user_id', user.id)
      .select('id, media_attachments')
      .single();

    if (updateError || !updatedItem?.id) {
      throw new Error(
        `Unable to save media on this workflow item. ${getSupabaseErrorMessage(updateError) ?? ''}`.trim(),
      );
    }

    revalidateAppPaths(['/workflow', '/workflow/' + runId, '/']);

    return {
      itemId: updatedItem.id,
      mediaAttachments: await addSignedUrlsToPostMediaAttachments(
        updatedItem.media_attachments,
      ),
    };
  } catch (error) {
    if (uploadedPaths.length) {
      await admin.storage.from(POST_MEDIA_BUCKET).remove(uploadedPaths);
    }

    throw new Error(
      error instanceof Error ? error.message : 'Unable to upload media for this post.',
    );
  }
}

export async function removeWorkflowPlannerItemMedia(params: {
  runId: string;
  itemId: string;
  attachmentId: string;
}): Promise<{ itemId: string; mediaAttachments: PostMediaAttachment[] }> {
  const { supabase, user } = await getAuthenticatedUserAndClient();

  const [{ data: run, error: runError }, { data: item, error: itemError }] =
    await Promise.all([
      supabase
        .from('seven_day_planning_runs')
        .select('id, status')
        .eq('id', params.runId)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('seven_day_planning_items')
        .select('id, media_attachments, approval_status')
        .eq('id', params.itemId)
        .eq('run_id', params.runId)
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

  if (runError) {
    throw new Error(
      `Unable to load this workflow run for media removal. ${getSupabaseErrorMessage(runError) ?? ''}`.trim(),
    );
  }

  if (itemError) {
    throw new Error(
      `Unable to load this workflow item for media removal. ${getSupabaseErrorMessage(itemError) ?? ''}`.trim(),
    );
  }

  if (!run || !item) {
    throw new Error('Unable to find this workflow item for media removal.');
  }

  if (run.status !== 'pending_approval' || item.approval_status === 'scheduled') {
    throw new Error('Media can only be changed before this workflow item is scheduled.');
  }

  const existingAttachments = normalizePostMediaAttachments(item.media_attachments);
  const removedAttachment = existingAttachments.find(
    (attachment) => attachment.id === params.attachmentId,
  );

  if (!removedAttachment) {
    throw new Error('Unable to find that media attachment.');
  }

  const nextAttachments = existingAttachments.filter(
    (attachment) => attachment.id !== params.attachmentId,
  );

  const { data: updatedItem, error: updateError } = await supabase
    .from('seven_day_planning_items')
    .update({
      media_attachments: stripPostMediaSignedUrls(nextAttachments),
    })
    .eq('id', params.itemId)
    .eq('run_id', params.runId)
    .eq('user_id', user.id)
    .select('id, media_attachments')
    .single();

  if (updateError || !updatedItem?.id) {
    throw new Error(
      `Unable to remove media from this workflow item. ${getSupabaseErrorMessage(updateError) ?? ''}`.trim(),
    );
  }

  if (removedAttachment.bucket === POST_MEDIA_BUCKET) {
    await createAdminClient()
      .storage
      .from(POST_MEDIA_BUCKET)
      .remove([removedAttachment.path]);
  }

  revalidateAppPaths(['/workflow', '/workflow/' + params.runId, '/']);

  return {
    itemId: updatedItem.id,
    mediaAttachments: await addSignedUrlsToPostMediaAttachments(
      updatedItem.media_attachments,
    ),
  };
}

export async function regenerateWorkflowPlannerItem(params: {
  runId: string;
  itemId: string;
  note?: string;
}): Promise<{ itemId: string }> {
  const { supabase, user } = await getAuthenticatedUserAndClient();

  const [{ data: run, error: runError }, { data: item, error: itemError }] =
    await Promise.all([
      supabase
        .from('seven_day_planning_runs')
        .select('*')
        .eq('id', params.runId)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('seven_day_planning_items')
        .select('*')
        .eq('id', params.itemId)
        .eq('run_id', params.runId)
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

  if (runError || itemError || !run || !item) {
    throw new Error('Unable to load this workflow item for regeneration.');
  }

  if (run.status === 'scheduled' || run.status === 'cancelled') {
    throw new Error('This workflow run can no longer be regenerated.');
  }

  const brandContext = await getBrandContextForUser(supabase, user.id);
  const promptSnapshot =
    run.generation_prompt_snapshot &&
    typeof run.generation_prompt_snapshot === 'object'
      ? (run.generation_prompt_snapshot as Record<string, unknown>)
      : {};
  const existingDraft = toPlannerDraftItem(item as SevenDayPlanningItem);
  const regenerated = await regenerateSevenDayDraftItem({
    campaignBrief:
      typeof promptSnapshot.campaignBrief === 'string'
        ? promptSnapshot.campaignBrief.trim()
        : undefined,
    brandContext,
    dateISO: item.item_date,
    existingItem: existingDraft,
    note: normalizeDecisionNote(params.note) ?? undefined,
    postsPerDay: promptSnapshot.postsPerDay === 2 ? 2 : 1,
    voiceMode: promptSnapshot.voiceMode === 'corporate' ? 'corporate' : 'human',
  });

  const history = Array.isArray(item.regeneration_history)
    ? item.regeneration_history
    : [];

  const historyEntry = {
    at: new Date().toISOString(),
    note: normalizeDecisionNote(params.note),
    next: {
      angle: regenerated.angle,
      contentType: regenerated.contentType,
      pillar: regenerated.pillar,
      rationale: regenerated.rationale,
      suggestedPost: regenerated.suggestedPost,
    },
    previous: {
      angle: item.angle,
      contentType: item.content_type,
      pillar: item.pillar,
      rationale: item.rationale,
      suggestedPost: item.suggested_post,
    },
  };

  const { data: updatedItem, error: updateError } = await supabase
    .from('seven_day_planning_items')
    .update({
      angle: regenerated.angle,
      approval_status: 'pending',
      approved_at: null,
      content_type: regenerated.contentType,
      decision_note: normalizeDecisionNote(params.note),
      pillar: regenerated.pillar,
      rationale: regenerated.rationale,
      regeneration_count: (item.regeneration_count ?? 0) + 1,
      regeneration_history: [...history, historyEntry],
      rejected_at: null,
      suggested_post: regenerated.suggestedPost,
    })
    .eq('id', params.itemId)
    .eq('run_id', params.runId)
    .eq('user_id', user.id)
    .select('id')
    .single();

  if (updateError || !updatedItem?.id) {
    throw new Error('Unable to regenerate this workflow item.');
  }

  await refreshRunCounts(supabase, params.runId, user.id);

  revalidateAppPaths(['/workflow', '/workflow/' + params.runId, '/']);

  return { itemId: updatedItem.id };
}

export async function scheduleWorkflowPlannerRun(params: {
  runId: string;
  scheduleByItemId?: Record<string, string>;
}): Promise<
  | { ok: true; runId: string; scheduledCount: number }
  | { ok: false; error: string }
> {
  const { supabase, user } = await getAuthenticatedUserAndClient();

  const [{ data: run, error: runError }, { data: approvedItems, error: approvedError }] =
    await Promise.all([
      supabase
        .from('seven_day_planning_runs')
        .select('*')
        .eq('id', params.runId)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('seven_day_planning_items')
        .select('*')
        .eq('run_id', params.runId)
        .eq('user_id', user.id)
        .eq('approval_status', 'approved')
        .order('day_index', { ascending: true }),
    ]);

  if (runError || approvedError || !run) {
    throw new Error('Unable to load this workflow run for scheduling.');
  }

  if (!approvedItems?.length) {
    return {
      ok: false,
      error: 'Approve at least one day before scheduling.',
    };
  }

  if (run.status === 'scheduled') {
    return {
      ok: false,
      error: 'This workflow run is already scheduled.',
    };
  }

  let { data: template } = await supabase
    .from('templates')
    .select('id')
    .eq('user_id', user.id)
    .eq('platform_type', 'x')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!template) {
    const { data: createdTemplate, error: createTemplateError } = await supabase
      .from('templates')
      .insert({
        instructions: 'Auto-generated by workflow planner scheduling.',
        name: 'Workflow Planner Template',
        platform_type: 'x',
        structure_fields: {},
        user_id: user.id,
      })
      .select('id')
      .single();

    if (createTemplateError || !createdTemplate) {
      throw new Error('Unable to create a template for workflow scheduling.');
    }

    template = createdTemplate;
  }

  const xAccount = await resolveWorkflowSchedulingXAccount(
    supabase,
    user.id,
    run.target_x_account_id,
  );

  if (!xAccount?.id || !xAccount.account_role) {
    return {
      ok: false,
      error: 'Reconnect the selected founder or company X account before scheduling.',
    };
  }

  const scheduleByItemId = params.scheduleByItemId ?? {};
  const nowTimestamp = Date.now();

  const approvedItemsWithSchedule = approvedItems.map((item) => {
    const overrideISO = scheduleByItemId[item.id];
    const scheduledDate = overrideISO
      ? new Date(overrideISO)
      : buildDefaultWorkflowScheduledDate(item.item_date, getWorkflowItemSlotIndex(item.day_label));

    if (Number.isNaN(scheduledDate.getTime())) {
      return {
        ok: false as const,
        error: `Invalid date and time selected for ${item.day_label}.`,
      };
    }

    if (scheduledDate.getTime() <= nowTimestamp) {
      return {
        ok: false as const,
        error: `Pick a future date and time for ${item.day_label}.`,
      };
    }

    return {
      ok: true as const,
      item,
      scheduledDate,
    };
  });

  const scheduleValidationError = approvedItemsWithSchedule.find((result) => !result.ok);

  if (scheduleValidationError && !scheduleValidationError.ok) {
    return scheduleValidationError;
  }

  const validatedSchedules = approvedItemsWithSchedule.filter(
    (
      result,
    ): result is Extract<(typeof approvedItemsWithSchedule)[number], { ok: true }> => result.ok,
  );

  const invalidReply = validatedSchedules.find(({ item }) =>
    normalizeWorkflowThreadReplies(item.thread_replies).some(
      (reply) => reply.content.trim().length > 280,
    ),
  );

  if (invalidReply) {
    return {
      ok: false,
      error: `Keep every reply under 280 characters before scheduling ${invalidReply.item.day_label}.`,
    };
  }

  const postsPerDay =
    run.generation_prompt_snapshot &&
    typeof run.generation_prompt_snapshot === 'object' &&
    (run.generation_prompt_snapshot as Record<string, unknown>).postsPerDay === 2
      ? 2
      : 1;
  const multiPostMode =
    run.generation_prompt_snapshot &&
    typeof run.generation_prompt_snapshot === 'object' &&
    (run.generation_prompt_snapshot as Record<string, unknown>).multiPostMode === 'separate_items'
      ? 'separate_items'
      : 'combined_text';

  const scheduledRows = validatedSchedules.flatMap(({ item, scheduledDate }) => {
    const splitPosts =
      postsPerDay === 2 && multiPostMode !== 'separate_items'
        ? splitWorkflowSuggestedPosts(item.suggested_post).slice(0, 2)
        : [];
    const threadReplies = normalizeWorkflowThreadReplies(item.thread_replies)
      .map((reply) => ({
        ...reply,
        content: reply.content.trim(),
      }))
      .filter((reply) => reply.content.length > 0);
    const mediaAttachments = stripPostMediaSignedUrls(
      normalizePostMediaAttachments(item.media_attachments),
    );

    validatePostMediaAttachmentSet(mediaAttachments);

    if (splitPosts.length === 2) {
      return splitPosts.map((content, contentIndex) => {
        const scheduledFor = new Date(scheduledDate);
        scheduledFor.setTime(scheduledFor.getTime() + contentIndex * 3 * 60 * 60 * 1000);

        return {
          id: randomUUID(),
          itemId: item.id,
          itemIndex: contentIndex,
          character_count: content.length,
          content,
          media_attachments: mediaAttachments,
          model: run.generation_model ?? 'claude-haiku-4-5',
          prompt_snapshot: {
            angle: item.angle,
            contentType: item.content_type,
            itemId: item.id,
            replyCount: 0,
            mediaAttachmentIds: mediaAttachments.map((attachment) => attachment.id),
            pillar: item.pillar,
            postIndex: contentIndex + 1,
            postsPerDay,
            runId: params.runId,
            threadKind: 'root',
            source: 'workflow_planner',
          },
          reply_to_generated_tweet_id: null,
          scheduled_for: scheduledFor.toISOString(),
          status: 'scheduled' as const,
          template_id: template.id,
          user_id: user.id,
          x_account_id: xAccount.id,
        };
      });
    }

    const slotIndex = getWorkflowItemSlotIndex(item.day_label);
    const scheduledFor = new Date(scheduledDate);
    scheduledFor.setUTCHours(14 + slotIndex * 3, 0, 0, 0);
    if (params.scheduleByItemId?.[item.id]) {
      scheduledFor.setTime(scheduledDate.getTime());
    }

    const content = buildTweetContentForScheduling(
      item.suggested_post,
      item.pillar,
      item.angle,
    );

    const rootTweetId = randomUUID();
    const rootRow = {
      id: rootTweetId,
      itemId: item.id,
      itemIndex: 0,
      character_count: content.length,
      content,
      media_attachments: mediaAttachments,
      model: run.generation_model ?? 'claude-haiku-4-5',
      prompt_snapshot: {
        angle: item.angle,
        contentType: item.content_type,
        itemId: item.id,
        mediaAttachmentIds: mediaAttachments.map((attachment) => attachment.id),
        pillar: item.pillar,
        postIndex: slotIndex + 1,
        postsPerDay,
        replyCount: threadReplies.length,
        runId: params.runId,
        threadKind: 'root',
        source: 'workflow_planner',
      },
      reply_to_generated_tweet_id: null,
      scheduled_for: scheduledFor.toISOString(),
      status: 'scheduled' as const,
      template_id: template.id,
      user_id: user.id,
      x_account_id: xAccount.id,
    };

    let previousGeneratedTweetId = rootTweetId;
    const replyRows = threadReplies.map((reply, replyIndex) => {
      const replyTweetId = randomUUID();
      const replyScheduledFor = new Date(scheduledFor);
      replyScheduledFor.setTime(replyScheduledFor.getTime() + (replyIndex + 1) * 60 * 1000);

      const row = {
        id: replyTweetId,
        itemId: item.id,
        itemIndex: replyIndex + 1,
        character_count: reply.content.length,
        content: reply.content,
        media_attachments: [] as PostMediaAttachment[],
        model: run.generation_model ?? 'claude-haiku-4-5',
        prompt_snapshot: {
          itemId: item.id,
          replyId: reply.id,
          replyIndex,
          replyToGeneratedTweetId: previousGeneratedTweetId,
          runId: params.runId,
          threadKind: 'reply',
          source: 'workflow_planner',
        },
        reply_to_generated_tweet_id: previousGeneratedTweetId,
        scheduled_for: replyScheduledFor.toISOString(),
        status: 'scheduled' as const,
        template_id: template.id,
        user_id: user.id,
        x_account_id: xAccount.id,
      };

      previousGeneratedTweetId = replyTweetId;
      return row;
    });

    return [rootRow, ...replyRows];
  });

  const { data: insertedTweets, error: insertError } = await supabase
    .from('generated_tweets')
    .insert(scheduledRows.map(stripScheduledWorkflowInsertMetadata))
    .select('id');

  if (insertError || !insertedTweets?.length) {
    throw new Error('Unable to schedule approved workflow content.');
  }

  const tweetIds = insertedTweets.map((tweet) => tweet.id);
  const firstTweetIdByItemId = new Map<string, string>();
  const replyTweetIdByReplyId = new Map<string, string>();

  scheduledRows.forEach((row, index) => {
    if (!firstTweetIdByItemId.has(row.itemId) && tweetIds[index]) {
      firstTweetIdByItemId.set(row.itemId, tweetIds[index]);
    }

    const replyId =
      row.prompt_snapshot &&
      typeof row.prompt_snapshot === 'object' &&
      typeof (row.prompt_snapshot as Record<string, unknown>).replyId === 'string'
        ? ((row.prompt_snapshot as Record<string, unknown>).replyId as string)
        : null;

    if (replyId && tweetIds[index]) {
      replyTweetIdByReplyId.set(replyId, tweetIds[index]);
    }
  });

  const itemUpdateResults = await Promise.all(
    validatedSchedules.map(({ item }) =>
      supabase
        .from('seven_day_planning_items')
        .update({
          approval_status: 'scheduled',
          generated_tweet_id: firstTweetIdByItemId.get(item.id) ?? null,
          thread_replies: normalizeWorkflowThreadReplies(item.thread_replies).map((reply) => ({
            ...reply,
            generated_tweet_id: replyTweetIdByReplyId.get(reply.id) ?? null,
          })),
        })
        .eq('id', item.id)
        .eq('run_id', params.runId)
        .eq('user_id', user.id),
    ),
  );

  const itemUpdateError = itemUpdateResults.find((result) => result.error)?.error;

  if (itemUpdateError) {
    throw new Error('Unable to mark scheduled workflow items.');
  }

  await refreshRunCounts(supabase, params.runId, user.id);

  const { error: updateRunError } = await supabase
    .from('seven_day_planning_runs')
    .update({
      scheduled_generated_tweet_ids: tweetIds,
      status: 'scheduled',
    })
    .eq('id', params.runId)
    .eq('user_id', user.id);

  if (updateRunError) {
    throw new Error('Unable to finalize this workflow run after scheduling.');
  }

  revalidateAppPaths(['/workflow', '/workflow/' + params.runId, '/calendar', '/x/calendar', '/']);

  return {
    ok: true,
    runId: params.runId,
    scheduledCount: tweetIds.length,
  };
}
