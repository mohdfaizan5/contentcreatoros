import { redirect } from 'next/navigation';
import {
  ONBOARDING_FLOW_KEY,
  getAnswersFromPersistedRows,
  getQuestionSteps,
} from '@/lib/onboarding';
import { countAnsweredFields } from '@/lib/onboarding/question-ui-utils';
import { createClient } from '@/lib/server';

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

  return {
    answeredCount: countAnsweredFields(initialAnswers),
    initialAnswers,
    totalQuestionCount: getTotalQuestionCount(),
  };
}
