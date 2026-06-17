import OnboardingFlow from '@/features/onboarding/components/onboarding-flow';
import { ONBOARDING_FLOW_KEY } from '@/features/onboarding/lib/onboarding';
import { getCurrentUserLinkedXHandle } from '@/features/x/lib/x-auth';
import { createClient } from '@/shared/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Onboarding | ContentOSX',
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
    redirect('/login');
  }

  const { count: onboardingAnswerCount, error: onboardingAnswersError } = await supabase
    .from('onboarding_answers')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('flow_key', ONBOARDING_FLOW_KEY);

  if (!onboardingAnswersError && (onboardingAnswerCount ?? 0) > 0) {
    redirect('/app');
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const linkedHandle = await getCurrentUserLinkedXHandle();
  const initialXHandle =
    normalizeXHandle(linkedHandle) ??
    normalizeXHandle(metadata.user_name) ??
    normalizeXHandle(metadata.preferred_username) ??
    normalizeXHandle(metadata.username) ??
    normalizeXHandle(metadata.screen_name);

  return (
    <OnboardingFlow
      initialXHandle={initialXHandle}
      redirectTo="/app?welcomeToContentOSX=true"
    />
  );
}
