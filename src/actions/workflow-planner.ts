'use server';

import { parseISO, startOfDay } from 'date-fns';
import { randomUUID } from 'crypto';

import { revalidateAppPaths } from '@/lib/revalidate-app-paths';
import { createAdminClient } from '@/lib/server-admin';
import { createClient } from '@/lib/server';
import { buildTweetContentForScheduling } from '@/lib/x/tweet-text';
import { splitWorkflowSuggestedPosts } from '@/lib/x/tweet-text';
import { getAuthenticatedXUser } from '@/lib/x/x';
import {
  getPostMediaExtension,
  normalizePostMediaAttachments,
  POST_MEDIA_BUCKET,
  stripPostMediaSignedUrls,
  validatePostMediaAttachmentSet,
  validatePostMediaFile,
} from '@/lib/x/post-media';
import {
  buildDateRange,
  formatWorkflowSuggestedPost,
  getBrandContextForUser,
  regenerateSevenDayDraftItem,
  type PlannerDraftItem,
} from '@/lib/workflow-planner-ai';
import {
  dispatchWorkflowPlanningRuns,
  type DispatchPlannerSummary,
} from '@/lib/workflow-planner-dispatch';
import type {
  SevenDayPlanningItem,
  SevenDayPlanningItemApprovalStatus,
  SevenDayPlanningRun,
  PostMediaAttachment,
} from '@/types/database';

type WorkflowRunListOptions = {
  limit?: number;
};

export type WorkflowPlannerRunDetails = {
  run: SevenDayPlanningRun;
  items: SevenDayPlanningItem[];
  xProfile: {
    name: string;
    title: string | null;
    username: string;
    avatarUrl: string | null;
  } | null;
};

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

export async function enqueueWorkflowPlannerRun(params: {
  campaignBrief?: string;
  startDateISO: string;
  endDateISO: string;
  postsPerDay?: 1 | 2;
}): Promise<{ runId: string }> {
  const { supabase, user } = await getAuthenticatedUserAndClient();

  const dates = buildDateRange(params.startDateISO, params.endDateISO);
  const startDateISO = params.startDateISO;
  const endDateISO = params.endDateISO;
  const campaignBrief = params.campaignBrief?.trim() ?? '';
  const postsPerDay = params.postsPerDay === 2 ? 2 : 1;

  if (!dates.length) {
    throw new Error('Unable to create this workflow run.');
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
      },
      pending_count: 0,
      rejected_count: 0,
      scheduled_count: 0,
      start_date: startDateISO,
      status: 'queued',
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
): Promise<SevenDayPlanningRun[]> {
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

  return (data ?? []) as SevenDayPlanningRun[];
}

export async function getWorkflowPlannerRun(
  runId: string,
): Promise<WorkflowPlannerRunDetails | null> {
  const { supabase, user } = await getAuthenticatedUserAndClient();

  const [
    { data: run, error: runError },
    { data: items, error: itemsError },
    { data: xAccount, error: xAccountError },
  ] =
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
      supabase
        .from('x_accounts')
        .select('access_token, username')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

  if (runError || itemsError || xAccountError) {
    throw new Error('Unable to load this workflow run.');
  }

  if (!run) {
    return null;
  }

  let xProfile: WorkflowPlannerRunDetails['xProfile'] = null;

  if (xAccount?.access_token) {
    try {
      const profile = await getAuthenticatedXUser(xAccount.access_token);
      xProfile = {
        name: profile.name || xAccount.username,
        title: profile.description?.trim() || null,
        username: profile.username || xAccount.username,
        avatarUrl: profile.profile_image_url ?? null,
      };
    } catch {
      xProfile = {
        name: xAccount.username,
        title: null,
        username: xAccount.username,
        avatarUrl: null,
      };
    }
  }

  return {
    items: await addSignedUrlsToPlanningItems((items ?? []) as SevenDayPlanningItem[]),
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
}): Promise<{ itemId: string; suggestedPost: string }> {
  const { supabase, user } = await getAuthenticatedUserAndClient();

  const normalizedSuggestedPost = params.suggestedPost
    .replace(/\r\n/g, '\n')
    .trim();

  if (!normalizedSuggestedPost) {
    throw new Error('Suggested post cannot be empty.');
  }

  const { data, error } = await supabase
    .from('seven_day_planning_items')
    .update({
      suggested_post: normalizedSuggestedPost,
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
}): Promise<{ runId: string; scheduledCount: number }> {
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
    throw new Error('Approve at least one day before scheduling.');
  }

  if (run.status === 'scheduled') {
    throw new Error('This workflow run is already scheduled.');
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

  const { data: xAccount } = await supabase
    .from('x_accounts')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!xAccount?.id) {
    throw new Error('Connect X before scheduling this workflow.');
  }

  const scheduleByItemId = params.scheduleByItemId ?? {};
  const nowTimestamp = Date.now();

  const approvedItemsWithSchedule = approvedItems.map((item) => {
    const overrideISO = scheduleByItemId[item.id];
    const scheduledDate = overrideISO
      ? new Date(overrideISO)
      : buildDefaultWorkflowScheduledDate(item.item_date, getWorkflowItemSlotIndex(item.day_label));

    if (Number.isNaN(scheduledDate.getTime())) {
      throw new Error(`Invalid date and time selected for ${item.day_label}.`);
    }

    if (scheduledDate.getTime() <= nowTimestamp) {
      throw new Error(`Pick a future date and time for ${item.day_label}.`);
    }

    return {
      item,
      scheduledDate,
    };
  });

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

  const scheduledRows = approvedItemsWithSchedule.flatMap(({ item, scheduledDate }) => {
    const splitPosts =
      postsPerDay === 2 && multiPostMode !== 'separate_items'
        ? splitWorkflowSuggestedPosts(item.suggested_post).slice(0, 2)
        : [];
    const mediaAttachments = stripPostMediaSignedUrls(
      normalizePostMediaAttachments(item.media_attachments),
    );

    validatePostMediaAttachmentSet(mediaAttachments);

    if (splitPosts.length === 2) {
      return splitPosts.map((content, contentIndex) => {
        const scheduledFor = new Date(scheduledDate);
        scheduledFor.setTime(scheduledFor.getTime() + contentIndex * 3 * 60 * 60 * 1000);

        return {
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
            mediaAttachmentIds: mediaAttachments.map((attachment) => attachment.id),
            pillar: item.pillar,
            postIndex: contentIndex + 1,
            postsPerDay,
            runId: params.runId,
            source: 'workflow_planner',
          },
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

    return [
      {
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
          runId: params.runId,
          source: 'workflow_planner',
        },
        scheduled_for: scheduledFor.toISOString(),
        status: 'scheduled' as const,
        template_id: template.id,
        user_id: user.id,
        x_account_id: xAccount.id,
      },
    ];
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

  scheduledRows.forEach((row, index) => {
    if (!firstTweetIdByItemId.has(row.itemId) && tweetIds[index]) {
      firstTweetIdByItemId.set(row.itemId, tweetIds[index]);
    }
  });

  const itemUpdateResults = await Promise.all(
    approvedItemsWithSchedule.map(({ item }) =>
      supabase
        .from('seven_day_planning_items')
        .update({
          approval_status: 'scheduled',
          generated_tweet_id: firstTweetIdByItemId.get(item.id) ?? null,
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
    runId: params.runId,
    scheduledCount: tweetIds.length,
  };
}
