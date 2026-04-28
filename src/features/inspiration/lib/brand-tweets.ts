import { generateText } from 'ai';
import { anthropic } from '@/shared/lib/anthropic';
import type { Template } from '@/shared/types/database';
import {
  getQuestionSteps,
  getQuestionSummaryValue,
  hydrateOnboardingAnswersFromStoredRows,
} from '@/features/onboarding/lib/onboarding';

const X_CHARACTER_LIMIT = 280;

type StoredOnboardingAnswerRow = {
  answer: unknown;
  question_key: string;
};

function buildBrandSummary(rows: StoredOnboardingAnswerRow[]) {
  const answers = hydrateOnboardingAnswersFromStoredRows(rows);

  return getQuestionSteps()
    .flatMap((step) =>
      step.questions.flatMap((question) => {
        const summary = getQuestionSummaryValue(question, answers);

        return summary === 'Skipped'
          ? []
          : [`- ${question.label}: ${summary}`];
      }),
    )
    .join('\n');
}

function trimTweetToLimit(text: string) {
  if (text.length <= X_CHARACTER_LIMIT) {
    return text;
  }

  const trimmed = text.slice(0, X_CHARACTER_LIMIT - 1);
  const lastWhitespaceIndex = trimmed.lastIndexOf(' ');

  if (lastWhitespaceIndex > 0) {
    return `${trimmed.slice(0, lastWhitespaceIndex).trim()}…`;
  }

  return `${trimmed.trim()}…`;
}

async function shortenTweetToLimit(text: string) {
  if (text.length <= X_CHARACTER_LIMIT) {
    return text;
  }

  const { text: shortenedText } = await generateText({
    model: anthropic('claude-haiku-4-5'),
    system:
      'You shorten X posts to 280 characters or fewer while preserving the original point and voice. Return only the revised post text.',
    prompt: `Rewrite this X post so it stays under ${X_CHARACTER_LIMIT} characters:\n\n${text}`,
  });

  return trimTweetToLimit(shortenedText.trim());
}

export async function generateBrandTweet({
  onboardingRows,
  template,
}: {
  onboardingRows: StoredOnboardingAnswerRow[];
  template: Template;
}) {
  const brandSummary = buildBrandSummary(onboardingRows);

  if (!brandSummary) {
    throw new Error('Complete onboarding first so the AI has brand context to work with.');
  }

  const templateExamples = (template.examples ?? [])
    .slice(0, 3)
    .map((example, index) => `${index + 1}. ${example.content}`)
    .join('\n');
  const references = (template.reference_links ?? [])
    .slice(0, 3)
    .map((reference, index) => `${index + 1}. ${reference.title ?? reference.url}`)
    .join('\n');

  const systemPrompt = [
    'You are a senior brand voice strategist who writes sharp, scroll-stopping X posts.',
    `Always return exactly one complete X post under ${X_CHARACTER_LIMIT} characters.`,
    'Format the post for first-glance readability with a clear hook, concise phrasing, and clean line breaks.',
    'Use the onboarding profile as the source of truth for voice, audience, goals, and offer.',
    'Treat the template as a structural reference, not literal copy.',
    'Replace any placeholder-style wording with concrete language.',
    'Do not output quotation marks around the post.',
    'Do not output markdown, explanations, character counts, or multiple options.',
  ].join(' ');

  const prompt = [
    'Brand profile:',
    brandSummary,
    '',
    `Template name: ${template.name}`,
    `Template instructions: ${template.instructions ?? 'None provided.'}`,
    `Template text: ${template.template_text ?? 'No template text provided.'}`,
    templateExamples ? `Reference examples:\n${templateExamples}` : 'Reference examples: none',
    references ? `Reference links:\n${references}` : 'Reference links: none',
    '',
    'Write one polished X post for this brand based on the template.',
  ].join('\n');

  const { text } = await generateText({
    model: anthropic('claude-haiku-4-5'),
    system: systemPrompt,
    prompt,
    maxOutputTokens: 220,
  });

  const normalizedText = await shortenTweetToLimit(text.trim());

  return {
    brandSummary,
    prompt,
    systemPrompt,
    text: normalizedText,
  };
}

export { X_CHARACTER_LIMIT };
