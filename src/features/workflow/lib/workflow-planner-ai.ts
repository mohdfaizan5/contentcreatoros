import type { SupabaseClient } from '@supabase/supabase-js';
import { generateText } from 'ai';
import { differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns';

import { anthropic } from '@/shared/lib/anthropic';
import { ONBOARDING_FLOW_KEY } from '@/features/onboarding/lib/onboarding';
import {
  WORKFLOW_PLANNER_MAX_DAYS,
  WORKFLOW_PLANNER_MIN_DAYS,
} from '@/features/workflow/lib/workflow-planner-limits';

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

type WorkflowPlannerGenerationSettings = {
  campaignBrief?: string;
  postsPerDay?: 1 | 2;
};

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

type PlannerPostSlot = {
  id: string;
  index: number;
  date: Date;
  dateISO: string;
  dayLabel: string;
  slotLabel: string;
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

const WORKFLOW_PLANNER_SYSTEM_PROMPT = `You are a senior X content strategist producing concise, high-signal post drafts. Every suggestedPost must be 280 characters or fewer (hard limit). Optimize for first-glance readability with a clear hook, concise lines, and coherent flow. Avoid clutter, filler, excessive emojis, and hashtag stuffing. Return strict JSON only using the exact schema requested by the user prompt.`;

const WORKFLOW_POST_FORMATTER_SYSTEM_PROMPT = `You are a strict formatting assistant for X post drafts. Your job is formatting only. Never rewrite, paraphrase, summarize, reorder, or improve wording. Never add or remove facts, claims, examples, or calls to action. You may only adjust whitespace, line breaks, and list markers for readability. Preserve original sentence order and original wording. If the input is already well-formatted, return it unchanged. Return plain text only. No markdown fences. No explanations.`;

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
  campaignBrief?: string;
  postsPerDay?: 1 | 2;
  note?: string;
  forceDifference: boolean;
}) {
  const postsPerDay = params.postsPerDay ?? 1;

  return [
    'Regenerate one X post-plan item as JSON object.',
    `Post slot: ${params.targetDateLabel}`,
    `Current pillar: ${params.existingItem.pillar}`,
    `Current angle: ${params.existingItem.angle}`,
    `Current suggestedPost: ${params.existingItem.suggestedPost}`,
    params.note ? `User note: ${params.note}` : 'User note: none',
    params.campaignBrief ? `Campaign brief: ${params.campaignBrief}` : 'Campaign brief: none',
    `Posts per day: ${postsPerDay}`,
    'Brand context:',
    params.brandContext,
    'Return only valid JSON object with keys:',
    'pillar, contentType, angle, rationale, suggestedPost',
    'The suggestedPost must be exactly 1 X post and must be 280 characters or fewer.',
    params.campaignBrief
      ? 'The campaign brief is the highest-priority direction. The new post must clearly reflect it in the hook, framing, and detail choices.'
      : 'Use the brand context to keep the post on-strategy.',
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
  campaignBrief?: string;
  postsPerDay?: 1 | 2;
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
    dayLabel: params.existingItem.dayLabel,
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

function buildPlannerPostSlots(dates: Date[], postsPerDay: 1 | 2): PlannerPostSlot[] {
  return dates.flatMap((date, dateIndex) =>
    Array.from({ length: postsPerDay }, (_, slotIndex) => {
      const dateISO = toIsoDateString(date);
      const postNumber = slotIndex + 1;
      const slotLabel =
        postsPerDay === 2
          ? `${format(date, 'EEE, MMM d')} - Post ${postNumber}`
          : format(date, 'EEE, MMM d');

      return {
        date,
        dateISO,
        dayLabel: slotLabel,
        id: `${dateISO}-${dateIndex + 1}-${postNumber}`,
        index: dateIndex * postsPerDay + slotIndex,
        slotLabel: `${dateISO}${postsPerDay === 2 ? ` - Post ${postNumber}` : ''}`,
      };
    }),
  );
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

function buildFallbackSuggestedPost(fallbackPillar: string) {
  return `${fallbackPillar}: practical insight with a clear takeaway and one soft CTA.`;
}

function mapPlanItemsWithSettings(
  slots: PlannerPostSlot[],
  rawPlanItems: RawPlanItem[] | null,
  settings: WorkflowPlannerGenerationSettings,
): PlannerDraftItem[] {
  return slots.map((slot, index) => {
    const rawItem = rawPlanItems?.[index];
    const fallbackPillar = FALLBACK_PILLARS[index % FALLBACK_PILLARS.length];

    return {
      id: slot.id,
      dateISO: slot.dateISO,
      dayLabel: slot.dayLabel,
      pillar: normalizeText(rawItem?.pillar) || fallbackPillar,
      contentType: normalizeText(rawItem?.contentType) || 'Single post',
      angle:
        normalizeText(rawItem?.angle) ||
        `Share one practical insight that supports your ${fallbackPillar.toLowerCase()} pillar.`,
      rationale:
        normalizeText(rawItem?.rationale) ||
        (settings.campaignBrief
          ? 'Fits the selected campaign brief while keeping variety across the planned posting slots.'
          : 'Fits your cadence and keeps variety across the selected campaign dates.'),
      suggestedPost:
        normalizeText(rawItem?.suggestedPost) || buildFallbackSuggestedPost(fallbackPillar),
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
  campaignBrief?: string;
  postsPerDay?: 1 | 2;
}): Promise<PlannerDraftItem[]> {
  const dates = buildDateRange(params.startDateISO, params.endDateISO);
  const postsPerDay = params.postsPerDay ?? 1;
  const campaignBrief = params.campaignBrief?.trim();
  const slots = buildPlannerPostSlots(dates, postsPerDay);
  const slotList = slots.map((slot) => `${slot.index + 1}. ${slot.slotLabel}`).join('\n');

  try {
    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      system: WORKFLOW_PLANNER_SYSTEM_PROMPT,
      temperature: 0.5,
      prompt: [
        `Create an X content plan for ${dates.length} day(s) and ${slots.length} total post slot(s).`,
        'Use this brand context:',
        params.brandContext,
        campaignBrief
          ? `Campaign brief (highest priority, every post must clearly reflect it):\n${campaignBrief}`
          : 'Campaign brief:\nNone provided.',
        `Posts per day: ${postsPerDay}.`,
        'Post slots (must match this order exactly):',
        slotList,
        `Return only a valid JSON array of exactly ${slots.length} objects. Each object must include:`,
        'pillar, contentType, angle, rationale, suggestedPost',
        'Each object represents one post slot only.',
        'Each suggestedPost must be exactly 1 X post and must be 280 characters or fewer.',
        'Do not combine multiple posts into one object.',
        'The campaign brief must materially influence the hook, angle, examples, and CTA framing in every object.',
        'Each suggestedPost should be formatted for quick scanning and readability at first glance.',
        'No markdown. No additional text.',
      ].join('\n\n'),
    });

    const parsed = extractJsonArray(result.text);
    return mapPlanItemsWithSettings(slots, parsed, {
      campaignBrief,
      postsPerDay,
    });
  } catch {
    return mapPlanItemsWithSettings(slots, null, {
      campaignBrief,
      postsPerDay,
    });
  }
}

export async function regenerateSevenDayDraftItem(params: {
  dateISO: string;
  note?: string;
  existingItem: PlannerDraftItem;
  brandContext: string;
  campaignBrief?: string;
  postsPerDay?: 1 | 2;
}): Promise<PlannerDraftItem> {
  const targetDate = startOfDay(parseISO(params.dateISO));
  const targetDateLabel = params.existingItem.dayLabel;

  if (Number.isNaN(targetDate.getTime())) {
    throw new Error('Invalid date for regeneration.');
  }

  try {
    const primaryParsed = await generateRegeneratedPlanItem({
      targetDateLabel,
      existingItem: params.existingItem,
      brandContext: params.brandContext,
      campaignBrief: params.campaignBrief,
      note: params.note,
      postsPerDay: params.postsPerDay,
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
        campaignBrief: params.campaignBrief,
        note: params.note,
        postsPerDay: params.postsPerDay,
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

