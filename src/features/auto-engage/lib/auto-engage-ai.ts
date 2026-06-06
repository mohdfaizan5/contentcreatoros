import { generateText } from 'ai';

import { anthropic } from '@/shared/lib/anthropic';
import type {
  AutoEngageGoal,
  AutoEngageSuggestionRiskLevel,
  AutoEngageTargetType,
} from '@/shared/types/database';

export type AutoEngageCandidate = {
  authorFollowerCount: number | null;
  authorId: string | null;
  authorName: string | null;
  authorUsername: string;
  createdAt: string | null;
  engagementCounts: {
    likes: number;
    quotes: number;
    replies: number;
    reposts: number;
  };
  postId: string;
  postText: string;
  postUrl: string;
  riskLevel: AutoEngageSuggestionRiskLevel;
  score: number;
  sourceType: AutoEngageTargetType;
  sourceValue: string;
};

export type AutoEngageDraftSuggestion = {
  candidateId: string;
  reason: string;
  replyOptions: [string, string, string];
  riskLevel: AutoEngageSuggestionRiskLevel;
  suggestedReply: string;
};

type RawSuggestion = {
  candidateId?: string;
  reason?: string;
  replyOptions?: unknown;
  riskLevel?: string;
  suggestedReply?: string;
};

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeReplyList(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .slice(0, 3);
}

function extractJsonArray(rawText: string): RawSuggestion[] | null {
  const firstBracket = rawText.indexOf('[');
  const lastBracket = rawText.lastIndexOf(']');

  if (firstBracket < 0 || lastBracket <= firstBracket) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawText.slice(firstBracket, lastBracket + 1)) as unknown;

    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed as RawSuggestion[];
  } catch {
    return null;
  }
}

function trimReply(value: string) {
  const normalized = value.replace(/\r\n?/g, '\n').trim();

  if (normalized.length <= 260) {
    return normalized;
  }

  return `${normalized.slice(0, 257).trimEnd()}...`;
}

function buildGoalInstruction(goal: AutoEngageGoal) {
  switch (goal) {
    case 'community_engagement':
      return 'Optimize for community engagement. The replies should continue the conversation, encourage the author, and invite a natural response without selling.';
    case 'lead_generation':
      return 'Optimize for lead generation without pitching. The replies should diagnose sharply, add useful insight, and quietly signal expertise without asking for a sale.';
    default:
      return 'Optimize for founder personal branding. The replies should sound thoughtful, specific, and credible while building authority through insight rather than promotion.';
  }
}

function buildReplyPrompt(params: {
  brandVoice: string;
  contentPillars: string[];
  goal: AutoEngageGoal;
  niche: string;
  offer: string;
  targetAudience: string;
  topicsToAvoid: string[];
  candidates: AutoEngageCandidate[];
}) {
  const candidateLines = params.candidates.map((candidate, index) =>
    [
      `${index + 1}. candidateId: ${candidate.postId}`,
      `Author: ${candidate.authorName ?? candidate.authorUsername} (@${candidate.authorUsername})`,
      `Source: ${candidate.sourceType} -> ${candidate.sourceValue}`,
      `Score: ${candidate.score}`,
      `Risk hint: ${candidate.riskLevel}`,
      `Followers: ${candidate.authorFollowerCount ?? 'unknown'}`,
      `Engagement: replies ${candidate.engagementCounts.replies}, reposts ${candidate.engagementCounts.reposts}, likes ${candidate.engagementCounts.likes}, quotes ${candidate.engagementCounts.quotes}`,
      `Post text: ${candidate.postText}`,
    ].join('\n'),
  );

  return [
    'Generate draft-only X engagement replies as strict JSON.',
    buildGoalInstruction(params.goal),
    `Niche: ${params.niche || 'Use the broader brand context.'}`,
    `Offer: ${params.offer || 'Keep the reply useful without pitching.'}`,
    `Target audience: ${params.targetAudience || 'Use a smart builder/founder audience.'}`,
    `Brand voice: ${params.brandVoice || 'Natural, direct, useful, and human.'}`,
    params.contentPillars.length
      ? `Content pillars: ${params.contentPillars.join(', ')}`
      : 'Content pillars: none specified.',
    params.topicsToAvoid.length
      ? `Topics to avoid: ${params.topicsToAvoid.join(', ')}`
      : 'Topics to avoid: none specified.',
    'Rules:',
    '- Return exactly one object per candidate in the same order.',
    '- Each object must contain candidateId, reason, riskLevel, suggestedReply, replyOptions.',
    '- suggestedReply must also appear as one of the replyOptions.',
    '- replyOptions must contain exactly 3 distinct replies.',
    '- Every reply must feel human, specific, and tied to something in the post.',
    '- No links, no hashtags, no generic praise like "great post", no fake personal stories.',
    '- No controversial pile-ons, no politics, no tragedy-jacking, no spam.',
    '- If a candidate looks too risky, set riskLevel to "avoid" and keep replies empty strings.',
    '- Keep each reply under 260 characters.',
    '',
    'Candidates:',
    ...candidateLines,
    '',
    'Return only a JSON array.',
  ].join('\n');
}

function buildFallbackReason(candidate: AutoEngageCandidate) {
  if (candidate.sourceType === 'account') {
    return `Tracked account match. The post is fresh and close enough to your niche to justify a thoughtful reply.`;
  }

  return `Keyword match. The post overlaps with the topics you want to be visible around and offers a clean reply angle.`;
}

function buildFallbackReplyOptions(candidate: AutoEngageCandidate): [string, string, string] {
  const excerpt = candidate.postText
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 84)
    .replace(/[.?!,:;-\s]+$/g, '');

  const promptSeed = excerpt ? `"${excerpt}"` : 'that point';

  return [
    trimReply(`The part about ${promptSeed} is what stands out. That tends to be the lever most people skip when they think about this.`),
    trimReply(`Interesting angle. I think the real unlock is what happens after ${promptSeed} gets operationalized, because that is where most teams get stuck.`),
    trimReply(`This is a strong point. Curious what you have seen people get most wrong once they try to apply ${promptSeed} in practice?`),
  ];
}

function normalizeRiskLevel(value: string | undefined, fallback: AutoEngageSuggestionRiskLevel) {
  return value === 'low' || value === 'medium' || value === 'avoid' ? value : fallback;
}

function normalizeSuggestion(
  raw: RawSuggestion | undefined,
  candidate: AutoEngageCandidate,
) {
  const fallbackReplyOptions = buildFallbackReplyOptions(candidate);
  const normalizedReplyOptions = normalizeReplyList(raw?.replyOptions);
  const replyOptions =
    normalizedReplyOptions.length === 3
      ? (normalizedReplyOptions.map(trimReply) as [string, string, string])
      : fallbackReplyOptions;
  const suggestedReply =
    trimReply(normalizeText(raw?.suggestedReply)) || replyOptions[0];

  return {
    candidateId: candidate.postId,
    reason: normalizeText(raw?.reason) || buildFallbackReason(candidate),
    replyOptions,
    riskLevel: normalizeRiskLevel(raw?.riskLevel, candidate.riskLevel),
    suggestedReply,
  } satisfies AutoEngageDraftSuggestion;
}

export async function generateAutoEngageDraftSuggestions(params: {
  brandVoice: string;
  contentPillars: string[];
  goal: AutoEngageGoal;
  niche: string;
  offer: string;
  targetAudience: string;
  topicsToAvoid: string[];
  candidates: AutoEngageCandidate[];
}) {
  if (!params.candidates.length) {
    return [] as AutoEngageDraftSuggestion[];
  }

  try {
    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      system:
        'You are an AI engagement copilot for X. You write concise, thoughtful draft replies that feel human, useful, and specific. Return strict JSON only.',
      temperature: 0.45,
      prompt: buildReplyPrompt(params),
    });

    const parsed = extractJsonArray(result.text);
    const suggestionsById = new Map(
      (parsed ?? [])
        .map((item) => [normalizeText(item.candidateId), item] as const)
        .filter(([candidateId]) => Boolean(candidateId)),
    );

    return params.candidates.map((candidate) =>
      normalizeSuggestion(suggestionsById.get(candidate.postId), candidate),
    );
  } catch {
    return params.candidates.map((candidate) => ({
      candidateId: candidate.postId,
      reason: buildFallbackReason(candidate),
      replyOptions: buildFallbackReplyOptions(candidate),
      riskLevel: candidate.riskLevel,
      suggestedReply: buildFallbackReplyOptions(candidate)[0],
    }));
  }
}
