import { isOtherOptionSelected, OTHER_OPTION_VALUE } from '@/lib/onboarding';
import type {
  OnboardingAnswers,
  OnboardingOption,
  OnboardingQuestion,
  OnboardingQuestionStepDefinition,
} from '@/types/onboarding';

type SelectQuestion = Extract<
  OnboardingQuestion,
  { type: 'single-select' | 'multi-select' }
>;

export function buildOptionsWithOther(question: SelectQuestion): OnboardingOption[] {
  if (!question.otherOption) {
    return question.options;
  }

  return [
    ...question.options,
    {
      value: OTHER_OPTION_VALUE,
      label: question.otherOption.optionLabel ?? 'Other',
      description: 'Add a custom answer',
    },
  ];
}

export function shouldShowOtherInput(
  question: OnboardingQuestion,
  answers: OnboardingAnswers,
): boolean {
  if (question.type !== 'single-select' && question.type !== 'multi-select') {
    return false;
  }

  return isOtherOptionSelected(question, answers);
}

export function countAnsweredFields(answers: OnboardingAnswers): number {
  return Object.entries(answers).filter(([key, value]) => {
    if (key.endsWith('_other')) {
      return typeof value === 'string' && value.trim().length > 0;
    }

    return Array.isArray(value)
      ? value.length > 0
      : typeof value === 'string'
        ? value.trim().length > 0
        : false;
  }).length;
}

export function countAnsweredQuestionsInStep(
  step: OnboardingQuestionStepDefinition,
  answers: OnboardingAnswers,
): number {
  return step.questions.filter((question) => {
    const value = answers[question.key];

    return Array.isArray(value)
      ? value.length > 0
      : typeof value === 'string'
        ? value.trim().length > 0
        : false;
  }).length;
}
