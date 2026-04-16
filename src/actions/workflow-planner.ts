'use server';

import { parseISO, startOfDay } from 'date-fns';

import { revalidateAppPaths } from '@/lib/revalidate-app-paths';
import { createClient } from '@/lib/server';
import {
  buildDateRange,
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
} from '@/types/database';

type WorkflowRunListOptions = {
  limit?: number;
};

export type WorkflowPlannerRunDetails = {
  run: SevenDayPlanningRun;
  items: SevenDayPlanningItem[];
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

export async function enqueueWorkflowPlannerRun(params: {
  startDateISO: string;
  endDateISO: string;
}): Promise<{ runId: string }> {
  const { supabase, user } = await getAuthenticatedUserAndClient();

  const dates = buildDateRange(params.startDateISO, params.endDateISO);
  const startDateISO = params.startDateISO;
  const endDateISO = params.endDateISO;

  if (!dates.length) {
    throw new Error('Unable to create this workflow run.');
  }

  const { data, error } = await supabase
    .from('seven_day_planning_runs')
    .insert({
      approved_count: 0,
      end_date: endDateISO,
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

  return {
    items: (items ?? []) as SevenDayPlanningItem[],
    run: run as SevenDayPlanningRun,
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
  const existingDraft = toPlannerDraftItem(item as SevenDayPlanningItem);
  const regenerated = await regenerateSevenDayDraftItem({
    brandContext,
    dateISO: item.item_date,
    existingItem: existingDraft,
    note: normalizeDecisionNote(params.note) ?? undefined,
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

  const rows = approvedItems.map((item, index) => {
    const baseDate = startOfDay(parseISO(item.item_date));

    if (Number.isNaN(baseDate.getTime())) {
      throw new Error(`Invalid date in workflow item: ${item.item_date}`);
    }

    baseDate.setUTCHours(14, index * 3, 0, 0);

    const content = (item.suggested_post || `${item.pillar}: ${item.angle}`)
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 280);

    return {
      character_count: content.length,
      content,
      model: run.generation_model ?? 'claude-haiku-4-5',
      prompt_snapshot: {
        angle: item.angle,
        contentType: item.content_type,
        itemId: item.id,
        pillar: item.pillar,
        runId: params.runId,
        source: 'workflow_planner',
      },
      scheduled_for: baseDate.toISOString(),
      status: 'scheduled' as const,
      template_id: template.id,
      user_id: user.id,
      x_account_id: xAccount.id,
    };
  });

  const { data: insertedTweets, error: insertError } = await supabase
    .from('generated_tweets')
    .insert(rows)
    .select('id');

  if (insertError || !insertedTweets?.length) {
    throw new Error('Unable to schedule approved workflow content.');
  }

  const tweetIds = insertedTweets.map((tweet) => tweet.id);

  const itemUpdateResults = await Promise.all(
    approvedItems.map((item, index) =>
      supabase
        .from('seven_day_planning_items')
        .update({
          approval_status: 'scheduled',
          generated_tweet_id: tweetIds[index] ?? null,
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
