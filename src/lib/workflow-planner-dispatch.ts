import { createAdminClient } from '@/lib/server-admin';
import {
  generateSevenDayDraftItems,
  getBrandContextForUser,
} from '@/lib/workflow-planner-ai';

type PlanningRunRow = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  generation_prompt_snapshot: Record<string, unknown>;
  status: 'queued' | 'generating' | 'pending_approval' | 'scheduled' | 'failed' | 'cancelled';
  generation_model: string;
};

type DispatchPlannerOptions = {
  runId?: string;
  source?: string;
};

export type DispatchPlannerCode = 'processed' | 'no-queued-runs' | 'failed';

export type DispatchPlannerSummary = {
  code: DispatchPlannerCode;
  source: string;
  runId: string | null;
  processedRuns: number;
  generatedItems: number;
  error?: string;
};

function normalizeSource(rawSource?: string) {
  const source = rawSource?.trim();
  return source ? source.slice(0, 80) : 'manual';
}

async function claimQueuedRun(supabase: ReturnType<typeof createAdminClient>, runId?: string) {
  const startedAt = new Date().toISOString();

  if (runId) {
    const { data, error } = await supabase
      .from('seven_day_planning_runs')
      .update({
        generation_error: null,
        generation_started_at: startedAt,
        status: 'generating',
      })
      .eq('id', runId)
      .eq('status', 'queued')
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to claim workflow run ${runId}. ${error.message}`);
    }

    return data as PlanningRunRow | null;
  }

  const { data: candidate, error: candidateError } = await supabase
    .from('seven_day_planning_runs')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (candidateError) {
    throw new Error(`Unable to load queued workflow runs. ${candidateError.message}`);
  }

  if (!candidate?.id) {
    return null;
  }

  const { data: claimed, error: claimError } = await supabase
    .from('seven_day_planning_runs')
    .update({
      generation_error: null,
      generation_started_at: startedAt,
      status: 'generating',
    })
    .eq('id', candidate.id)
    .eq('status', 'queued')
    .select('*')
    .maybeSingle();

  if (claimError) {
    throw new Error(`Unable to claim workflow run ${candidate.id}. ${claimError.message}`);
  }

  return claimed as PlanningRunRow | null;
}

export async function dispatchWorkflowPlanningRuns(
  options: DispatchPlannerOptions = {},
): Promise<DispatchPlannerSummary> {
  const supabase = createAdminClient();
  const source = normalizeSource(options.source);

  const claimedRun = await claimQueuedRun(supabase, options.runId);

  if (!claimedRun) {
    return {
      code: 'no-queued-runs',
      generatedItems: 0,
      processedRuns: 0,
      runId: options.runId ?? null,
      source,
    };
  }

  try {
    const brandContext = await getBrandContextForUser(supabase, claimedRun.user_id);
    const promptSnapshot =
      claimedRun.generation_prompt_snapshot &&
      typeof claimedRun.generation_prompt_snapshot === 'object'
        ? claimedRun.generation_prompt_snapshot
        : {};
    const campaignBrief =
      typeof promptSnapshot.campaignBrief === 'string'
        ? promptSnapshot.campaignBrief.trim()
        : '';
    const postsPerDay = promptSnapshot.postsPerDay === 2 ? 2 : 1;
    const items = await generateSevenDayDraftItems({
      brandContext,
      campaignBrief,
      endDateISO: claimedRun.end_date,
      postsPerDay,
      startDateISO: claimedRun.start_date,
    });

    const rows = items.map((item, index) => ({
      angle: item.angle,
      approval_status: 'pending' as const,
      day_index: index,
      day_label: item.dayLabel,
      generated_tweet_id: null,
      item_date: item.dateISO,
      pillar: item.pillar,
      content_type: item.contentType,
      rationale: item.rationale,
      regeneration_count: 0,
      regeneration_history: [],
      run_id: claimedRun.id,
      suggested_post: item.suggestedPost,
      user_id: claimedRun.user_id,
    }));

    const { error: deleteError } = await supabase
      .from('seven_day_planning_items')
      .delete()
      .eq('run_id', claimedRun.id)
      .eq('user_id', claimedRun.user_id);

    if (deleteError) {
      throw new Error(`Unable to clear existing workflow items. ${deleteError.message}`);
    }

    const { error: insertError } = await supabase
      .from('seven_day_planning_items')
      .insert(rows);

    if (insertError) {
      throw new Error(`Unable to persist generated workflow items. ${insertError.message}`);
    }

    const completedAt = new Date().toISOString();
    const { error: updateRunError } = await supabase
      .from('seven_day_planning_runs')
      .update({
        approved_count: 0,
        generation_completed_at: completedAt,
        generation_error: null,
        generation_model: claimedRun.generation_model || 'claude-haiku-4-5',
        generation_prompt_snapshot: {
          ...promptSnapshot,
          campaignBrief,
          generatedAt: completedAt,
          model: claimedRun.generation_model || 'claude-haiku-4-5',
          multiPostMode: 'separate_items',
          postsPerDay,
          source,
        },
        pending_count: rows.length,
        rejected_count: 0,
        status: 'pending_approval',
      })
      .eq('id', claimedRun.id)
      .eq('user_id', claimedRun.user_id);

    if (updateRunError) {
      throw new Error(`Unable to update workflow run completion state. ${updateRunError.message}`);
    }

    return {
      code: 'processed',
      generatedItems: rows.length,
      processedRuns: 1,
      runId: claimedRun.id,
      source,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to process queued workflow run.';

    await supabase
      .from('seven_day_planning_runs')
      .update({
        generation_completed_at: new Date().toISOString(),
        generation_error: message,
        status: 'failed',
      })
      .eq('id', claimedRun.id)
      .eq('user_id', claimedRun.user_id);

    return {
      code: 'failed',
      error: message,
      generatedItems: 0,
      processedRuns: 0,
      runId: claimedRun.id,
      source,
    };
  }
}
