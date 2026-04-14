import OnboardingFlow from '@/components/onboarding/onboarding-flow';
import { ONBOARDING_FLOW_KEY } from '@/lib/onboarding';
import { createClient } from '@/lib/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Onboarding | SaaSFollo',
  description: 'Set up your X content strategy workspace',
};

function normalizeXHandle(raw: unknown) {
  if (typeof raw !== 'string') {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const urlMatch = trimmed.match(/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})/i);
  if (urlMatch?.[1]) {
    return `@${urlMatch[1]}`;
  }

  const withoutAt = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
  if (/^[A-Za-z0-9_]{1,15}$/.test(withoutAt)) {
    return `@${withoutAt}`;
  }

  return null;
}

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { count: onboardingAnswerCount, error: onboardingAnswersError } = await supabase
    .from('onboarding_answers')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('flow_key', ONBOARDING_FLOW_KEY);

  if (!onboardingAnswersError && (onboardingAnswerCount ?? 0) > 0) {
    redirect('/app/analytics');
  }

  const { data: storedXAccount } = await supabase
    .from('x_accounts')
    .select('username')
    .eq('user_id', user.id)
    .maybeSingle();

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const initialXHandle =
    normalizeXHandle(storedXAccount?.username) ??
    normalizeXHandle(metadata.user_name) ??
    normalizeXHandle(metadata.preferred_username) ??
    normalizeXHandle(metadata.username) ??
    normalizeXHandle(metadata.screen_name);

  return <OnboardingFlow initialXHandle={initialXHandle} />;
}