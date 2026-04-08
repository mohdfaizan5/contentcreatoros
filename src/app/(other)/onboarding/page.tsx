import OnboardingFlow from '@/components/onboarding/onboarding-flow';
import { ONBOARDING_FLOW_KEY } from '@/lib/onboarding';
import { createClient } from '@/lib/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Onboarding | SaaSFollo',
  description: 'Set up your X content strategy workspace',
};

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

  return <OnboardingFlow />;
}