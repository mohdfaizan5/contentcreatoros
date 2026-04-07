import { createAdminClient } from '@/lib/server-admin';
import { publishTweetWithStoredConnection } from '@/lib/x';

type ScheduledTweetRow = {
  id: string;
  content: string;
  x_account_id: string | null;
};

export type ScheduledTweetDispatchResult = {
  id: string;
  status: 'published' | 'failed' | 'skipped';
  tweetId?: string;
  error?: string;
};

export type DispatchScheduledTweetsOptions = {
  limit?: number;
  tweetIds?: string[];
};

function clampLimit(rawLimit?: number) {
  if (!rawLimit || Number.isNaN(rawLimit)) {
    return 20;
  }

  return Math.min(100, Math.max(1, Math.floor(rawLimit)));
}

export async function dispatchScheduledTweets(
  options: DispatchScheduledTweetsOptions = {},
) {
  const supabase = createAdminClient();
  const limit = clampLimit(options.limit);
  const now = new Date().toISOString();
  const normalizedTweetIds = (options.tweetIds ?? []).filter(Boolean);

  let dueTweetsQuery = supabase
    .from('generated_tweets')
    .select('id, content, x_account_id')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now)
    .not('x_account_id', 'is', null)
    .order('scheduled_for', { ascending: true })
    .limit(limit);

  if (normalizedTweetIds.length > 0) {
    dueTweetsQuery = dueTweetsQuery.in('id', normalizedTweetIds);
  }

  const { data: dueTweets, error } = await dueTweetsQuery;

  if (error) {
    throw new Error(`Unable to load scheduled tweets. ${error.message}`);
  }

  const results: ScheduledTweetDispatchResult[] = [];

  for (const row of (dueTweets ?? []) as ScheduledTweetRow[]) {
    const { data: claimedTweet, error: claimError } = await supabase
      .from('generated_tweets')
      .update({
        status: 'publishing',
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id)
      .eq('status', 'scheduled')
      .select('id')
      .maybeSingle();

    if (claimError) {
      results.push({
        id: row.id,
        status: 'failed',
        error: 'Unable to claim this scheduled tweet for publishing.',
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
        row.x_account_id as string,
        row.content,
      );

      await supabase
        .from('generated_tweets')
        .update({
          published_at: new Date().toISOString(),
          status: 'published',
          x_tweet_id: publishedTweet.id,
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);

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

      await supabase
        .from('generated_tweets')
        .update({
          status: 'failed',
          error_message: message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);

      results.push({
        id: row.id,
        status: 'failed',
        error: message,
      });
    }
  }

  return {
    processed: results.length,
    results,
  };
}
