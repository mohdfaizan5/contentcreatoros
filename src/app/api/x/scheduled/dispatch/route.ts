import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/server-admin';
import { publishTweetWithStoredConnection } from '@/lib/x';

function isAuthorizedDispatchRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get('authorization')?.trim();
  const hasVercelCronHeader = Boolean(request.headers.get('x-vercel-cron'));

  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }

  if (process.env.VERCEL) {
    return hasVercelCronHeader;
  }

  return process.env.NODE_ENV !== 'production';
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedDispatchRequest(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  let supabase;

  try {
    supabase = createAdminClient();
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Admin client is not configured.',
      },
      { status: 500 },
    );
  }

  const now = new Date().toISOString();
  const { data: dueTweets, error } = await supabase
    .from('generated_tweets')
    .select('id, content, x_account_id')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now)
    .not('x_account_id', 'is', null)
    .order('scheduled_for', { ascending: true })
    .limit(20);

  if (error) {
    return Response.json(
      {
        error: 'Unable to load scheduled tweets.',
        details: error.message,
      },
      { status: 500 },
    );
  }

  const results: Array<{ id: string; status: string; tweetId?: string; error?: string }> = [];

  for (const tweet of dueTweets ?? []) {
    const { data: claimedTweet, error: claimError } = await supabase
      .from('generated_tweets')
      .update({
        status: 'publishing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', tweet.id)
      .eq('status', 'scheduled')
      .select('id')
      .maybeSingle();

    if (claimError) {
      results.push({
        id: tweet.id,
        status: 'failed',
        error: 'Unable to claim this scheduled tweet for publishing.',
      });
      continue;
    }

    if (!claimedTweet) {
      results.push({
        id: tweet.id,
        status: 'skipped',
      });
      continue;
    }

    try {
      const publishedTweet = await publishTweetWithStoredConnection(
        tweet.x_account_id as string,
        tweet.content,
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
        .eq('id', tweet.id);

      results.push({
        id: tweet.id,
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
        .eq('id', tweet.id);

      results.push({
        id: tweet.id,
        status: 'failed',
        error: message,
      });
    }
  }

  return Response.json({
    processed: results.length,
    results,
  });
}
