'use server';

import { createClient } from '@/shared/lib/supabase/server';
import {
  publishTweetWithStoredConnection,
  getAuthenticatedXUser,
} from '@/features/x/lib/x';
import {
  ensureStoredXAccessToken,
  hasStoredXConnectionForCurrentUser,
} from '@/features/x/lib/x-auth';
import { generateBrandTweet, X_CHARACTER_LIMIT } from '@/features/inspiration/lib/brand-tweets';
import { buildTweetIntentUrl } from '@/features/x/lib/x-intent';
import { revalidateAppPaths } from '@/features/inspiration/lib/revalidate-app-paths';
import type { GeneratedTweet, Template, XAccount } from '@/shared/types/database';
import type { CalendarEventInput, EventColor } from '@/shared/components/types';

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

async function getAccessibleTemplate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  templateId: string,
) {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .or(`user_id.eq.${userId},is_public.eq.true`)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Unable to find that template.');
  }

  return data as Template;
}

export async function getGeneratedTweetsForTemplate(templateId: string): Promise<GeneratedTweet[]> {
  const { supabase, user } = await getAuthenticatedUserAndClient();
  const { data, error } = await supabase
    .from('generated_tweets')
    .select('*')
    .eq('template_id', templateId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(8);

  if (error) {
    return [];
  }

  return (data ?? []) as GeneratedTweet[];
}

function getCalendarEventColor(status: GeneratedTweet['status']): EventColor {
  switch (status) {
    case 'published':
      return 'emerald';
    case 'failed':
      return 'rose';
    case 'publishing':
      return 'amber';
    case 'scheduled':
    default:
      return 'sky';
  }
}

function getCalendarAnchorDate(tweet: GeneratedTweet) {
  if (tweet.status === 'published') {
    return tweet.published_at;
  }

  return tweet.scheduled_for ?? tweet.updated_at;
}

type CalendarXAccountProfile = {
  avatarUrl: string | null;
  id: string;
  name: string | null;
  role: XAccount['account_role'];
  username: string;
};

async function loadCalendarXAccountProfiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  accountIds: string[],
) {
  if (!accountIds.length) {
    return new Map<string, CalendarXAccountProfile>();
  }

  const { data, error } = await supabase
    .from('x_accounts')
    .select('id, user_id, account_role, username')
    .eq('user_id', userId)
    .in('id', accountIds);

  if (error || !data?.length) {
    return new Map<string, CalendarXAccountProfile>();
  }

  const profiles = await Promise.all(
    (data as Pick<XAccount, 'id' | 'account_role' | 'username' | 'user_id'>[]).map(
      async (account) => {
        try {
          const accessToken = await ensureStoredXAccessToken(account.id);
          const profile = await getAuthenticatedXUser(accessToken);

          return [
            account.id,
            {
              avatarUrl: profile.profile_image_url ?? null,
              id: account.id,
              name: profile.name || account.username,
              role: account.account_role,
              username: profile.username || account.username,
            } satisfies CalendarXAccountProfile,
          ] as const;
        } catch {
          return [
            account.id,
            {
              avatarUrl: null,
              id: account.id,
              name: account.username,
              role: account.account_role,
              username: account.username,
            } satisfies CalendarXAccountProfile,
          ] as const;
        }
      },
    ),
  );

  return new Map<string, CalendarXAccountProfile>(profiles);
}

export async function getGeneratedTweetCalendarEvents(): Promise<CalendarEventInput[]> {
  const { supabase, user } = await getAuthenticatedUserAndClient();
  const { data, error } = await supabase
    .from('generated_tweets')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['scheduled', 'publishing', 'published', 'failed'])
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error || !data?.length) {
    return [];
  }

  const tweets = data as GeneratedTweet[];
  const uniqueAccountIds = Array.from(
    new Set(
      tweets
        .map((tweet) => tweet.x_account_id)
        .filter((accountId): accountId is string => Boolean(accountId)),
    ),
  );
  const xAccountProfiles = await loadCalendarXAccountProfiles(
    supabase,
    user.id,
    uniqueAccountIds,
  );

  const events = tweets.flatMap(
    (tweet): CalendarEventInput[] => {
      const anchorDate = getCalendarAnchorDate(tweet);

      if (!anchorDate) {
        return [];
      }

      const start = new Date(anchorDate);

      if (Number.isNaN(start.getTime())) {
        return [];
      }

      const end = new Date(start.getTime() + 30 * 60 * 1000);
      const accountProfile = tweet.x_account_id
        ? xAccountProfiles.get(tweet.x_account_id) ?? null
        : null;

      return [
        {
          color: getCalendarEventColor(tweet.status),
          description: tweet.content,
          end: end.toISOString(),
          id: tweet.id,
          location: 'X',
          metadata: {
            errorMessage: tweet.error_message,
            generatedTweetStatus: tweet.status,
            scheduledFor: tweet.scheduled_for,
            source: 'generated_tweet',
            xAccountAvatarUrl: accountProfile?.avatarUrl ?? null,
            xAccountId: tweet.x_account_id,
            xAccountName: accountProfile?.name ?? null,
            xAccountRole: accountProfile?.role ?? null,
            xAccountUsername: accountProfile?.username ?? null,
          },
          start: start.toISOString(),
          // title: getCalendarTitle(tweet.content, tweet.status),
          title: tweet.content,
          tweetContent: tweet.content,
          tweetStatus: tweet.status,
        },
      ];
    },
  );

  return events.sort(
    (left, right) =>
      new Date(left.start).getTime() - new Date(right.start).getTime(),
  );
}

export async function generateTweetFromTemplate(templateId: string) {
  const { supabase, user } = await getAuthenticatedUserAndClient();
  const template = await getAccessibleTemplate(supabase, user.id, templateId);

  if (template.platform_type !== 'x') {
    throw new Error('Brand tweet generation is currently only available for X templates.');
  }

  const { data: onboardingRows, error: onboardingError } = await supabase
    .from('onboarding_answers')
    .select('question_key, answer')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (onboardingError || !onboardingRows?.length) {
    throw new Error('Complete onboarding first so the AI has enough brand context.');
  }

  const generation = await generateBrandTweet({
    onboardingRows,
    template,
  });

  const { data: generatedTweet, error } = await supabase
    .from('generated_tweets')
    .insert({
      user_id: user.id,
      template_id: template.id,
      content: generation.text,
      character_count: generation.text.length,
      status: 'draft',
      model: 'claude-haiku-4-5',
      prompt_snapshot: {
        brandSummary: generation.brandSummary,
        prompt: generation.prompt,
        systemPrompt: generation.systemPrompt,
        templateId: template.id,
      },
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error || !generatedTweet) {
    throw new Error('Unable to save the generated tweet.');
  }

  revalidateAppPaths(['/templates', `/templates/${template.id}`]);

  return {
    generatedTweet: generatedTweet as GeneratedTweet,
    intentUrl: buildTweetIntentUrl(generation.text),
    maxLength: X_CHARACTER_LIMIT,
  };
}

export async function scheduleGeneratedTweet({
  generatedTweetId,
  scheduledFor,
  xAccountId,
}: {
  generatedTweetId: string;
  scheduledFor: string;
  xAccountId?: string;
}) {
  const { supabase, user } = await getAuthenticatedUserAndClient();
  const scheduleDate = new Date(scheduledFor);

  if (Number.isNaN(scheduleDate.getTime())) {
    throw new Error('Select a valid date and time.');
  }

  if (scheduleDate.getTime() <= Date.now()) {
    throw new Error('Scheduled time must be in the future.');
  }

  const { data: existingTweet, error: existingTweetError } = await supabase
    .from('generated_tweets')
    .select('id, status, template_id, x_account_id')
    .eq('id', generatedTweetId)
    .eq('user_id', user.id)
    .single();

  if (existingTweetError || !existingTweet) {
    throw new Error('Unable to find this generated tweet.');
  }

  if (existingTweet.status === 'published') {
    throw new Error('This tweet has already been published.');
  }

  if (existingTweet.status === 'publishing') {
    throw new Error('This tweet is currently being published. Try again in a moment.');
  }

  const resolvedAccountId = xAccountId ?? existingTweet.x_account_id ?? null;

  if (!resolvedAccountId) {
    throw new Error('Choose a founder or company X account before scheduling this tweet.');
  }

  const { data: xAccount, error: xAccountError } = await supabase
    .from('x_accounts')
    .select('id, account_role, refresh_token, expires_at')
    .eq('id', resolvedAccountId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (xAccountError || !xAccount) {
    throw new Error('Connect X again before scheduling tweets for automatic publishing.');
  }

  if (!xAccount.account_role) {
    throw new Error('Reconnect this X account into the founder or company slot before scheduling.');
  }

  const accountExpiresAt = xAccount.expires_at
    ? new Date(xAccount.expires_at).getTime()
    : null;

  if (
    !xAccount.refresh_token &&
    accountExpiresAt !== null &&
    accountExpiresAt <= scheduleDate.getTime() + 60_000
  ) {
    throw new Error(
      'Reconnect X before scheduling this post so it can still publish when your current token expires.',
    );
  }

  const { data: generatedTweet, error: generatedTweetError } = await supabase
    .from('generated_tweets')
    .update({
      x_account_id: xAccount.id,
      scheduled_for: scheduleDate.toISOString(),
      status: 'scheduled',
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', generatedTweetId)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (generatedTweetError || !generatedTweet) {
    throw new Error('Unable to schedule this tweet.');
  }

  revalidateAppPaths(['/templates', `/templates/${existingTweet.template_id}`]);

  return generatedTweet as GeneratedTweet;
}

export async function publishGeneratedTweetNow(
  generatedTweetId: string,
  xAccountId?: string,
) {
  const { supabase, user } = await getAuthenticatedUserAndClient();

  const { data: existingTweet, error: existingTweetError } = await supabase
    .from('generated_tweets')
    .select('*')
    .eq('id', generatedTweetId)
    .eq('user_id', user.id)
    .single();

  if (existingTweetError || !existingTweet) {
    throw new Error('Unable to find this generated tweet.');
  }

  const tweet = existingTweet as GeneratedTweet;

  if (tweet.status === 'published') {
    throw new Error('This tweet has already been published.');
  }

  if (tweet.status === 'publishing') {
    throw new Error('This tweet is already being published.');
  }

  const resolvedAccountId = xAccountId ?? tweet.x_account_id ?? null;

  if (!resolvedAccountId) {
    throw new Error('Choose a founder or company X account before publishing through the API.');
  }

  const { data: xAccount, error: xAccountError } = await supabase
    .from('x_accounts')
    .select('id, account_role')
    .eq('id', resolvedAccountId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (xAccountError || !xAccount?.id) {
    throw new Error('Connect X again before publishing tweets through the API.');
  }

  if (!xAccount.account_role) {
    throw new Error('Reconnect this X account into the founder or company slot before publishing.');
  }

  await supabase
    .from('generated_tweets')
    .update({
      status: 'publishing',
      error_message: null,
      x_account_id: resolvedAccountId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', generatedTweetId)
    .eq('user_id', user.id);

  try {
    const publishedTweet = await publishTweetWithStoredConnection(
      resolvedAccountId,
      tweet.content,
      tweet.media_attachments,
    );

    const { data: updatedTweet, error: updatedTweetError } = await supabase
      .from('generated_tweets')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        scheduled_for: null,
        x_tweet_id: publishedTweet.id,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', generatedTweetId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (updatedTweetError || !updatedTweet) {
      throw new Error('Tweet was sent to X, but we could not update its status locally.');
    }

    revalidateAppPaths(['/templates', `/templates/${updatedTweet.template_id}`]);

    return updatedTweet as GeneratedTweet;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to publish this tweet through the API.';

    await supabase
      .from('generated_tweets')
      .update({
        status: 'failed',
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', generatedTweetId)
      .eq('user_id', user.id);

    throw new Error(message);
  }
}

export async function getCanAutoScheduleTweets() {
  return hasStoredXConnectionForCurrentUser();
}
