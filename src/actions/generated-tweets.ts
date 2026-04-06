'use server';

import { createClient } from '@/lib/server';
import {
  hasStoredXConnectionForCurrentUser,
  publishTweetWithStoredConnection,
} from '@/lib/x';
import { generateBrandTweet, X_CHARACTER_LIMIT } from '@/lib/brand-tweets';
import { buildTweetIntentUrl } from '@/lib/x-intent';
import { revalidateAppPaths } from '@/lib/revalidate-app-paths';
import type { GeneratedTweet, Template } from '@/types/database';
import type { CalendarEventInput, EventColor } from '@/components/types';

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

async function getOwnedTemplate(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, templateId: string) {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .eq('user_id', userId)
    .single();

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

function getCalendarTitle(content: string, status: GeneratedTweet['status']) {
  const prefix =
    status === 'published'
      ? 'Posted on X'
      : status === 'failed'
        ? 'Failed X post'
        : status === 'publishing'
          ? 'Publishing on X'
          : 'Scheduled for X';
  const preview = content.trim().replace(/\s+/g, ' ');

  if (!preview) {
    return prefix;
  }

  const shortenedPreview =
    preview.length > 56 ? `${preview.slice(0, 53).trimEnd()}...` : preview;

  return `${prefix}: ${shortenedPreview}`;
}

function buildCalendarDescription(tweet: GeneratedTweet) {
  const statusLine =
    tweet.status === 'published'
      ? 'Published to X'
      : tweet.status === 'failed'
        ? 'Publishing failed'
        : tweet.status === 'publishing'
          ? 'Publishing in progress'
          : 'Scheduled for automatic publishing';

  return tweet.error_message
    ? `${statusLine}\n\n${tweet.content}\n\nError: ${tweet.error_message}`
    : `${statusLine}\n\n${tweet.content}`;
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

  return (data as GeneratedTweet[])
    .map((tweet) => {
      const anchorDate = getCalendarAnchorDate(tweet);

      if (!anchorDate) {
        return null;
      }

      const start = new Date(anchorDate);

      if (Number.isNaN(start.getTime())) {
        return null;
      }

      const end = new Date(start.getTime() + 30 * 60 * 1000);

      return {
        color: getCalendarEventColor(tweet.status),
        description: buildCalendarDescription(tweet),
        end: end.toISOString(),
        id: tweet.id,
        location: 'X',
        start: start.toISOString(),
        title: getCalendarTitle(tweet.content, tweet.status),
      } satisfies CalendarEventInput;
    })
    .filter((event): event is CalendarEventInput => event !== null)
    .sort(
      (left, right) =>
        new Date(left.start).getTime() - new Date(right.start).getTime(),
    );
}

export async function generateTweetFromTemplate(templateId: string) {
  const { supabase, user } = await getAuthenticatedUserAndClient();
  const template = await getOwnedTemplate(supabase, user.id, templateId);

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
}: {
  generatedTweetId: string;
  scheduledFor: string;
}) {
  const { supabase, user } = await getAuthenticatedUserAndClient();
  const scheduleDate = new Date(scheduledFor);

  if (Number.isNaN(scheduleDate.getTime())) {
    throw new Error('Select a valid date and time.');
  }

  if (scheduleDate.getTime() <= Date.now()) {
    throw new Error('Scheduled time must be in the future.');
  }

  const { data: xAccount, error: xAccountError } = await supabase
    .from('x_accounts')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (xAccountError || !xAccount) {
    throw new Error('Connect X again before scheduling tweets for automatic publishing.');
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

  revalidateAppPaths(['/templates', `/templates/${generatedTweet.template_id}`]);

  return generatedTweet as GeneratedTweet;
}

export async function publishGeneratedTweetNow(generatedTweetId: string) {
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

  let xAccountId = tweet.x_account_id;

  if (!xAccountId) {
    const { data: xAccount, error: xAccountError } = await supabase
      .from('x_accounts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (xAccountError || !xAccount) {
      throw new Error('Connect X again before publishing tweets through the API.');
    }

    xAccountId = xAccount.id;
  }

  await supabase
    .from('generated_tweets')
    .update({
      status: 'publishing',
      error_message: null,
      x_account_id: xAccountId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', generatedTweetId)
    .eq('user_id', user.id);

  try {
    const publishedTweet = await publishTweetWithStoredConnection(xAccountId, tweet.content);

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
