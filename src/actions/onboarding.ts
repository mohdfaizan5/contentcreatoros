/**
 * Server actions for onboarding
 */
'use server';

import { createClient } from '@/lib/server';
import type { OnboardingAnswers } from '@/types/onboarding';
import {
  getPersistedAnswerEntries,
  getPersistedQuestionDefinitions,
  ONBOARDING_FLOW_KEY,
} from '@/lib/onboarding';

export interface SaveOnboardingPayload {
  answers: OnboardingAnswers;
}

async function syncOnboardingQuestionSchema() {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const questionDefinitions = getPersistedQuestionDefinitions();
  const currentQuestionKeys = questionDefinitions.map((question) => question.questionKey);

  const { data: existingQuestions, error: existingQuestionsError } = await supabase
    .from('onboarding_questions')
    .select('question_key')
    .eq('flow_key', ONBOARDING_FLOW_KEY);

  if (existingQuestionsError) {
    console.error(
      '[Onboarding DB Error] Failed to load onboarding question schema:',
      JSON.stringify(existingQuestionsError, null, 2),
    );
    return { error: 'Failed to sync onboarding schema.' as const };
  }

  const removedQuestionKeys =
    existingQuestions?.flatMap(({ question_key }) =>
      currentQuestionKeys.includes(question_key) ? [] : [question_key],
    ) ?? [];

  if (removedQuestionKeys.length > 0) {
    const { error: deactivateError } = await supabase
      .from('onboarding_questions')
      .update({
        is_active: false,
        updated_at: now,
      })
      .eq('flow_key', ONBOARDING_FLOW_KEY)
      .in('question_key', removedQuestionKeys);

    if (deactivateError) {
      console.error(
        '[Onboarding DB Error] Failed to deactivate removed onboarding questions:',
        JSON.stringify(deactivateError, null, 2),
      );
      return { error: 'Failed to sync onboarding schema.' as const };
    }
  }

  const { data: syncedQuestions, error: syncError } = await supabase
    .from('onboarding_questions')
    .upsert(
      questionDefinitions.map((question) => ({
        flow_key: question.flowKey,
        question_key: question.questionKey,
        question: question.question,
        is_active: true,
        updated_at: now,
      })),
      { onConflict: 'flow_key,question_key' },
    )
    .select('id, question_key');

  if (syncError || !syncedQuestions) {
    console.error(
      '[Onboarding DB Error] Failed to upsert onboarding question schema:',
      JSON.stringify(syncError, null, 2),
    );
    return { error: 'Failed to sync onboarding schema.' as const };
  }

  return {
    data: syncedQuestions,
  };
}

/**
 * Save the completed onboarding data
 */
export async function saveOnboarding(payload: SaveOnboardingPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const syncedQuestionsResult = await syncOnboardingQuestionSchema();

  if ('error' in syncedQuestionsResult) {
    return { error: 'Failed to sync onboarding schema. Please try again.' };
  }

  const questionIdByKey = new Map(
    syncedQuestionsResult.data.map((question) => [question.question_key, question.id]),
  );
  const currentQuestionKeys = getPersistedQuestionDefinitions().map(
    (question) => question.questionKey,
  );
  const answerEntries = getPersistedAnswerEntries(payload.answers);
  const answeredQuestionKeys = answerEntries.map((entry) => entry.questionKey);
  const now = new Date().toISOString();

  const { data: existingAnswerRows, error: existingAnswersError } = await supabase
    .from('onboarding_answers')
    .select('question_key')
    .eq('user_id', user.id)
    .eq('flow_key', ONBOARDING_FLOW_KEY);

  if (existingAnswersError) {
    console.error(
      '[Onboarding DB Error] Failed to load existing onboarding answers:',
      JSON.stringify(existingAnswersError, null, 2),
    );
    return { error: 'Failed to save onboarding data. Please try again.' };
  }

  const removableAnswerKeys =
    existingAnswerRows?.flatMap(({ question_key }) =>
      currentQuestionKeys.includes(question_key) && answeredQuestionKeys.includes(question_key)
        ? []
        : [question_key],
    ) ?? [];

  if (removableAnswerKeys.length > 0) {
    const { error: deleteError } = await supabase
      .from('onboarding_answers')
      .delete()
      .eq('user_id', user.id)
      .eq('flow_key', ONBOARDING_FLOW_KEY)
      .in('question_key', removableAnswerKeys);

    if (deleteError) {
      console.error(
        '[Onboarding DB Error] Failed to remove cleared onboarding answers:',
        JSON.stringify(deleteError, null, 2),
      );
      return { error: 'Failed to save onboarding data. Please try again.' };
    }
  }

  if (answerEntries.length > 0) {
    const answerRows = answerEntries.flatMap((entry) => {
      const questionId = questionIdByKey.get(entry.questionKey);

      if (!questionId) {
        return [];
      }

      return [
        {
          user_id: user.id,
          flow_key: ONBOARDING_FLOW_KEY,
          question_id: questionId,
          question_key: entry.questionKey,
          answer: entry.answer,
          answered_at: now,
          updated_at: now,
        },
      ];
    });

    const { error: answersError } = await supabase
      .from('onboarding_answers')
      .upsert(answerRows, { onConflict: 'user_id,flow_key,question_key' });

    if (answersError) {
      console.error(
        '[Onboarding DB Error] Failed to save onboarding answers:',
        JSON.stringify(answersError, null, 2),
      );
      return { error: 'Failed to save onboarding data. Please try again.' };
    }
  }

  return { success: true };
}

/**
 * Check if a user has completed onboarding
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { count, error } = await supabase
    .from('onboarding_answers')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('flow_key', ONBOARDING_FLOW_KEY);

  if (!error) {
    return (count ?? 0) > 0;
  }
  return false;
}
