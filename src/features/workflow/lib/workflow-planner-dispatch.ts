import { createAdminClient } from '@/shared/lib/supabase/server-admin';
import {
  generateSevenDayDraftItems,
  getBrandContextForUser,
  type WorkflowCommittedContentSignal,
  type WorkflowPlannerVoiceMode,
} from '@/features/workflow/lib/workflow-planner-ai';

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

async function loadRecentCommittedContent(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);

  const { data, error } = await supabase
    .from('generated_tweets')
    .select('status, scheduled_for, published_at, prompt_snapshot')
    .eq('user_id', userId)
    .in('status', ['scheduled', 'published']);

  if (error) {
    throw new Error(`Unable to load recent committed workflow content. ${error.message}`);
  }

  const recentSignals: WorkflowCommittedContentSignal[] = [];

  for (const row of data ?? []) {
    const promptSnapshot =
      row.prompt_snapshot && typeof row.prompt_snapshot === 'object'
        ? (row.prompt_snapshot as Record<string, unknown>)
        : null;
    const coreClaim =
      promptSnapshot && typeof promptSnapshot.coreClaim === 'string'
        ? promptSnapshot.coreClaim.trim()
        : '';
    const angle =
      promptSnapshot && typeof promptSnapshot.angle === 'string'
        ? promptSnapshot.angle.trim()
        : '';
    const committedAt =
      row.status === 'published' ? row.published_at ?? null : row.scheduled_for ?? null;

    if (!coreClaim || !committedAt) {
      continue;
    }

    const committedDate = new Date(committedAt);

    if (Number.isNaN(committedDate.getTime()) || committedDate.getTime() < cutoff.getTime()) {
      continue;
    }

    recentSignals.push({
      angle,
      coreClaim,
      publishedOrScheduledAt: committedAt,
    });
  }

  return recentSignals
    .sort((left, right) => right.publishedOrScheduledAt.localeCompare(left.publishedOrScheduledAt))
    .slice(0, 12);
}

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
    const recentCommittedContent = await loadRecentCommittedContent(
      supabase,
      claimedRun.user_id,
    );
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
    const voiceMode: WorkflowPlannerVoiceMode =
      promptSnapshot.voiceMode === 'corporate' ? 'corporate' : 'human';
    const items = await generateSevenDayDraftItems({
      brandContext,
      campaignBrief,
      endDateISO: claimedRun.end_date,
      postsPerDay,
      recentCommittedContent,
      startDateISO: claimedRun.start_date,
      voiceMode,
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
      core_claim: item.coreClaim,
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
          freshnessLookbackDays: 14,
          model: claimedRun.generation_model || 'claude-haiku-4-5',
          multiPostMode: 'separate_items',
          postsPerDay,
          source,
          voiceMode,
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
