import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns';

import { ONBOARDING_FLOW_KEY } from '@/lib/onboarding';

export interface PlannerDraftItem {
  id: string;
  dateISO: string;
  dayLabel: string;
  pillar: string;
  contentType: string;
  angle: string;
  rationale: string;
  suggestedPost: string;
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

const FALLBACK_PILLARS = [
  'Educational',
  'Trending Insight',
  'Product Explainer',
  'Testimonial',
  'Behind the Scenes',
  'Opinion/POV',
  'Engagement Prompt',
] as const;

const WORKFLOW_PLANNER_SYSTEM_PROMPT = [
  'You are a senior X content strategist producing concise, high-signal post drafts.',
  'Every suggestedPost must be 280 characters or fewer (hard limit).',
  'Optimize for first-glance readability with a clear hook, concise lines, and coherent flow.',
  'Avoid clutter, filler, excessive emojis, and hashtag stuffing.',
  'Return strict JSON only using the exact schema requested by the user prompt.',
].join(' ');

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

function mapPlanItems(dates: Date[], rawPlanItems: RawPlanItem[] | null): PlannerDraftItem[] {
  return dates.map((date, index) => {
    const rawItem = rawPlanItems?.[index];
    const fallbackPillar = FALLBACK_PILLARS[index % FALLBACK_PILLARS.length];

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
    };
  });
}

export function buildDateRange(startDateISO: string, endDateISO: string): Date[] {
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
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export async function getBrandContextForUser(supabase: any, userId: string) {
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

export async function generateSevenDayDraftItems(params: {
  startDateISO: string;
  endDateISO: string;
  brandContext: string;
}): Promise<PlannerDraftItem[]> {
  const dates = buildDateRange(params.startDateISO, params.endDateISO);
  const dateList = dates.map((date) => format(date, 'yyyy-MM-dd')).join(', ');

  try {
    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      system: WORKFLOW_PLANNER_SYSTEM_PROMPT,
      temperature: 0.5,
      prompt: [
        'Create a 7-day X content plan.',
        'Use this brand context:',
        params.brandContext,
        `Dates (must match order): ${dateList}`,
        'Return only valid JSON array of 7 objects. Each object must include:',
        'pillar, contentType, angle, rationale, suggestedPost',
        'Each suggestedPost must be 280 characters or fewer.',
        'Each suggestedPost should be formatted for quick scanning and readability at first glance.',
        'No markdown. No additional text.',
      ].join('\n\n'),
    });

    const parsed = extractJsonArray(result.text);
    return mapPlanItems(dates, parsed);
  } catch {
    return mapPlanItems(dates, null);
  }
}

export async function regenerateSevenDayDraftItem(params: {
  dateISO: string;
  note?: string;
  existingItem: PlannerDraftItem;
  brandContext: string;
}): Promise<PlannerDraftItem> {
  const targetDate = startOfDay(parseISO(params.dateISO));

  if (Number.isNaN(targetDate.getTime())) {
    throw new Error('Invalid date for regeneration.');
  }

  try {
    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      system: WORKFLOW_PLANNER_SYSTEM_PROMPT,
      temperature: 0.6,
      prompt: [
        'Regenerate one X content plan day as JSON object.',
        `Date: ${format(targetDate, 'yyyy-MM-dd')}`,
        `Current pillar: ${params.existingItem.pillar}`,
        `Current angle: ${params.existingItem.angle}`,
        params.note ? `User note: ${params.note}` : 'User note: none',
        'Brand context:',
        params.brandContext,
        'Return only valid JSON object with keys:',
        'pillar, contentType, angle, rationale, suggestedPost',
        'The suggestedPost must be 280 characters or fewer.',
        'The suggestedPost should be cleanly formatted for first-glance readability.',
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
    };
  } catch {
    return {
      ...params.existingItem,
      rationale: params.note
        ? `${params.existingItem.rationale} (Regenerated with note: ${params.note})`
        : `${params.existingItem.rationale} (Regenerated)`,
    };
  }
}
