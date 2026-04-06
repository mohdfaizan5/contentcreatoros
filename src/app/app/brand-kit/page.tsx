import BrandSettingsForm from '@/components/settings/brand-settings-form';
import { ONBOARDING_FLOW_KEY, getAnswersFromPersistedRows } from '@/lib/onboarding';
import { createClient } from '@/lib/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Brand Kit | ContentOSX',
  description: 'Edit your saved brand settings and onboarding data',
};

export default async function BrandSettingsPage() {
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
    console.error('[Brand Settings] Failed to load onboarding answers:', error);
  }

  const initialAnswers = getAnswersFromPersistedRows(answerRows ?? []);

  return <BrandSettingsForm initialAnswers={initialAnswers} />;
}