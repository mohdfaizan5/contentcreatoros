'use server';

import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
  subDays,
} from 'date-fns';

import { ONBOARDING_FLOW_KEY } from '@/lib/onboarding';
import { revalidateAppPaths } from '@/lib/revalidate-app-paths';
import { createClient } from '@/lib/server';
import { getAuthenticatedUserTweets, getAuthenticatedXUser } from '@/lib/x';
import type { GeneratedTweetStatus } from '@/types/database';

export interface DashboardSnapshot {
  score: number;
  scoreLabel: string;
  followersCount: number | null;
  scheduledUpcomingCount: number;
  publishedLast7DaysCount: number;
  engagementLast7DaysCount: number;
  nextScheduledAt: string | null;
  activityAlerts: string[];
}

export type SevenDayPlanItemStatus = 'pending' | 'approved';

export interface SevenDayPlanItem {
  id: string;
  dateISO: string;
  dayLabel: string;
  pillar: string;
  contentType: string;
  angle: string;
  rationale: string;
  suggestedPost: string;
  status: SevenDayPlanItemStatus;
}

type OnboardingAnswerRow = {
  question_key: string;
  answer: unknown;
};

type RawPlanItem = {
  pillar?: string;
  contentType?: string;
  angle?: string;
  rationale?: string;
  suggestedPost?: string;
};

function toIsoDateString(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function normalizeText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .join(', ');
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const combined = [normalizeText(record.value), normalizeText(record.otherText)]
      .filter(Boolean)
      .join(', ');

    return combined;
  }

  return '';
}

function extractJsonArray(rawText: string): RawPlanItem[] | null {
  const firstBracket = rawText.indexOf('[');
  const lastBracket = rawText.lastIndexOf(']');

  if (firstBracket < 0 || lastBracket <= firstBracket) {
    return null;
  }

  const candidate = rawText.slice(firstBracket, lastBracket + 1);

  try {
    const parsed = JSON.parse(candidate) as unknown;

    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed as RawPlanItem[];
  } catch {
    return null;
  }
}

function extractJsonObject(rawText: string): RawPlanItem | null {
  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');

  if (firstBrace < 0 || lastBrace <= firstBrace) {
    return null;
  }

  const candidate = rawText.slice(firstBrace, lastBrace + 1);

  try {
    const parsed = JSON.parse(candidate) as unknown;

    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      return null;
    }

    return parsed as RawPlanItem;
  } catch {
    return null;
  }
}

function buildDateRange(startDateISO: string, endDateISO: string) {
  const start = startOfDay(parseISO(startDateISO));
  const end = startOfDay(parseISO(endDateISO));

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Choose a valid date range.');
  }

  const dayCount = differenceInCalendarDays(end, start) + 1;

  if (dayCount !== 7) {
    throw new Error('Select exactly 7 days to generate this plan.');
  }

  return Array.from({ length: 7 }, (_, index) => {
    const nextDate = new Date(start);
    nextDate.setDate(start.getDate() + index);
    return nextDate;
  });
}

function mapPlanItems(
  dates: Date[],
  rawPlanItems: RawPlanItem[] | null,
  fallbackPillars: string[],
): SevenDayPlanItem[] {
  return dates.map((date, index) => {
    const rawItem = rawPlanItems?.[index];
    const fallbackPillar = fallbackPillars[index % fallbackPillars.length];

    return {
      id: `${toIsoDateString(date)}-${index + 1}`,
      dateISO: toIsoDateString(date),
      dayLabel: format(date, 'EEE, MMM d'),
      pillar: normalizeText(rawItem?.pillar) || fallbackPillar,
      contentType: normalizeText(rawItem?.contentType) || 'Single post',
      angle:
        normalizeText(rawItem?.angle) ||
        `Share one practical insight that supports your ${fallbackPillar.toLowerCase()} pillar.`,
      rationale:
        normalizeText(rawItem?.rationale) ||
        'Fits your weekly cadence and keeps variety across the 7-day plan.',
      suggestedPost:
        normalizeText(rawItem?.suggestedPost) ||
        `${fallbackPillar}: practical insight with a clear takeaway and one soft CTA.`,
      status: 'pending',
    };
  });
}

async function getBrandContext(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('onboarding_answers')
    .select('question_key, answer')
    .eq('user_id', userId)
    .eq('flow_key', ONBOARDING_FLOW_KEY);

  if (error || !data?.length) {
    return 'Brand context not available yet. Use a balanced voice and practical B2B creator focus.';
  }

  const rows = data as OnboardingAnswerRow[];
  const answerMap = new Map(rows.map((row) => [row.question_key, normalizeText(row.answer)]));

  const contextParts = [
    ['Company', answerMap.get('company_description')],
    ['Problem solved', answerMap.get('problem_solved')],
    ['Audience', answerMap.get('target_audience')],
    ['Tone', answerMap.get('tone')],
    ['Writing style', answerMap.get('writing_style')],
    ['Goals', answerMap.get('content_goals')],
    ['Content pillars', answerMap.get('content_pillars')],
    ['Formats', answerMap.get('content_formats')],
    ['Unique value proposition', answerMap.get('unique_value_prop')],
  ]
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => `${label}: ${value}`);

  if (!contextParts.length) {
    return 'Brand context not available yet. Use a balanced voice and practical B2B creator focus.';
  }

  return contextParts.join('\n');
}

function getScoreLabel(score: number) {
  if (score >= 80) {
    return 'Excellent consistency';
  }

  if (score >= 60) {
    return 'Good momentum';
  }

  if (score >= 40) {
    return 'Needs attention';
  }

  return 'At risk';
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      score: 0,
      scoreLabel: 'At risk',
      followersCount: null,
      scheduledUpcomingCount: 0,
      publishedLast7DaysCount: 0,
      engagementLast7DaysCount: 0,
      nextScheduledAt: null,
      activityAlerts: ['Sign in to load your dashboard health.'],
    };
  }

  const now = new Date();
  const lastTwoDays = subDays(now, 2);
  const lastSevenDays = subDays(now, 7);

  const [onboardingCountResponse, generatedTweetsResponse, xAccountResponse] =
    await Promise.all([
      supabase
        .from('onboarding_answers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('flow_key', ONBOARDING_FLOW_KEY),
      supabase
        .from('generated_tweets')
        .select('status, scheduled_for, published_at')
        .eq('user_id', user.id)
        .in('status', ['scheduled', 'published', 'failed', 'draft', 'publishing']),
      supabase
        .from('x_accounts')
        .select('id, access_token')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

  const onboardingCompleted = (onboardingCountResponse.count ?? 0) > 0;

  const generatedTweets =
    (generatedTweetsResponse.data as Array<{
      status: GeneratedTweetStatus;
      scheduled_for: string | null;
      published_at: string | null;
    }> | null) ?? [];

  const scheduledUpcoming = generatedTweets
    .filter((tweet) => tweet.status === 'scheduled' && tweet.scheduled_for)
    .filter((tweet) => new Date(tweet.scheduled_for as string).getTime() > now.getTime());

  const nextScheduledAt =
    scheduledUpcoming
      .map((tweet) => tweet.scheduled_for as string)
      .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0] ?? null;

  const publishedInLast7Days = generatedTweets.filter((tweet) => {
    if (!tweet.published_at) {
      return false;
    }

    const publishedAt = new Date(tweet.published_at);
    return publishedAt.getTime() >= lastSevenDays.getTime();
  });

  const postedInPastTwoDays = generatedTweets.some((tweet) => {
    if (!tweet.published_at) {
      return false;
    }

    return new Date(tweet.published_at).getTime() >= lastTwoDays.getTime();
  });

  let followersCount: number | null = null;
  let engagementLast7DaysCount = 0;
  let needsXReconnect = false;

  if (xAccountResponse.data?.access_token) {
    try {
      const profile = await getAuthenticatedXUser(xAccountResponse.data.access_token);
      followersCount = profile.public_metrics?.followers_count ?? null;

      const timelineTweets = await getAuthenticatedUserTweets(
        xAccountResponse.data.access_token,
        profile.id,
      );

      engagementLast7DaysCount = timelineTweets
        .filter((tweet) => {
          if (!tweet.created_at) {
            return false;
          }

          return new Date(tweet.created_at).getTime() >= lastSevenDays.getTime();
        })
        .reduce((total, tweet) => {
          const metrics = tweet.public_metrics;
          return (
            total +
            (metrics?.like_count ?? 0) +
            (metrics?.quote_count ?? 0) +
            (metrics?.reply_count ?? 0) +
            (metrics?.retweet_count ?? 0)
          );
        }, 0);
    } catch {
      needsXReconnect = true;
    }
  }

  let score = 0;
  score += onboardingCompleted ? 25 : 5;
  score += xAccountResponse.data ? 20 : 0;
  score += Math.min(25, publishedInLast7Days.length * 5);
  score += Math.min(20, scheduledUpcoming.length * 4);
  score += engagementLast7DaysCount > 0 ? 10 : 0;
  score += postedInPastTwoDays ? 20 : 0;

  score = Math.max(0, Math.min(100, Math.round(score)));

  const activityAlerts: string[] = [];

  if (!postedInPastTwoDays) {
    activityAlerts.push('You have not posted in the past two days.');
  }

  if (engagementLast7DaysCount === 0) {
    activityAlerts.push('You have not engaged this week.');
  }

  if (!scheduledUpcoming.length) {
    activityAlerts.push('You do not have scheduled posts lined up yet.');
  }

  if (!xAccountResponse.data) {
    activityAlerts.push('Connect your X account to unlock live audience metrics.');
  }

  if (needsXReconnect) {
    activityAlerts.push('Reconnect X to refresh your profile and engagement stats.');
  }

  if (!activityAlerts.length) {
    activityAlerts.push('Great momentum this week. Keep your cadence steady.');
  }

  return {
    score,
    scoreLabel: getScoreLabel(score),
    followersCount,
    scheduledUpcomingCount: scheduledUpcoming.length,
    publishedLast7DaysCount: publishedInLast7Days.length,
    engagementLast7DaysCount,
    nextScheduledAt,
    activityAlerts,
  };
}

export async function generateSevenDayContentPlan(params: {
  startDateISO: string;
  endDateISO: string;
}): Promise<{ items: SevenDayPlanItem[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Sign in to generate a plan.');
  }

  const dates = buildDateRange(params.startDateISO, params.endDateISO);
  const brandContext = await getBrandContext(user.id);

  const fallbackPillars = [
    'Educational',
    'Trending Insight',
    'Product Explainer',
    'Testimonial',
    'Behind the Scenes',
    'Opinion/POV',
    'Engagement Prompt',
  ];

  const dateList = dates.map((date) => format(date, 'yyyy-MM-dd')).join(', ');

  try {
    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      temperature: 0.5,
      prompt: [
        'Create a 7-day X content plan.',
        'Use this brand context:',
        brandContext,
        `Dates (must match order): ${dateList}`,
        'Return only valid JSON array of 7 objects. Each object must include:',
        'pillar, contentType, angle, rationale, suggestedPost',
        'No markdown. No additional text.',
      ].join('\n\n'),
    });

    const parsed = extractJsonArray(result.text);
    const items = mapPlanItems(dates, parsed, fallbackPillars);

    return { items };
  } catch {
    return {
      items: mapPlanItems(dates, null, fallbackPillars),
    };
  }
}

export async function regenerateSevenDayPlanItem(params: {
  dateISO: string;
  note?: string;
  existingItem: SevenDayPlanItem;
}): Promise<SevenDayPlanItem> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Sign in to regenerate this plan item.');
  }

  const targetDate = startOfDay(parseISO(params.dateISO));

  if (Number.isNaN(targetDate.getTime())) {
    throw new Error('Invalid date for regeneration.');
  }

  const brandContext = await getBrandContext(user.id);

  try {
    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      temperature: 0.6,
      prompt: [
        'Regenerate one X content plan day as JSON object.',
        `Date: ${format(targetDate, 'yyyy-MM-dd')}`,
        `Current pillar: ${params.existingItem.pillar}`,
        `Current angle: ${params.existingItem.angle}`,
        params.note ? `User note: ${params.note}` : 'User note: none',
        'Brand context:',
        brandContext,
        'Return only valid JSON object with keys:',
        'pillar, contentType, angle, rationale, suggestedPost',
      ].join('\n\n'),
    });

    const parsed = extractJsonObject(result.text);

    return {
      id: params.existingItem.id,
      dateISO: toIsoDateString(targetDate),
      dayLabel: format(targetDate, 'EEE, MMM d'),
      pillar: normalizeText(parsed?.pillar) || params.existingItem.pillar,
      contentType: normalizeText(parsed?.contentType) || params.existingItem.contentType,
      angle: normalizeText(parsed?.angle) || params.existingItem.angle,
      rationale: normalizeText(parsed?.rationale) || params.existingItem.rationale,
      suggestedPost: normalizeText(parsed?.suggestedPost) || params.existingItem.suggestedPost,
      status: 'pending',
    };
  } catch {
    return {
      ...params.existingItem,
      rationale: params.note
        ? `${params.existingItem.rationale} (Regenerated with note: ${params.note})`
        : `${params.existingItem.rationale} (Regenerated)`,
      status: 'pending',
    };
  }
}

export async function scheduleSevenDayContentPlan(params: {
  items: SevenDayPlanItem[];
}): Promise<{ scheduledCount: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Sign in to schedule content.');
  }

  const approvedItems = params.items.filter((item) => item.status === 'approved');

  if (!approvedItems.length) {
    throw new Error('Approve at least one day before scheduling.');
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
        user_id: user.id,
        name: 'Auto Planner Template',
        platform_type: 'x',
        instructions: 'Auto-generated by 7-day planning workflow.',
        structure_fields: {},
      })
      .select('id')
      .single();

    if (createTemplateError || !createdTemplate) {
      throw new Error('Unable to create a planner template for scheduling.');
    }

    template = createdTemplate;
  }

  const { data: xAccount } = await supabase
    .from('x_accounts')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  const now = new Date().toISOString();

  const insertRows = approvedItems.map((item, index) => {
    const baseDate = startOfDay(parseISO(item.dateISO));

    if (Number.isNaN(baseDate.getTime())) {
      throw new Error(`Invalid date in plan item: ${item.dateISO}`);
    }

    baseDate.setUTCHours(14, index * 3, 0, 0);

    const content = (item.suggestedPost || `${item.pillar}: ${item.angle}`)
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 280);

    return {
      user_id: user.id,
      template_id: template.id,
      x_account_id: xAccount?.id ?? null,
      content,
      character_count: content.length,
      status: 'scheduled' as const,
      scheduled_for: baseDate.toISOString(),
      model: 'claude-haiku-4-5',
      prompt_snapshot: {
        source: 'seven_day_planner',
        pillar: item.pillar,
        contentType: item.contentType,
        rationale: item.rationale,
      },
      updated_at: now,
    };
  });

  const { data, error } = await supabase
    .from('generated_tweets')
    .insert(insertRows)
    .select('id');

  if (error) {
    throw new Error('Unable to schedule approved content into the calendar.');
  }

  revalidateAppPaths(['/app', '/app/calendar', '/app/x/calendar']);

  return {
    scheduledCount: data?.length ?? 0,
  };
}
