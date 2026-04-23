import { anthropic } from '@ai-sdk/anthropic';
import type { SupabaseClient } from '@supabase/supabase-js';
import { generateText } from 'ai';
import { differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns';

import { ONBOARDING_FLOW_KEY } from '@/lib/onboarding';
import {
  WORKFLOW_PLANNER_MAX_DAYS,
  WORKFLOW_PLANNER_MIN_DAYS,
} from '@/lib/workflow-planner-limits';

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

const WORKFLOW_POST_FORMATTER_SYSTEM_PROMPT = [
  'You are a strict formatting assistant for X post drafts.',
  'Your job is formatting only.',
  'Never rewrite, paraphrase, summarize, reorder, or improve wording.',
  'Never add or remove facts, claims, examples, or calls to action.',
  'You may only adjust whitespace, line breaks, and list markers for readability.',
  'Preserve original sentence order and original wording.',
  'If the input is already well-formatted, return it unchanged.',
  'Return plain text only. No markdown fences. No explanations.',
].join(' ');

function normalizeLineBreaks(value: string) {
  return value.replace(/\r\n?/g, '\n').trim();
}

function normalizeWordSequence(value: string) {
  return normalizeLineBreaks(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function trimToCharacterLimit(value: string, maxChars: number) {
  if (value.length <= maxChars) {
    return value;
  }

  return value.slice(0, maxChars).trimEnd();
}

function hasSuggestedPostChanged(next: PlannerDraftItem, previous: PlannerDraftItem) {
  return normalizeLineBreaks(next.suggestedPost) !== normalizeLineBreaks(previous.suggestedPost);
}

function buildRegenerationPrompt(params: {
  targetDateLabel: string;
  existingItem: PlannerDraftItem;
  brandContext: string;
  note?: string;
  forceDifference: boolean;
}) {
  return [
    'Regenerate one X content plan day as JSON object.',
    `Date: ${params.targetDateLabel}`,
    `Current pillar: ${params.existingItem.pillar}`,
    `Current angle: ${params.existingItem.angle}`,
    `Current suggestedPost: ${params.existingItem.suggestedPost}`,
    params.note ? `User note: ${params.note}` : 'User note: none',
    'Brand context:',
    params.brandContext,
    'Return only valid JSON object with keys:',
    'pillar, contentType, angle, rationale, suggestedPost',
    'The suggestedPost must be 280 characters or fewer.',
    'The suggestedPost should be cleanly formatted for first-glance readability.',
    params.forceDifference
      ? 'The new suggestedPost must be materially different from the current suggestedPost with a different hook and phrasing while staying on-strategy.'
      : 'Improve clarity and impact while keeping the same strategy.',
    'No markdown. No commentary. JSON only.',
  ].join('\n\n');
}

async function generateRegeneratedPlanItem(params: {
  targetDateLabel: string;
  existingItem: PlannerDraftItem;
  brandContext: string;
  note?: string;
  forceDifference: boolean;
}) {
  const result = await generateText({
    model: anthropic('claude-haiku-4-5'),
    system: WORKFLOW_PLANNER_SYSTEM_PROMPT,
    temperature: params.forceDifference ? 0.75 : 0.6,
    prompt: buildRegenerationPrompt(params),
  });

  return extractJsonObject(result.text);
}

function buildNormalizedDraftItem(params: {
  existingItem: PlannerDraftItem;
  targetDate: Date;
  parsed: RawPlanItem | null;
}) {
  return {
    id: params.existingItem.id,
    dateISO: toIsoDateString(params.targetDate),
    dayLabel: format(params.targetDate, 'EEE, MMM d'),
    pillar: normalizeText(params.parsed?.pillar) || params.existingItem.pillar,
    contentType: normalizeText(params.parsed?.contentType) || params.existingItem.contentType,
    angle: normalizeText(params.parsed?.angle) || params.existingItem.angle,
    rationale: normalizeText(params.parsed?.rationale) || params.existingItem.rationale,
    suggestedPost: normalizeText(params.parsed?.suggestedPost) || params.existingItem.suggestedPost,
  } satisfies PlannerDraftItem;
}

function buildForcedFallbackSuggestion(existingItem: PlannerDraftItem) {
  const hook = normalizeText(existingItem.angle) || 'Fresh perspective';
  const body = normalizeLineBreaks(existingItem.suggestedPost);

  return trimToCharacterLimit(`${hook}\n\n${body}`, 280);
}

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
        'Fits your cadence and keeps variety across the selected campaign dates.',
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

  if (dayCount < WORKFLOW_PLANNER_MIN_DAYS || dayCount > WORKFLOW_PLANNER_MAX_DAYS) {
    throw new Error(
      `Select ${WORKFLOW_PLANNER_MIN_DAYS}-${WORKFLOW_PLANNER_MAX_DAYS} days to generate this plan.`,
    );
  }

  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export async function getBrandContextForUser(
  supabase: Pick<SupabaseClient, 'from'>,
  userId: string,
) {
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
  const dayCount = dates.length;

  try {
    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      system: WORKFLOW_PLANNER_SYSTEM_PROMPT,
      temperature: 0.5,
      prompt: [
        `Create a ${dayCount}-day X content plan.`,
        'Use this brand context:',
        params.brandContext,
        `Dates (must match order): ${dateList}`,
        `Return only a valid JSON array of exactly ${dayCount} objects. Each object must include:`,
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
  const targetDateLabel = format(targetDate, 'yyyy-MM-dd');

  if (Number.isNaN(targetDate.getTime())) {
    throw new Error('Invalid date for regeneration.');
  }

  try {
    const primaryParsed = await generateRegeneratedPlanItem({
      targetDateLabel,
      existingItem: params.existingItem,
      brandContext: params.brandContext,
      note: params.note,
      forceDifference: false,
    });

    let candidate = buildNormalizedDraftItem({
      existingItem: params.existingItem,
      targetDate,
      parsed: primaryParsed,
    });

    if (!hasSuggestedPostChanged(candidate, params.existingItem)) {
      const secondaryParsed = await generateRegeneratedPlanItem({
        targetDateLabel,
        existingItem: params.existingItem,
        brandContext: params.brandContext,
        note: params.note,
        forceDifference: true,
      });

      candidate = buildNormalizedDraftItem({
        existingItem: params.existingItem,
        targetDate,
        parsed: secondaryParsed,
      });
    }

    if (!hasSuggestedPostChanged(candidate, params.existingItem)) {
      candidate = {
        ...candidate,
        suggestedPost: buildForcedFallbackSuggestion(candidate),
      };
    }

    return candidate;
  } catch {
    return {
      ...params.existingItem,
      suggestedPost: buildForcedFallbackSuggestion(params.existingItem),
      rationale: params.note
        ? `${params.existingItem.rationale} (Regenerated with note: ${params.note})`
        : `${params.existingItem.rationale} (Regenerated with variation)`,
    };
  }
}

export async function formatWorkflowSuggestedPost(params: {
  suggestedPost: string;
}): Promise<{ formattedPost: string; changed: boolean }> {
  const original = normalizeLineBreaks(params.suggestedPost);

  if (!original) {
    throw new Error('Suggested post cannot be empty.');
  }

  try {
    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      system: WORKFLOW_POST_FORMATTER_SYSTEM_PROMPT,
      temperature: 0,
      prompt: [
        'Format this X post draft for readability without changing wording or order.',
        'Allowed changes: line breaks, spacing, and adding list hyphens when list points are already implied.',
        'If the text is already formatted, return it unchanged.',
        'Return plain text only.',
        '',
        'Input text:',
        original,
      ].join('\n'),
    });

    const formatted = normalizeLineBreaks(result.text);

    if (!formatted) {
      return {
        formattedPost: original,
        changed: false,
      };
    }

    if (normalizeWordSequence(formatted) !== normalizeWordSequence(original)) {
      return {
        formattedPost: original,
        changed: false,
      };
    }

    return {
      formattedPost: formatted,
      changed: formatted !== original,
    };
  } catch {
    return {
      formattedPost: original,
      changed: false,
    };
  }
}
