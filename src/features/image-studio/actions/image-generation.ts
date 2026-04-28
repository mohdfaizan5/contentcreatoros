'use server';

import { generateText } from 'ai';
import { anthropic } from '@/shared/lib/anthropic';

import {
  IMAGE_TEMPLATE_DEFINITIONS,
  type ImageTemplateCopy,
  type ImageTemplateFieldKey,
  type ImageTemplateId,
  isImageTemplateId,
  normalizeImageTemplateCopy,
  trimTweetToLimit,
} from '@/features/image-studio/lib/image-templates';
import {
  ONBOARDING_FLOW_KEY,
  getQuestionSteps,
  getQuestionSummaryValue,
  hydrateOnboardingAnswersFromStoredRows,
} from '@/features/onboarding/lib/onboarding';
import { buildBrandVisualIdentity, type BrandVisualIdentity } from '@/features/inspiration/lib/brand-visuals';
import { createClient } from '@/shared/lib/supabase/server';

type GenerateImageTemplateCopyErrorCode =
  | 'INVALID_TEMPLATE'
  | 'UNAUTHENTICATED'
  | 'MISSING_CONTEXT'
  | 'INFERENCE_FAILED';

type StoredOnboardingAnswerRow = {
  answer: unknown;
  question_key: string;
};

export type GenerateImageTemplateCopyInput = {
  templateId: ImageTemplateId;
  direction?: string;
  sourceTweet?: string;
  existingCopy?: Partial<Record<ImageTemplateFieldKey, string>>;
};

export type GenerateImageTemplateCopyResult = {
  success: boolean;
  error?: string;
  errorCode?: GenerateImageTemplateCopyErrorCode;
  data?: {
    templateId: ImageTemplateId;
    tweet: string;
    copy: ImageTemplateCopy;
    contextSummary: string;
    brandColors: string[];
    sourceDomain: string | null;
  };
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function firstNonEmpty(values: unknown[]) {
  for (const value of values) {
    const normalized = readString(value);

    if (normalized) {
      return normalized;
    }
  }

  return '';
}

function extractDomainFromUrl(url: string) {
  if (!url) {
    return '';
  }

  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function buildBrandSummary(rows: StoredOnboardingAnswerRow[]) {
  const answers = hydrateOnboardingAnswersFromStoredRows(rows);

  return getQuestionSteps()
    .flatMap((step) =>
      step.questions.flatMap((question) => {
        const summary = getQuestionSummaryValue(question, answers);

        if (!summary || summary === 'Skipped') {
          return [];
        }

        return [`- ${question.label}: ${summary}`];
      }),
    )
    .join('\n');
}

function parseGeneratedPayload(text: string) {
  const normalized = text.trim();

  if (!normalized) {
    return null;
  }

  try {
    const parsed = JSON.parse(normalized);

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Continue to fallback extraction.
  }

  const firstBracket = normalized.indexOf('{');
  const lastBracket = normalized.lastIndexOf('}');

  if (firstBracket < 0 || lastBracket <= firstBracket) {
    return null;
  }

  const candidate = normalized.slice(firstBracket, lastBracket + 1);

  try {
    const parsed = JSON.parse(candidate);

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

function toCompactSentence(value: string, maxChars: number) {
  const normalized = value.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return '';
  }

  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, maxChars - 3).trimEnd()}...`;
}

type FallbackContext = {
  companyName: string;
  companyOverview: string;
  sourceDomain: string;
};

function fallbackFieldValue(key: ImageTemplateFieldKey, context: FallbackContext) {
  switch (key) {
    case 'eyebrow':
      return context.sourceDomain ? context.sourceDomain.toUpperCase() : 'BRAND INSIGHT';
    case 'headline':
      return toCompactSentence(
        context.companyOverview || `${context.companyName} growth playbook`,
        90,
      );
    case 'supporting':
      return toCompactSentence(
        context.companyOverview || `Practical insights from ${context.companyName}.`,
        150,
      );
    case 'proofValue':
      return '32%';
    case 'proofLabel':
      return 'higher save rate';
    case 'cta':
      return 'Steal this framework';
    case 'footer':
      return context.sourceDomain || context.companyName;
    case 'quote':
      return toCompactSentence(context.companyOverview || `${context.companyName} in one line.`, 150);
    default:
      return '';
  }
}

function ensureRequiredFields(
  templateId: ImageTemplateId,
  copy: ImageTemplateCopy,
  context: FallbackContext,
) {
  const template = IMAGE_TEMPLATE_DEFINITIONS[templateId];
  const nextCopy: ImageTemplateCopy = { ...copy };

  template.fields.forEach((field) => {
    const currentValue = readString(nextCopy[field.key]);

    if (!field.optional && !currentValue) {
      nextCopy[field.key] = fallbackFieldValue(field.key, context);
    }
  });

  return normalizeImageTemplateCopy(templateId, nextCopy);
}

function buildFallbackTweet(copy: ImageTemplateCopy, companyName: string, sourceDomain: string) {
  const lines = [
    readString(copy.headline),
    readString(copy.supporting),
    readString(copy.cta),
  ].filter(Boolean);

  const body = lines.join('\n\n');

  if (body) {
    return sourceDomain ? `${body}\n\n${sourceDomain}` : body;
  }

  return sourceDomain
    ? `${companyName} growth notes\n\n${sourceDomain}`
    : `${companyName} growth notes`;
}

function buildFieldGuide(templateId: ImageTemplateId) {
  return IMAGE_TEMPLATE_DEFINITIONS[templateId].fields
    .map(
      (field) =>
        `- ${field.key}: max ${field.maxChars} chars, ${field.optional ? 'optional' : 'required'}${field.multiline ? ', multiline allowed' : ''}. ${field.helper}`,
    )
    .join('\n');
}

export async function generateImageTemplateCopy(
  input: GenerateImageTemplateCopyInput,
): Promise<GenerateImageTemplateCopyResult> {
  if (!isImageTemplateId(input.templateId)) {
    return {
      success: false,
      errorCode: 'INVALID_TEMPLATE',
      error: 'Choose a valid template before generating copy.',
    };
  }

  const templateId = input.templateId;
  const direction = readString(input.direction);
  const sourceTweet = trimTweetToLimit(readString(input.sourceTweet));
  const existingCopy = normalizeImageTemplateCopy(templateId, input.existingCopy ?? {});
  const template = IMAGE_TEMPLATE_DEFINITIONS[templateId];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      errorCode: 'UNAUTHENTICATED',
      error: 'Sign in again to generate image copy.',
    };
  }

  const [answersResponse, autofillResponse] = await Promise.all([
    supabase
      .from('onboarding_answers')
      .select('question_key, answer')
      .eq('user_id', user.id)
      .eq('flow_key', ONBOARDING_FLOW_KEY),
    supabase
      .from('onboarding_autofill_profiles')
      .select('brand_identity, inferred_answers, source_domain, source_url')
      .eq('user_id', user.id)
      .eq('flow_key', ONBOARDING_FLOW_KEY)
      .order('updated_at', { ascending: false })
      .limit(1),
  ]);

  const answerRows = (answersResponse.data ?? []) as StoredOnboardingAnswerRow[];
  const answers = hydrateOnboardingAnswersFromStoredRows(answerRows);
  const brandSummary = buildBrandSummary(answerRows);

  const latestAutofill = Array.isArray(autofillResponse.data) ? autofillResponse.data[0] : null;
  const rawBrandIdentity = asRecord(latestAutofill?.brand_identity);
  const inferredAnswers = asRecord(latestAutofill?.inferred_answers);

  const sourceDomain = firstNonEmpty([
    latestAutofill?.source_domain,
    rawBrandIdentity.sourceDomain,
    rawBrandIdentity.source_domain,
    extractDomainFromUrl(readString(answers.website_url)),
  ]);

  const brandIdentity: BrandVisualIdentity = buildBrandVisualIdentity({
    ...(rawBrandIdentity as Partial<BrandVisualIdentity>),
    sourceDomain: sourceDomain || null,
  });

  const companyName = firstNonEmpty([
    rawBrandIdentity.companyName,
    rawBrandIdentity.company_name,
    answers.company_name,
    sourceDomain,
    'Your Brand',
  ]);

  const companyOverview = firstNonEmpty([
    inferredAnswers.company_description,
    answers.company_description,
    rawBrandIdentity.description,
  ]);

  const websiteUrl = firstNonEmpty([
    latestAutofill?.source_url,
    answers.website_url,
    sourceDomain ? `https://${sourceDomain}` : '',
  ]);

  const contextSummary = [
    brandSummary,
    companyOverview,
    websiteUrl,
    brandIdentity.colors.length ? `Palette: ${brandIdentity.colors.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  if (!contextSummary) {
    return {
      success: false,
      errorCode: 'MISSING_CONTEXT',
      error: 'Complete onboarding or run website autofill first so generation has brand context.',
    };
  }

  const existingCopyPreview = template.fields
    .map((field) => {
      const value = readString(existingCopy[field.key]);
      return value ? `- ${field.key}: ${value}` : null;
    })
    .filter((line): line is string => Boolean(line));

  const jsonShape = template.fields
    .map((field) => `      "${field.key}": "..."`)
    .join(',\n');

  const prompt = [
    `Template ID: ${template.id}`,
    `Template Name: ${template.name}`,
    `Template Description: ${template.description}`,
    '',
    'Field rules:',
    buildFieldGuide(templateId),
    '',
    'Brand profile context:',
    contextSummary,
    '',
    existingCopyPreview.length
      ? `User-edited field seeds:\n${existingCopyPreview.join('\n')}`
      : 'User-edited field seeds: none',
    sourceTweet
      ? `Workflow post context (primary idea source):\n${sourceTweet}`
      : 'Workflow post context: none',
    direction ? `Creative direction from user: ${direction}` : 'Creative direction from user: none',
    '',
    'Task:',
    '- Write one X post and one image copy object.',
    '- When workflow post context is provided, treat it as the primary message to translate into the image copy.',
    '- Keep the post readable with clean line breaks.',
    '- Match tone and audience from context. Do not invent offers not implied by the context.',
    '- Respect all field character limits exactly.',
    '- Use concise, direct language.',
    '',
    'Return strict JSON only in this exact shape:',
    '{',
    '  "tweet": "...",',
    '  "copy": {',
    jsonShape,
    '  }',
    '}',
  ].join('\n');

  let modelText = '';

  try {
    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      system:
        'You are a senior social copywriter. Return valid JSON only, never markdown. Keep outputs practical and specific.',
      prompt,
      temperature: 0.5,
      maxOutputTokens: 1000,
    });

    modelText = result.text;
  } catch (error) {
    return {
      success: false,
      errorCode: 'INFERENCE_FAILED',
      error: error instanceof Error ? error.message : 'Unable to generate copy right now.',
    };
  }

  const parsed = parseGeneratedPayload(modelText);
  const parsedCopy = asRecord(parsed?.copy);
  const aiCopy: ImageTemplateCopy = {};

  template.fields.forEach((field) => {
    const value = parsedCopy[field.key];

    if (typeof value === 'string') {
      aiCopy[field.key] = value;
    }
  });

  const mergedCopy = normalizeImageTemplateCopy(templateId, {
    ...existingCopy,
    ...aiCopy,
  });

  const completedCopy = ensureRequiredFields(templateId, mergedCopy, {
    companyName,
    companyOverview,
    sourceDomain,
  });

  const generatedTweet = typeof parsed?.tweet === 'string' ? parsed.tweet : '';
  const fallbackTweet = buildFallbackTweet(completedCopy, companyName, sourceDomain);
  const tweet = trimTweetToLimit(generatedTweet || fallbackTweet);

  return {
    success: true,
    data: {
      templateId,
      tweet,
      copy: completedCopy,
      contextSummary,
      brandColors: brandIdentity.colors,
      sourceDomain: sourceDomain || null,
    },
  };
}
