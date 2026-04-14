import { redirect } from 'next/navigation';
import {
  ONBOARDING_FLOW_KEY,
  getAnswersFromPersistedRows,
  getQuestionSteps,
} from '@/lib/onboarding';
import { buildBrandVisualIdentity, type BrandVisualIdentity } from '@/lib/brand-visuals';
import { countAnsweredFields } from '@/lib/onboarding/question-ui-utils';
import { createClient } from '@/lib/server';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function firstString(values: unknown[]): string {
  for (const value of values) {
    const nextValue = readString(value);
    if (nextValue) {
      return nextValue;
    }
  }

  return '';
}

function extractDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function getTotalQuestionCount() {
  const questionSteps = getQuestionSteps();

  return questionSteps.reduce((count, step) => count + step.questions.length, 0);
}

export async function getBrandKitPageData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: answerRows, error } = await supabase
    .from('onboarding_answers')
    .select('question_key, answer')
    .eq('user_id', user.id)
    .eq('flow_key', ONBOARDING_FLOW_KEY);

  if (error) {
    console.error('[Brand Kit] Failed to load onboarding answers:', error);
  }

  const initialAnswers = getAnswersFromPersistedRows(answerRows ?? []);

  const { data: autofillRows, error: autofillError } = await supabase
    .from('onboarding_autofill_profiles')
    .select('brand_identity, inferred_answers, source_domain')
    .eq('user_id', user.id)
    .eq('flow_key', ONBOARDING_FLOW_KEY)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (autofillError) {
    console.error('[Brand Kit] Failed to load onboarding autofill profile:', autofillError);
  }

  const latestAutofillRow = Array.isArray(autofillRows) ? autofillRows[0] : null;
  const rawBrandIdentity = asRecord(latestAutofillRow?.brand_identity);
  const inferredAnswers = asRecord(latestAutofillRow?.inferred_answers);
  const fallbackDomain = firstString([
    latestAutofillRow?.source_domain,
    extractDomainFromUrl(readString(initialAnswers.website_url)),
  ]);

  const brandIdentity: BrandVisualIdentity = buildBrandVisualIdentity({
    ...(rawBrandIdentity as Partial<BrandVisualIdentity>),
    sourceDomain:
      readString(rawBrandIdentity.sourceDomain) ||
      readString(rawBrandIdentity.source_domain) ||
      fallbackDomain ||
      null,
  });

  const companyOverview = firstString([
    inferredAnswers.company_description,
    initialAnswers.company_description,
    brandIdentity.description,
  ]);

  return {
    answeredCount: countAnsweredFields(initialAnswers),
    brandIdentity,
    companyOverview,
    initialAnswers,
    totalQuestionCount: getTotalQuestionCount(),
  };
}
