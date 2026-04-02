import OnboardingFlow from '@/components/onboarding/onboarding-flow';
import { ONBOARDING_FLOW_KEY } from '@/lib/onboarding';
import { createClient } from '@/lib/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Onboarding | SaaSFollo',
  description: 'Set up your X content strategy workspace',
};

type OnboardingPageProps = {
  searchParams: Promise<{ redirectTo?: string }>;
};

function getSafeRedirectTarget(value?: string): string {
  if (!value) return '/app/analytics';
  if (value === '/app') return value;
  if (value.startsWith('/app/')) return value;
  return '/app/analytics';
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;
  const redirectTo = getSafeRedirectTarget(resolvedSearchParams?.redirectTo);
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
    redirect(redirectTo);
  }

  return <OnboardingFlow redirectTo={redirectTo} />;
}
