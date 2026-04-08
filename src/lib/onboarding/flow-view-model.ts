import {
  CONTENT_ONBOARDING_STEPS,
  getQuestionSteps,
  getQuestionSummaryValue,
} from '@/lib/onboarding';
import type {
  OnboardingAnswers,
  OnboardingQuestionStepDefinition,
} from '@/types/onboarding';

const QUESTION_STEPS = getQuestionSteps();
const QUESTION_STEP_INDEXES = CONTENT_ONBOARDING_STEPS.flatMap((step, index) =>
  step.kind === 'questions' ? [index] : [],
);

export type OnboardingSummaryCard = OnboardingQuestionStepDefinition & {
  entries: Array<{
    key: string;
    label: string;
    value: string;
  }>;
  stepIndex: number;
};

export function getFlowQuestionSteps() {
  return QUESTION_STEPS;
}

export function getProgressPercentage(stepIndex: number): number {
  const questionStepPosition = QUESTION_STEP_INDEXES.indexOf(stepIndex);

  if (questionStepPosition < 0) {
    return 0;
  }

  return ((questionStepPosition + 1) / QUESTION_STEPS.length) * 100;
}

export function getQuestionStepNumber(stepId: string): number {
  return QUESTION_STEPS.findIndex((step) => step.id === stepId) + 1;
}

export function getOnboardingSummaryCards(
  answers: OnboardingAnswers,
): OnboardingSummaryCard[] {
  return CONTENT_ONBOARDING_STEPS.flatMap((step, stepIndex) =>
    step.kind === 'questions'
      ? [
          {
            ...step,
            stepIndex,
            entries: step.questions.map((question) => ({
              key: question.key,
              label: question.label,
              value: getQuestionSummaryValue(question, answers) ?? 'Skipped',
            })),
          },
        ]
      : [],
  );
}
