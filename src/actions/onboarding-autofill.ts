/**
 * Runs onboarding autofill by scraping the user's website, inferring answers,
 * and storing inference payloads for observability and replay.
 */
'use server';

import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

import {
  getQuestionSteps,
  ONBOARDING_FLOW_KEY,
} from '@/lib/onboarding';
import { scrapeWebsiteForOnboarding } from '@/lib/firecrawl';
import { buildBrandVisualIdentity, type BrandVisualIdentity } from '@/lib/brand-visuals';
import { createClient } from '@/lib/server';
import type { OnboardingAnswers, OnboardingQuestion } from '@/types/onboarding';

type OnboardingAutofillErrorCode =
  | 'INVALID_URL'
  | 'SCRAPE_FAILED'
  | 'INFERENCE_FAILED'
  | 'DB_WRITE_FAILED'
  | 'UNAUTHENTICATED';

export type RunOnboardingAutofillInput = {
  websiteUrl: string;
  xAccount?: string;
};

export type RunOnboardingAutofillResult = {
  success: boolean;
  error?: string;
  errorCode?: OnboardingAutofillErrorCode;
  inferredAnswers?: OnboardingAnswers;
  brandIdentity?: BrandVisualIdentity;
  source?: {
    normalizedUrl: string;
    domain: string;
    xAccount: string;
  };
};

type InferPromptQuestion = {
  key: string;
  label: string;
  type: OnboardingQuestion['type'];
  required: boolean;
  important: boolean;
  options?: Array<{ value: string; label: string }>;
};

const DEBUG_LOGS = process.env.ONBOARDING_AUTOFILL_DEBUG !== 'false';
const INFERENCE_MODEL = 'claude-haiku-4-5';
const PROMPT_VERSION = 'onboarding-autofill-v2';
const MAX_MARKDOWN_CHARS = 12_000;

function createRequestId() {
  return `onb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function extractXHandle(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('@')) {
    return trimmed;
  }

  const urlMatch = trimmed.match(/(?:x|twitter)\.com\/([A-Za-z0-9_]+)/i);
  if (urlMatch?.[1]) {
    return `@${urlMatch[1]}`;
  }

  const normalized = trimmed.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  if (/^[A-Za-z0-9_]{1,15}$/.test(normalized)) {
    return `@${normalized}`;
  }

  return trimmed;
}

function firstObject(text: string) {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');

  if (firstBrace < 0 || lastBrace <= firstBrace) {
    return null;
  }

  try {
    return JSON.parse(text.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function toTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeOptionValue(question: InferPromptQuestion, value: unknown): string {
  const incoming = toTrimmedString(value).toLowerCase();

  if (!incoming || !question.options?.length) {
    return '';
  }

  const matched = question.options.find((option) => {
    const optionValue = option.value.toLowerCase();
    const optionLabel = option.label.toLowerCase();
    return incoming === optionValue || incoming === optionLabel;
  });

  if (matched) {
    return matched.value;
  }

  const fuzzy = question.options.find((option) => {
    const optionValue = option.value.toLowerCase();
    const optionLabel = option.label.toLowerCase();
    return incoming.includes(optionValue) || incoming.includes(optionLabel);
  });

  return fuzzy?.value ?? '';
}

function normalizeOptionValues(question: InferPromptQuestion, value: unknown): string[] {
  const entries = toStringArray(value);

  if (!entries.length || !question.options?.length) {
    return [];
  }

  const normalized = entries
    .map((entry) => normalizeOptionValue(question, entry))
    .filter(Boolean);

  return [...new Set(normalized)];
}

function toPromptQuestions(): InferPromptQuestion[] {
  return getQuestionSteps()
    .flatMap((step) => step.questions)
    .map((question) => ({
      key: question.key,
      label: question.label,
      type: question.type,
      required: Boolean(question.required),
      important: Boolean(question.important),
      options:
        question.type === 'single-select' || question.type === 'multi-select'
          ? question.options.map((option) => ({
              value: option.value,
              label: option.label,
            }))
          : undefined,
    }));
}

function normalizeInferredAnswers(params: {
  rawAnswers: Record<string, unknown>;
  promptQuestions: InferPromptQuestion[];
  websiteUrl: string;
  xHandle: string;
}) {
  const normalized: OnboardingAnswers = {
    website_url: params.websiteUrl,
    x_account: params.xHandle,
  };

  params.promptQuestions.forEach((question) => {
    if (question.key === 'website_url' || question.key === 'x_account') {
      return;
    }

    const incoming = params.rawAnswers[question.key];

    if (question.type === 'multi-select' || question.type === 'tag-input') {
      const values =
        question.type === 'multi-select'
          ? normalizeOptionValues(question, incoming)
          : toStringArray(incoming);

      if (values.length > 0) {
        normalized[question.key] = values;
      }

      return;
    }

    if (question.type === 'single-select') {
      const value = normalizeOptionValue(question, incoming);
      if (value) {
        normalized[question.key] = value;
      }
      return;
    }

    const value = toTrimmedString(incoming);
    if (value) {
      normalized[question.key] = value;
    }
  });

  return normalized;
}

function buildInferencePrompt(params: {
  promptQuestions: InferPromptQuestion[];
  websiteUrl: string;
  domain: string;
  xHandle: string;
  markdown: string;
  metadata: Record<string, unknown>;
  brandIdentity: BrandVisualIdentity;
}) {
  const compactQuestions = params.promptQuestions.map((question) => ({
    key: question.key,
    label: question.label,
    type: question.type,
    required: question.required,
    important: question.important,
    options: question.options,
  }));

  return [
    'You are helping prefill onboarding answers for an X content strategy app.',
    'Use only explicit evidence from the website context. Keep answers practical and concise.',
    'Rules:',
    '- Return JSON only.',
    '- Use only these question keys.',
    '- For single-select/multi-select keys, return OPTION VALUES only (not labels).',
    '- If uncertain, omit that key. Prefer empty over wrong.',
    '- Never use generic industry assumptions to fill missing details.',
    '- For belief/opinion fields, answer only if the site explicitly states them; otherwise omit.',
    '- Do not invent revenue numbers or confidential details.',
    '',
    `Source website: ${params.websiteUrl}`,
    `Domain: ${params.domain}`,
    `X handle: ${params.xHandle || 'unknown'}`,
    `Brand identity hints: ${JSON.stringify(params.brandIdentity)}`,
    `Metadata: ${JSON.stringify(params.metadata)}`,
    'Question schema:',
    JSON.stringify(compactQuestions, null, 2),
    '',
    'Website markdown excerpt:',
    params.markdown.slice(0, MAX_MARKDOWN_CHARS),
    '',
    'Return format:',
    JSON.stringify(
      {
        answers: {
          some_key: 'value',
          some_multi_select_key: ['value_1', 'value_2'],
        },
      },
      null,
      2,
    ),
  ].join('\n');
}

async function persistAutofillRun(params: {
  userId: string;
  websiteUrl: string;
  domain: string;
  xHandle: string;
  scrapePayload: Record<string, unknown>;
  brandIdentity: BrandVisualIdentity;
  inferredAnswers: OnboardingAnswers;
  requestId: string;
  durationMs: number;
  inferenceDurationMs: number;
  markdownLength: number;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from('onboarding_autofill_profiles').upsert(
    {
      user_id: params.userId,
      flow_key: ONBOARDING_FLOW_KEY,
      source_url: params.websiteUrl,
      source_domain: params.domain,
      x_handle: params.xHandle || null,
      scrape_payload: params.scrapePayload,
      brand_identity: params.brandIdentity,
      inferred_answers: params.inferredAnswers,
      model: INFERENCE_MODEL,
      prompt_version: PROMPT_VERSION,
      run_metadata: {
        requestId: params.requestId,
        durationMs: params.durationMs,
        inferenceDurationMs: params.inferenceDurationMs,
        markdownLength: params.markdownLength,
        savedAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  return error;
}

export async function runOnboardingAutofill(
  input: RunOnboardingAutofillInput,
): Promise<RunOnboardingAutofillResult> {
  const requestId = createRequestId();
  const startedAt = Date.now();

  const websiteUrl = input.websiteUrl.trim();
  const xHandle = extractXHandle(input.xAccount ?? '');

  console.group(`[OnboardingAutofill][${requestId}] start`);
  console.log('input.received', {
    websiteUrl,
    xHandle,
    debugLogs: DEBUG_LOGS,
  });

  if (!websiteUrl) {
    console.error('validation.failed', {
      errorCode: 'INVALID_URL',
      message: 'Missing website URL',
    });
    console.groupEnd();

    return {
      success: false,
      errorCode: 'INVALID_URL',
      error: 'Add a valid website URL to continue.',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error('auth.failed', {
      errorCode: 'UNAUTHENTICATED',
    });
    console.groupEnd();

    return {
      success: false,
      errorCode: 'UNAUTHENTICATED',
      error: 'Please sign in and try again.',
    };
  }

  const promptQuestions = toPromptQuestions();
  console.log('context.loaded', {
    userId: user.id,
    promptQuestionCount: promptQuestions.length,
  });

  let scrapeResult: Awaited<ReturnType<typeof scrapeWebsiteForOnboarding>>;

  try {
    const scrapeStartedAt = Date.now();
    scrapeResult = await scrapeWebsiteForOnboarding({
      url: websiteUrl,
      requestId,
    });

    console.log('scrape.completed', {
      elapsedMs: Date.now() - scrapeStartedAt,
      normalizedUrl: scrapeResult.normalizedUrl,
      domain: scrapeResult.domain,
      markdownLength: scrapeResult.markdown.length,
      hasBrandName: Boolean(scrapeResult.brandIdentity.companyName),
      hasLogo: Boolean(scrapeResult.brandIdentity.logoUrl),
      colorCount: scrapeResult.brandIdentity.colors.length,
    });

    if (DEBUG_LOGS) {
      console.log('scrape.preview', {
        markdownHead: scrapeResult.markdown.slice(0, 280),
      });
    }
  } catch (error) {
    console.error('scrape.failed', {
      errorCode: 'SCRAPE_FAILED',
      message: error instanceof Error ? error.message : 'Unknown scrape failure',
    });
    console.groupEnd();

    return {
      success: false,
      errorCode: 'SCRAPE_FAILED',
      error: 'Unable to scan that website. Check the URL and try again.',
    };
  }

  const prompt = buildInferencePrompt({
    promptQuestions,
    websiteUrl: scrapeResult.normalizedUrl,
    domain: scrapeResult.domain,
    xHandle,
    markdown: scrapeResult.markdown,
    metadata: scrapeResult.metadata,
    brandIdentity: scrapeResult.brandIdentity,
  });

  let inferenceText = '';
  const inferenceStartedAt = Date.now();

  try {
    const inference = await generateText({
      model: anthropic(INFERENCE_MODEL),
      temperature: 0.35,
      maxOutputTokens: 1800,
      prompt,
    });

    inferenceText = inference.text;

    console.log('inference.completed', {
      elapsedMs: Date.now() - inferenceStartedAt,
      responseLength: inferenceText.length,
    });

    if (DEBUG_LOGS) {
      console.log('inference.preview', {
        textHead: inferenceText.slice(0, 480),
      });
    }
  } catch (error) {
    console.error('inference.failed', {
      errorCode: 'INFERENCE_FAILED',
      message: error instanceof Error ? error.message : 'Unknown inference failure',
    });
    console.groupEnd();

    return {
      success: false,
      errorCode: 'INFERENCE_FAILED',
      error: 'Unable to infer onboarding answers right now. Please try again.',
    };
  }

  const parsed = firstObject(inferenceText);
  const parsedAnswers =
    parsed && parsed.answers && typeof parsed.answers === 'object' && !Array.isArray(parsed.answers)
      ? (parsed.answers as Record<string, unknown>)
      : {};

  const inferredAnswers = normalizeInferredAnswers({
    rawAnswers: parsedAnswers,
    promptQuestions,
    websiteUrl: scrapeResult.normalizedUrl,
    xHandle,
  });

  const brandIdentity = buildBrandVisualIdentity(scrapeResult.brandIdentity);

  const persistError = await persistAutofillRun({
    userId: user.id,
    websiteUrl: scrapeResult.normalizedUrl,
    domain: scrapeResult.domain,
    xHandle,
    scrapePayload: {
      markdown: scrapeResult.markdown,
      metadata: scrapeResult.metadata,
      raw: scrapeResult.raw,
    },
    brandIdentity,
    inferredAnswers,
    requestId,
    durationMs: Date.now() - startedAt,
    inferenceDurationMs: Date.now() - inferenceStartedAt,
    markdownLength: scrapeResult.markdown.length,
  });

  if (persistError) {
    console.error('persist.failed', {
      errorCode: 'DB_WRITE_FAILED',
      details: persistError,
    });
    console.groupEnd();

    return {
      success: false,
      errorCode: 'DB_WRITE_FAILED',
      error: 'We inferred your profile but could not save it. Please retry.',
    };
  }

  console.log('persist.completed', {
    inferredKeyCount: Object.keys(inferredAnswers).length,
    totalElapsedMs: Date.now() - startedAt,
  });

  console.groupEnd();

  return {
    success: true,
    inferredAnswers,
    brandIdentity,
    source: {
      normalizedUrl: scrapeResult.normalizedUrl,
      domain: scrapeResult.domain,
      xAccount: xHandle,
    },
  };
}
