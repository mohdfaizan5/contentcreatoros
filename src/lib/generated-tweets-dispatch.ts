import { createAdminClient } from '@/lib/server-admin';
import { publishTweetWithStoredConnection } from '@/lib/x';
import type { ScheduledDispatchRunStatus } from '@/types/database';

type ScheduledTweetRow = {
  id: string;
  content: string;
  user_id: string;
  x_account_id: string | null;
};

type DispatchRunLogPayload = {
  dispatchRunId?: string;
  source: string;
  requestTarget?: string;
  requestPayload?: Record<string, unknown>;
  status: ScheduledDispatchRunStatus;
  workerStartedAt?: string | null;
  workerCompletedAt?: string | null;
  httpStatus?: number | null;
  processedCount?: number;
  publishedCount?: number;
  failedCount?: number;
  skippedCount?: number;
  topLevelError?: string | null;
  results?: unknown[];
  pgNetRequestId?: number | null;
};

export type ScheduledTweetDispatchResult = {
  id: string;
  status: 'published' | 'failed' | 'skipped';
  tweetId?: string;
  error?: string;
};

export type DispatchScheduledTweetsCode =
  | 'no-due-tweets'
  | 'published'
  | 'failed';

export type DispatchScheduledTweetsOptions = {
  dispatchRunId?: string;
  limit?: number;
  requestPayload?: Record<string, unknown>;
  requestTarget?: string;
  source?: string;
  tweetIds?: string[];
};

export type DispatchScheduledTweetsSummary = {
  code: DispatchScheduledTweetsCode;
  dispatchRunId: string;
  error?: string;
  failedCount: number;
  httpStatus: number;
  processed: number;
  publishedCount: number;
  results: ScheduledTweetDispatchResult[];
  skippedCount: number;
  source: string;
};

function clampLimit(rawLimit?: number) {
  if (!rawLimit || Number.isNaN(rawLimit)) {
    return 20;
  }

  return Math.min(100, Math.max(1, Math.floor(rawLimit)));
}

function normalizeSource(rawSource?: string) {
  const cleanedSource = rawSource?.trim();
  return cleanedSource ? cleanedSource.slice(0, 80) : 'manual';
}

function buildRequestPayload(
  source: string,
  limit: number,
  tweetIds: string[],
  requestPayload?: Record<string, unknown>,
) {
  return {
    limit,
    source,
    tweetIds,
    ...(requestPayload ?? {}),
  };
}

async function writeDispatchRunLog(
  supabase: ReturnType<typeof createAdminClient>,
  payload: DispatchRunLogPayload,
) {
  const row = {
    failed_count: payload.failedCount ?? 0,
    http_status: payload.httpStatus ?? null,
    pg_net_request_id: payload.pgNetRequestId ?? null,
    processed_count: payload.processedCount ?? 0,
    published_count: payload.publishedCount ?? 0,
    request_payload: payload.requestPayload ?? {},
    request_target: payload.requestTarget ?? null,
    results: payload.results ?? [],
    skipped_count: payload.skippedCount ?? 0,
    status: payload.status,
    top_level_error: payload.topLevelError ?? null,
    trigger_source: payload.source,
    worker_completed_at: payload.workerCompletedAt ?? null,
    worker_started_at: payload.workerStartedAt ?? null,
    ...(payload.dispatchRunId ? { id: payload.dispatchRunId } : {}),
  };

  const query = payload.dispatchRunId
    ? supabase
        .from('scheduled_dispatch_runs')
        .upsert(row, { onConflict: 'id' })
        .select('id')
        .single()
    : supabase
        .from('scheduled_dispatch_runs')
        .insert(row)
        .select('id')
        .single();

  const { data, error } = await query;

  if (error || !data?.id) {
    throw new Error('Unable to record the scheduled dispatch run.');
  }

  return data.id as string;
}

function createSummary(
  payload: Omit<DispatchScheduledTweetsSummary, 'results'> & {
    results?: ScheduledTweetDispatchResult[];
  },
) {
  return {
    ...payload,
    results: payload.results ?? [],
  } satisfies DispatchScheduledTweetsSummary;
}

export async function recordScheduledDispatchRun(payload: DispatchRunLogPayload) {
  const supabase = createAdminClient();
  return writeDispatchRunLog(supabase, payload);
}

export async function dispatchScheduledTweets(
  options: DispatchScheduledTweetsOptions = {},
) {
  const supabase = createAdminClient();
  const limit = clampLimit(options.limit);
  const now = new Date().toISOString();
  const normalizedTweetIds = Array.from(
    new Set((options.tweetIds ?? []).filter(Boolean)),
  );
  const source = normalizeSource(options.source);
  const requestPayload = buildRequestPayload(
    source,
    limit,
    normalizedTweetIds,
    options.requestPayload,
  );

  const dispatchRunId = await writeDispatchRunLog(supabase, {
    dispatchRunId: options.dispatchRunId,
    requestPayload,
    requestTarget: options.requestTarget,
    source,
    status: 'running',
    workerStartedAt: now,
  });

  try {
    const fallbackAccountByUserId = new Map<string, string | null>();

    const resolveFallbackAccountId = async (userId: string) => {
      if (fallbackAccountByUserId.has(userId)) {
        return fallbackAccountByUserId.get(userId) ?? null;
      }

      const { data: fallbackAccount, error: fallbackAccountError } = await supabase
        .from('x_accounts')
        .select('id')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackAccountError) {
        throw new Error(
          `Unable to resolve a connected X account for user ${userId}. ${fallbackAccountError.message}`,
        );
      }

      const fallbackAccountId = fallbackAccount?.id ?? null;
      fallbackAccountByUserId.set(userId, fallbackAccountId);
      return fallbackAccountId;
    };

    let dueTweetsQuery = supabase
      .from('generated_tweets')
      .select('id, content, user_id, x_account_id')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(limit);

    if (normalizedTweetIds.length > 0) {
      dueTweetsQuery = dueTweetsQuery.in('id', normalizedTweetIds);
    }

    const { data: dueTweets, error } = await dueTweetsQuery;

    if (error) {
      const summary = createSummary({
        code: 'failed',
        dispatchRunId,
        error: `Unable to load scheduled tweets. ${error.message}`,
        failedCount: 0,
        httpStatus: 500,
        processed: 0,
        publishedCount: 0,
        skippedCount: 0,
        source,
      });

      await writeDispatchRunLog(supabase, {
        dispatchRunId,
        failedCount: summary.failedCount,
        httpStatus: summary.httpStatus,
        processedCount: summary.processed,
        publishedCount: summary.publishedCount,
        requestPayload,
        requestTarget: options.requestTarget,
        results: summary.results,
        skippedCount: summary.skippedCount,
        source,
        status: 'failed',
        topLevelError: summary.error,
        workerCompletedAt: new Date().toISOString(),
        workerStartedAt: now,
      });

      return summary;
    }

    const results: ScheduledTweetDispatchResult[] = [];

    for (const row of (dueTweets ?? []) as ScheduledTweetRow[]) {
      let accountId = row.x_account_id;

      if (!accountId) {
        try {
          accountId = await resolveFallbackAccountId(row.user_id);
        } catch (accountLookupError) {
          const message =
            accountLookupError instanceof Error
              ? accountLookupError.message
              : 'Unable to resolve an X account for scheduled publishing.';

          await supabase
            .from('generated_tweets')
            .update({
              error_message: message,
              status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', row.id)
            .eq('status', 'scheduled');

          results.push({
            error: message,
            id: row.id,
            status: 'failed',
          });
          continue;
        }
      }

      if (!accountId) {
        const message =
          'Missing x_account_id for this scheduled tweet and no connected X account was found. Reconnect X and reschedule this post.';

        await supabase
          .from('generated_tweets')
          .update({
            error_message: message,
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id)
          .eq('status', 'scheduled');

        results.push({
          error: message,
          id: row.id,
          status: 'failed',
        });
        continue;
      }

      const { data: claimedTweet, error: claimError } = await supabase
        .from('generated_tweets')
        .update({
          error_message: null,
          status: 'publishing',
          updated_at: new Date().toISOString(),
          x_account_id: accountId,
        })
        .eq('id', row.id)
        .eq('status', 'scheduled')
        .select('id')
        .maybeSingle();

      if (claimError) {
        results.push({
          error: 'Unable to claim this scheduled tweet for publishing.',
          id: row.id,
          status: 'failed',
        });
        continue;
      }

      if (!claimedTweet) {
        results.push({
          id: row.id,
          status: 'skipped',
        });
        continue;
      }

      try {
        const publishedTweet = await publishTweetWithStoredConnection(
          accountId,
          row.content,
        );

        const { error: publishUpdateError } = await supabase
          .from('generated_tweets')
          .update({
            error_message: null,
            published_at: new Date().toISOString(),
            scheduled_for: null,
            status: 'published',
            updated_at: new Date().toISOString(),
            x_tweet_id: publishedTweet.id,
          })
          .eq('id', row.id);

        if (publishUpdateError) {
          throw new Error(
            `Tweet published on X but local status update failed. ${publishUpdateError.message}`,
          );
        }

        results.push({
          id: row.id,
          status: 'published',
          tweetId: publishedTweet.id,
        });
      } catch (publishError) {
        const message =
          publishError instanceof Error
            ? publishError.message
            : 'Unable to publish the scheduled tweet.';

        const { error: failedUpdateError } = await supabase
          .from('generated_tweets')
          .update({
            error_message: message,
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);

        if (failedUpdateError) {
          results.push({
            error: `${message} Also failed to persist failure status: ${failedUpdateError.message}`,
            id: row.id,
            status: 'failed',
          });
          continue;
        }

        results.push({
          error: message,
          id: row.id,
          status: 'failed',
        });
      }
    }

    const publishedCount = results.filter(
      (result) => result.status === 'published',
    ).length;
    const failedCount = results.filter(
      (result) => result.status === 'failed',
    ).length;
    const skippedCount = results.filter(
      (result) => result.status === 'skipped',
    ).length;
    const processed = results.length;
    const code: DispatchScheduledTweetsCode =
      processed === 0 ? 'no-due-tweets' : failedCount > 0 ? 'failed' : 'published';
    const httpStatus = code === 'failed' ? 500 : 200;
    const errorMessage =
      code === 'failed'
        ? `${failedCount} scheduled tweet${failedCount === 1 ? '' : 's'} failed during dispatch.`
        : undefined;

    const summary = createSummary({
      code,
      dispatchRunId,
      error: errorMessage,
      failedCount,
      httpStatus,
      processed,
      publishedCount,
      results,
      skippedCount,
      source,
    });

    await writeDispatchRunLog(supabase, {
      dispatchRunId,
      failedCount,
      httpStatus,
      processedCount: processed,
      publishedCount,
      requestPayload,
      requestTarget: options.requestTarget,
      results,
      skippedCount,
      source,
      status: failedCount > 0 ? 'completed_with_failures' : 'completed',
      topLevelError: errorMessage ?? null,
      workerCompletedAt: new Date().toISOString(),
      workerStartedAt: now,
    });

    return summary;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to dispatch scheduled tweets.';

    const summary = createSummary({
      code: 'failed',
      dispatchRunId,
      error: message,
      failedCount: 0,
      httpStatus: 500,
      processed: 0,
      publishedCount: 0,
      skippedCount: 0,
      source,
    });

    await writeDispatchRunLog(supabase, {
      dispatchRunId,
      failedCount: summary.failedCount,
      httpStatus: summary.httpStatus,
      processedCount: summary.processed,
      publishedCount: summary.publishedCount,
      requestPayload,
      requestTarget: options.requestTarget,
      results: summary.results,
      skippedCount: summary.skippedCount,
      source,
      status: 'failed',
      topLevelError: message,
      workerCompletedAt: new Date().toISOString(),
      workerStartedAt: now,
    });

    return summary;
  }
}
