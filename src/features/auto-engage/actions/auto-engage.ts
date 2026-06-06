'use server';

import { revalidatePath } from 'next/cache';

import { ONBOARDING_FLOW_KEY } from '@/features/onboarding/lib/onboarding';
import { generateAutoEngageDraftSuggestions } from '@/features/auto-engage/lib/auto-engage-ai';
import { revalidateAppPaths } from '@/features/inspiration/lib/revalidate-app-paths';
import {
  ensureStoredXAccessToken,
  listPublishingXAccountsForCurrentUser,
} from '@/features/x/lib/x-auth';
import {
  getUserTimelinePosts,
  getXUsersByUsernames,
  searchRecentXTweets,
} from '@/features/x/lib/x';
import { createClient } from '@/shared/lib/supabase/server';
import type {
  AutoEngageGoal,
  AutoEngageProfile,
  AutoEngageRun,
  AutoEngageSuggestion,
  AutoEngageSuggestionRiskLevel,
  AutoEngageSuggestionStatus,
  AutoEngageTarget,
  XAccountRole,
} from '@/shared/types/database';

type OnboardingDefaults = {
  brandVoice: string;
  contentPillars: string[];
  niche: string;
  offer: string;
  targetAudience: string;
  topicsToAvoid: string[];
};

type AutoEngagePageAccount = {
  id: string;
  role: XAccountRole;
  username: string;
};

type AutoEngagePageProfile = AutoEngageProfile & {
  suggestions: AutoEngageSuggestion[];
  targets: AutoEngageTarget[];
  x_account_role: XAccountRole;
  x_account_username: string;
};

export type AutoEngagePageData = {
  onboardingDefaults: OnboardingDefaults;
  pageError: string | null;
  profiles: AutoEngagePageProfile[];
  xAccounts: AutoEngagePageAccount[];
};

type AutoEngageRunListItem = {
  id: string;
  created_at: string;
  profile_id: string;
  profile_name: string | null;
  x_account_id: string;
  x_account_role: XAccountRole;
  x_account_username: string;
  counts: {
    total: number;
    pending: number;
    copied: number;
    posted: number;
    skipped: number;
  };
};

export type AutoEngageRunsPageData = {
  pageError: string | null;
  runs: AutoEngageRunListItem[];
};

export type AutoEngageRunDetailData = {
  account: AutoEngagePageAccount;
  pageError: string | null;
  profile: AutoEngageProfile | null;
  run: AutoEngageRun;
  suggestions: AutoEngageSuggestion[];
};

type ActionResult<T = void> =
  | { data?: T; ok: true }
  | { error: string; ok: false };

type StoredOnboardingAnswer = {
  answer: unknown;
  question_key: string;
};

type SaveAutoEngageProfileInput = {
  brandVoice: string;
  contentPillars: string;
  dailyLimit: number;
  goal: AutoEngageGoal;
  niche: string;
  offer: string;
  profileName: string;
  targetAudience: string;
  topicsToAvoid: string;
  xAccountId: string;
};

const REVALIDATE_PATHS = ['/app/auto-engage', '/app/auto-engage/new', '/app/auto-engage/policies'];
const HARD_AVOID_TERMS = [
  'election',
  'genocide',
  'killed',
  'nsfw',
  'nude',
  'porn',
  'racist',
  'religion',
  'suicide',
  'war',
] as const;

function buildActionError(message: string): ActionResult<never> {
  return {
    error: message,
    ok: false,
  };
}

function buildActionSuccess<T>(data?: T): ActionResult<T> {
  return {
    data,
    ok: true,
  };
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
    const joined: string = [normalizeText(record.value), normalizeText(record.otherText)]
      .filter(Boolean)
      .join(', ');

    return joined;
  }

  return '';
}

function normalizeListInput(value: string) {
  return [...new Set(value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean))];
}

function clampDailyLimit(value: number) {
  return Math.max(1, Math.min(10, Math.round(value || 10)));
}

function toFriendlySupabaseError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) {
    return null;
  }

  if (error.code === '42P01') {
    return 'Auto Engage is not fully set up yet. Apply the latest database migration and reload the page.';
  }

  if (error.code === '23505') {
    return 'That item already exists.';
  }

  return error.message?.trim() || null;
}

function buildDefaultGoal(role: XAccountRole) {
  return role === 'founder' ? 'founder_personal_branding' : 'lead_generation';
}

function hasBlockedTopic(text: string, topicsToAvoid: string[]) {
  const normalized = text.toLowerCase();
  const blockedTerms = [...HARD_AVOID_TERMS, ...topicsToAvoid.map((topic) => topic.toLowerCase())];

  return blockedTerms.some((term) => term && normalized.includes(term));
}

function computeRiskLevel(params: {
  postText: string;
  possiblySensitive?: boolean;
  topicsToAvoid: string[];
}): AutoEngageSuggestionRiskLevel {
  if (params.possiblySensitive || hasBlockedTopic(params.postText, params.topicsToAvoid)) {
    return 'avoid' satisfies AutoEngageSuggestionRiskLevel;
  }

  const normalized = params.postText.toLowerCase();

  if (
    normalized.includes('breaking') ||
    normalized.includes('urgent') ||
    normalized.includes('lawsuit') ||
    normalized.includes('fired')
  ) {
    return 'medium' satisfies AutoEngageSuggestionRiskLevel;
  }

  return 'low' satisfies AutoEngageSuggestionRiskLevel;
}

function computeRecencyScore(createdAt: string | null) {
  if (!createdAt) {
    return 6;
  }

  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageHours = ageMs / 3_600_000;

  if (ageHours <= 2) return 24;
  if (ageHours <= 6) return 18;
  if (ageHours <= 24) return 12;
  if (ageHours <= 48) return 8;
  return 4;
}

function computeCandidateScore(params: {
  authorFollowerCount: number | null;
  createdAt: string | null;
  engagementCounts: {
    likes: number;
    quotes: number;
    replies: number;
    reposts: number;
  };
  postText: string;
  riskLevel: AutoEngageSuggestionRiskLevel;
  sourceType: 'account' | 'keyword';
}) {
  let score = params.sourceType === 'account' ? 38 : 28;
  score += computeRecencyScore(params.createdAt);

  if (params.postText.includes('?')) {
    score += 10;
  }

  if (params.postText.length <= 240) {
    score += 8;
  }

  if (!params.postText.includes('http')) {
    score += 4;
  }

  const engagementScore = Math.min(
    14,
    params.engagementCounts.replies * 2 +
      params.engagementCounts.reposts +
      Math.round(params.engagementCounts.likes / 8) +
      params.engagementCounts.quotes * 2,
  );
  score += engagementScore;

  const followers = params.authorFollowerCount ?? 0;
  if (followers >= 300 && followers <= 50_000) {
    score += 12;
  } else if (followers > 50_000 && followers <= 300_000) {
    score += 8;
  } else if (followers > 0) {
    score += 4;
  }

  if (params.riskLevel === 'medium') {
    score -= 12;
  }

  if (params.riskLevel === 'avoid') {
    score -= 60;
  }

  return Math.max(0, Math.min(100, score));
}

function isTimelinePostEligible(referencedTweets?: Array<{ type: string }>) {
  return !(referencedTweets ?? []).some(
    (reference) => reference.type === 'retweeted' || reference.type === 'replied_to',
  );
}

async function loadCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Sign in to manage Auto Engage.');
  }

  return user.id;
}

async function getOnboardingDefaultsForUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('onboarding_answers')
    .select('question_key, answer')
    .eq('user_id', userId)
    .eq('flow_key', ONBOARDING_FLOW_KEY);

  if (error || !data?.length) {
    return {
      brandVoice: '',
      contentPillars: [],
      niche: '',
      offer: '',
      targetAudience: '',
      topicsToAvoid: [],
    } satisfies OnboardingDefaults;
  }

  const answerMap = new Map(
    (data as StoredOnboardingAnswer[]).map((row) => [row.question_key, normalizeText(row.answer)]),
  );
  const tone = answerMap.get('tone') ?? '';
  const writingStyle = answerMap.get('writing_style') ?? '';

  return {
    brandVoice: [tone, writingStyle].filter(Boolean).join(' | '),
    contentPillars: normalizeListInput(answerMap.get('content_pillars') ?? ''),
    niche: answerMap.get('company_description') ?? '',
    offer:
      answerMap.get('unique_value_prop') ??
      answerMap.get('problem_solved') ??
      '',
    targetAudience: answerMap.get('target_audience') ?? '',
    topicsToAvoid: [],
  } satisfies OnboardingDefaults;
}

async function loadPublishableAccountById(xAccountId: string) {
  const accounts = await listPublishingXAccountsForCurrentUser();
  const account = accounts.find((entry) => entry.id === xAccountId) ?? null;

  if (!account || !account.account_role) {
    throw new Error('Choose a connected founder or company X account first.');
  }

  return account;
}

async function ensureAutoEngageProfile(
  xAccountId: string,
  userId: string,
) {
  const supabase = await createClient();
  const { data: existingProfile, error: existingProfileError } = await supabase
    .from('auto_engage_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('x_account_id', xAccountId)
    .maybeSingle();

  if (existingProfileError) {
    throw new Error(
      toFriendlySupabaseError(existingProfileError) ||
        'Unable to load the Auto Engage profile for this account.',
    );
  }

  if (existingProfile) {
    return existingProfile as AutoEngageProfile;
  }

  const account = await loadPublishableAccountById(xAccountId);
  const defaults = await getOnboardingDefaultsForUser(userId);
  const role = account.account_role;
  const payload = {
    brand_voice: defaults.brandVoice || null,
    content_pillars: defaults.contentPillars,
    daily_limit: 10,
    is_active: true,
    niche: defaults.niche || null,
    offer: defaults.offer || null,
    primary_goal: buildDefaultGoal(role),
    profile_name: role === 'company' ? `Company @${account.username}` : `Founder @${account.username}`,
    target_audience: defaults.targetAudience || null,
    topics_to_avoid: defaults.topicsToAvoid,
    user_id: userId,
    x_account_id: xAccountId,
  };

  const { data, error } = await supabase
    .from('auto_engage_profiles')
    .upsert(payload, {
      onConflict: 'user_id,x_account_id',
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(
      toFriendlySupabaseError(error) ||
        'Unable to create the Auto Engage profile for this X account.',
    );
  }

  return data as AutoEngageProfile;
}

function serializeTargets(
  profileId: string,
  targets: AutoEngageTarget[],
) {
  return targets.filter((target) => target.profile_id === profileId);
}

export async function getAutoEngagePageData(): Promise<AutoEngagePageData> {
  const userId = await loadCurrentUserId();
  const [supabase, xAccounts, onboardingDefaults] = await Promise.all([
    createClient(),
    listPublishingXAccountsForCurrentUser(),
    getOnboardingDefaultsForUser(userId),
  ]);

  const [{ data: profilesData, error: profilesError }, { data: targetsData, error: targetsError }] =
    await Promise.all([
      supabase
        .from('auto_engage_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
      supabase
        .from('auto_engage_targets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
    ]);

  const profiles = (profilesData ?? []) as AutoEngageProfile[];
  const targets = (targetsData ?? []) as AutoEngageTarget[];
  const pageError =
    toFriendlySupabaseError(profilesError) ||
    toFriendlySupabaseError(targetsError) ||
    null;

  const pageProfiles = profiles.map((profile): AutoEngagePageProfile | null => {
    const account = xAccounts.find((entry) => entry.id === profile.x_account_id);

    if (!account?.account_role) {
      return null;
    }

    return {
      ...profile,
      suggestions: [] as AutoEngageSuggestion[],
      targets: serializeTargets(profile.id, targets),
      x_account_role: account.account_role,
      x_account_username: account.username,
    };
  });

  return {
    onboardingDefaults,
    pageError,
    profiles: pageProfiles.filter((profile): profile is AutoEngagePageProfile => profile !== null),
    xAccounts: xAccounts
      .filter((account): account is typeof account & { account_role: XAccountRole } => Boolean(account.account_role))
      .map((account) => ({
        id: account.id,
        role: account.account_role,
        username: account.username,
      })),
  };
}

export async function listAutoEngageRuns(params: { limit?: number } = {}): Promise<AutoEngageRunsPageData> {
  const userId = await loadCurrentUserId();
  const supabase = await createClient();
  const limit = params.limit ?? 30;

  const [{ data: runsData, error: runsError }, { data: profilesData, error: profilesError }] =
    await Promise.all([
      supabase
        .from('auto_engage_runs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('auto_engage_profiles')
        .select('*')
        .eq('user_id', userId),
    ]);

  const runs = (runsData ?? []) as AutoEngageRun[];
  const profiles = (profilesData ?? []) as AutoEngageProfile[];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const pageError =
    toFriendlySupabaseError(runsError) ||
    toFriendlySupabaseError(profilesError) ||
    null;

  if (!runs.length) {
    return { pageError, runs: [] };
  }

  const xAccounts = await listPublishingXAccountsForCurrentUser();
  const runIds = runs.map((run) => run.id);
  const { data: suggestionsData, error: suggestionsError } = await supabase
    .from('auto_engage_suggestions')
    .select('run_id, status')
    .eq('user_id', userId)
    .in('run_id', runIds);

  const countsByRun = new Map<string, AutoEngageRunListItem['counts']>();
  for (const run of runs) {
    countsByRun.set(run.id, {
      total: 0,
      pending: 0,
      copied: 0,
      posted: 0,
      skipped: 0,
    });
  }

  for (const row of suggestionsData ?? []) {
    if (!row.run_id) continue;
    const counts = countsByRun.get(row.run_id);
    if (!counts) continue;
    counts.total += 1;
    if (row.status === 'copied') counts.copied += 1;
    if (row.status === 'posted') counts.posted += 1;
    if (row.status === 'skipped') counts.skipped += 1;
    if (row.status === 'pending') counts.pending += 1;
  }

  const mergedError =
    pageError ||
    toFriendlySupabaseError(suggestionsError) ||
    null;

  const runsWithCounts = runs
    .map((run) => {
      const account = xAccounts.find((entry) => entry.id === run.x_account_id);
      if (!account?.account_role) {
        return null;
      }

      const profile = profileById.get(run.profile_id);
      return {
        id: run.id,
        created_at: run.created_at,
        profile_id: run.profile_id,
        profile_name: profile?.profile_name ?? null,
        x_account_id: run.x_account_id,
        x_account_role: account.account_role,
        x_account_username: account.username,
        counts: countsByRun.get(run.id) ?? {
          total: 0,
          pending: 0,
          copied: 0,
          posted: 0,
          skipped: 0,
        },
      } satisfies AutoEngageRunListItem;
    })
    .filter((run): run is AutoEngageRunListItem => Boolean(run));

  return {
    pageError: mergedError,
    runs: runsWithCounts,
  };
}

export async function getAutoEngageRunDetail(runId: string): Promise<AutoEngageRunDetailData | null> {
  const userId = await loadCurrentUserId();
  const supabase = await createClient();
  const { data: runData, error: runError } = await supabase
    .from('auto_engage_runs')
    .select('*')
    .eq('id', runId)
    .eq('user_id', userId)
    .maybeSingle();

  if (runError || !runData) {
    return null;
  }

  const run = runData as AutoEngageRun;
  const [xAccounts, { data: suggestionsData, error: suggestionsError }, { data: profileData, error: profileError }] =
    await Promise.all([
      listPublishingXAccountsForCurrentUser(),
      supabase
        .from('auto_engage_suggestions')
        .select('*')
        .eq('user_id', userId)
        .eq('run_id', runId)
        .order('score', { ascending: false }),
      supabase
        .from('auto_engage_profiles')
        .select('*')
        .eq('id', run.profile_id)
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

  const account = xAccounts.find((entry) => entry.id === run.x_account_id);
  if (!account?.account_role) {
    return null;
  }

  const pageError =
    toFriendlySupabaseError(suggestionsError) ||
    toFriendlySupabaseError(profileError) ||
    null;

  return {
    account: {
      id: run.x_account_id,
      role: account.account_role,
      username: account.username,
    },
    pageError,
    profile: (profileData ?? null) as AutoEngageProfile | null,
    run,
    suggestions: (suggestionsData ?? []) as AutoEngageSuggestion[],
  };
}

export async function saveAutoEngageProfile(input: SaveAutoEngageProfileInput) {
  try {
    const userId = await loadCurrentUserId();
    const profile = await ensureAutoEngageProfile(input.xAccountId, userId);
    const supabase = await createClient();

    const { error } = await supabase
      .from('auto_engage_profiles')
      .update({
        brand_voice: input.brandVoice.trim() || null,
        content_pillars: normalizeListInput(input.contentPillars),
        daily_limit: clampDailyLimit(input.dailyLimit),
        niche: input.niche.trim() || null,
        offer: input.offer.trim() || null,
        primary_goal: input.goal,
        profile_name: input.profileName.trim() || profile.profile_name,
        target_audience: input.targetAudience.trim() || null,
        topics_to_avoid: normalizeListInput(input.topicsToAvoid),
      })
      .eq('id', profile.id)
      .eq('user_id', userId);

    if (error) {
      return buildActionError(
        toFriendlySupabaseError(error) || 'Unable to save this Auto Engage profile.',
      );
    }

    revalidateAppPaths(REVALIDATE_PATHS);

    return buildActionSuccess({ profileId: profile.id });
  } catch (error) {
    return buildActionError(
      error instanceof Error ? error.message : 'Unable to save this Auto Engage profile.',
    );
  }
}

export async function addAutoEngageTarget(input: {
  targetType: 'account' | 'keyword';
  value: string;
  xAccountId: string;
}) {
  try {
    const userId = await loadCurrentUserId();
    const normalizedValue =
      input.targetType === 'account'
        ? input.value.replace(/^@/, '').trim()
        : input.value.trim();

    if (!normalizedValue) {
      return buildActionError(
        `Add a ${input.targetType === 'account' ? 'tracked account' : 'keyword'} first.`,
      );
    }

    const profile = await ensureAutoEngageProfile(input.xAccountId, userId);
    const supabase = await createClient();
    const { error } = await supabase
      .from('auto_engage_targets')
      .insert({
        profile_id: profile.id,
        target_type: input.targetType,
        user_id: userId,
        value: normalizedValue,
      });

    if (error) {
      return buildActionError(
        toFriendlySupabaseError(error) ||
          'Unable to add this target right now.',
      );
    }

    revalidateAppPaths(REVALIDATE_PATHS);
    return buildActionSuccess();
  } catch (error) {
    return buildActionError(
      error instanceof Error ? error.message : 'Unable to add this target right now.',
    );
  }
}

export async function removeAutoEngageTarget(targetId: string) {
  try {
    const userId = await loadCurrentUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from('auto_engage_targets')
      .delete()
      .eq('id', targetId)
      .eq('user_id', userId);

    if (error) {
      return buildActionError(
        toFriendlySupabaseError(error) || 'Unable to remove that target right now.',
      );
    }

    revalidateAppPaths(REVALIDATE_PATHS);
    return buildActionSuccess();
  } catch (error) {
    return buildActionError(
      error instanceof Error ? error.message : 'Unable to remove that target right now.',
    );
  }
}

export async function updateAutoEngageSuggestionStatus(input: {
  runId?: string;
  status: AutoEngageSuggestionStatus;
  suggestionId: string;
}) {
  try {
    const userId = await loadCurrentUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from('auto_engage_suggestions')
      .update({
        status: input.status,
      })
      .eq('id', input.suggestionId)
      .eq('user_id', userId);

    if (error) {
      return buildActionError(
        toFriendlySupabaseError(error) || 'Unable to update that suggestion right now.',
      );
    }

    revalidatePath('/app/auto-engage');
    if (input.runId) {
      revalidatePath(`/app/auto-engage/${input.runId}`);
    }
    return buildActionSuccess();
  } catch (error) {
    return buildActionError(
      error instanceof Error ? error.message : 'Unable to update that suggestion right now.',
    );
  }
}

export async function generateAutoEngageSuggestions(input: {
  xAccountId: string;
}) {
  try {
    const userId = await loadCurrentUserId();
    const profile = await ensureAutoEngageProfile(input.xAccountId, userId);
    const account = await loadPublishableAccountById(input.xAccountId);
    const accessToken = await ensureStoredXAccessToken(account.id);
    const supabase = await createClient();
    const [{ data: targetsData, error: targetsError }, { data: refreshedProfileData, error: refreshedProfileError }] = await Promise.all([
      supabase
        .from('auto_engage_targets')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
      supabase
        .from('auto_engage_profiles')
        .select('*')
        .eq('id', profile.id)
        .eq('user_id', userId)
        .single(),
    ]);

    if (targetsError || refreshedProfileError) {
      return buildActionError(
        toFriendlySupabaseError(targetsError) ||
          toFriendlySupabaseError(refreshedProfileError) ||
          'Unable to load the latest Auto Engage settings.',
      );
    }

    const refreshedProfile = (refreshedProfileData ?? profile) as AutoEngageProfile;
    const targets = (targetsData ?? []) as AutoEngageTarget[];

    if (!targets.length) {
      return buildActionError('Add at least one tracked account or keyword before generating suggestions.');
    }

  const candidatesByPostId = new Map<
    string,
    {
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
      sourceType: 'account' | 'keyword';
      sourceValue: string;
    }
  >();

  const accountTargets = targets.filter((target) => target.target_type === 'account');
  const keywordTargets = targets.filter((target) => target.target_type === 'keyword');

    if (accountTargets.length) {
      const trackedUsers = await getXUsersByUsernames(
        accessToken,
        accountTargets.map((target) => target.value),
      );

      for (const trackedUser of trackedUsers) {
        const sourceValue = trackedUser.username;
        const tweets = await getUserTimelinePosts(accessToken, trackedUser.id, 6);

      for (const tweet of tweets) {
        if (!isTimelinePostEligible(tweet.referenced_tweets)) {
          continue;
        }

        const riskLevel = computeRiskLevel({
          postText: tweet.text,
          possiblySensitive: tweet.possibly_sensitive,
          topicsToAvoid: refreshedProfile.topics_to_avoid ?? [],
        });
        const engagementCounts = {
          likes: tweet.public_metrics?.like_count ?? 0,
          quotes: tweet.public_metrics?.quote_count ?? 0,
          replies: tweet.public_metrics?.reply_count ?? 0,
          reposts: tweet.public_metrics?.retweet_count ?? 0,
        };
        const candidate = {
          authorFollowerCount: trackedUser.public_metrics?.followers_count ?? null,
          authorId: trackedUser.id,
          authorName: trackedUser.name,
          authorUsername: trackedUser.username,
          createdAt: tweet.created_at ?? null,
          engagementCounts,
          postId: tweet.id,
          postText: tweet.text,
          postUrl: `https://x.com/${trackedUser.username}/status/${tweet.id}`,
          riskLevel,
          score: computeCandidateScore({
            authorFollowerCount: trackedUser.public_metrics?.followers_count ?? null,
            createdAt: tweet.created_at ?? null,
            engagementCounts,
            postText: tweet.text,
            riskLevel,
            sourceType: 'account',
          }),
          sourceType: 'account' as const,
          sourceValue,
        };

        const existing = candidatesByPostId.get(tweet.id);
        if (!existing || existing.score < candidate.score) {
          candidatesByPostId.set(tweet.id, candidate);
        }
      }
      }
    }

    for (const keywordTarget of keywordTargets) {
      const tweets = await searchRecentXTweets(
        accessToken,
        `${keywordTarget.value} -is:retweet -is:reply`,
        12,
      );

    for (const tweet of tweets) {
      if (!tweet.author?.username) {
        continue;
      }

      const riskLevel = computeRiskLevel({
        postText: tweet.text,
        possiblySensitive: tweet.possibly_sensitive,
        topicsToAvoid: refreshedProfile.topics_to_avoid ?? [],
      });
      const engagementCounts = {
        likes: tweet.public_metrics?.like_count ?? 0,
        quotes: tweet.public_metrics?.quote_count ?? 0,
        replies: tweet.public_metrics?.reply_count ?? 0,
        reposts: tweet.public_metrics?.retweet_count ?? 0,
      };
      const candidate = {
        authorFollowerCount: tweet.author.public_metrics?.followers_count ?? null,
        authorId: tweet.author.id,
        authorName: tweet.author.name,
        authorUsername: tweet.author.username,
        createdAt: tweet.created_at ?? null,
        engagementCounts,
        postId: tweet.id,
        postText: tweet.text,
        postUrl: `https://x.com/${tweet.author.username}/status/${tweet.id}`,
        riskLevel,
        score: computeCandidateScore({
          authorFollowerCount: tweet.author.public_metrics?.followers_count ?? null,
          createdAt: tweet.created_at ?? null,
          engagementCounts,
          postText: tweet.text,
          riskLevel,
          sourceType: 'keyword',
        }),
        sourceType: 'keyword' as const,
        sourceValue: keywordTarget.value,
      };

      const existing = candidatesByPostId.get(tweet.id);
      if (!existing || existing.score < candidate.score) {
        candidatesByPostId.set(tweet.id, candidate);
      }
    }
    }

    const rankedCandidates = [...candidatesByPostId.values()]
      .filter((candidate) => candidate.riskLevel !== 'avoid')
      .sort((left, right) => right.score - left.score)
      .slice(0, clampDailyLimit(refreshedProfile.daily_limit));

    if (!rankedCandidates.length) {
      return buildActionError('No safe, relevant engagement opportunities were found from the current targets.');
    }

    const aiSuggestions = await generateAutoEngageDraftSuggestions({
      brandVoice: refreshedProfile.brand_voice ?? '',
      candidates: rankedCandidates,
      contentPillars: refreshedProfile.content_pillars ?? [],
      goal: refreshedProfile.primary_goal,
      niche: refreshedProfile.niche ?? '',
      offer: refreshedProfile.offer ?? '',
      targetAudience: refreshedProfile.target_audience ?? '',
      topicsToAvoid: refreshedProfile.topics_to_avoid ?? [],
    });

    const suggestionByCandidateId = new Map(
      aiSuggestions.map((suggestion) => [suggestion.candidateId, suggestion] as const),
    );
    const surfacedForDate = new Date().toISOString().slice(0, 10);

    const { data: runData, error: runError } = await supabase
      .from('auto_engage_runs')
      .insert({
        profile_id: profile.id,
        user_id: userId,
        x_account_id: profile.x_account_id,
      })
      .select('id')
      .single();

    if (runError || !runData) {
      return buildActionError(
        toFriendlySupabaseError(runError) || 'Unable to start this Auto Engage run.',
      );
    }

    const runId = runData.id as string;

    const insertPayload = rankedCandidates.map((candidate) => {
      const suggestion = suggestionByCandidateId.get(candidate.postId);
      return {
      metrics: {
        followers_count: candidate.authorFollowerCount,
        likes: candidate.engagementCounts.likes,
        quotes: candidate.engagementCounts.quotes,
        replies: candidate.engagementCounts.replies,
        reposts: candidate.engagementCounts.reposts,
      },
      profile_id: profile.id,
      reason:
        suggestion?.reason ??
        'Relevant match with a clear opportunity to add something useful to the conversation.',
      reply_options: suggestion?.replyOptions ?? [],
      risk_level: suggestion?.riskLevel ?? candidate.riskLevel,
      run_id: runId,
      score: candidate.score,
      source_type: candidate.sourceType,
      source_value: candidate.sourceValue,
      status: 'pending',
      suggested_reply: suggestion?.suggestedReply ?? '',
      surfaced_for_date: surfacedForDate,
      user_id: userId,
      x_account_id: profile.x_account_id,
      x_post_author_id: candidate.authorId,
      x_post_author_name: candidate.authorName,
      x_post_author_username: candidate.authorUsername,
      x_post_created_at: candidate.createdAt,
      x_post_id: candidate.postId,
      x_post_text: candidate.postText,
      x_post_url: candidate.postUrl,
      };
    });

    const { error } = await supabase
      .from('auto_engage_suggestions')
      .insert(insertPayload);

    if (error) {
      await supabase
        .from('auto_engage_runs')
        .delete()
        .eq('id', runId)
        .eq('user_id', userId);

      return buildActionError(
        toFriendlySupabaseError(error) || 'Unable to save the latest Auto Engage suggestions.',
      );
    }

    revalidateAppPaths(REVALIDATE_PATHS);
    revalidatePath(`/app/auto-engage/${runId}`);

    return buildActionSuccess({
      count: insertPayload.length,
      runId,
    });
  } catch (error) {
    return buildActionError(
      error instanceof Error ? error.message : 'Unable to generate the Auto Engage queue right now.',
    );
  }
}
