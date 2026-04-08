export type OnboardingMilestone = {
  id: string;
  title: string;
  description: string;
  stepIds: string[];
};

export const ONBOARDING_IMPORTANT_MILESTONES: OnboardingMilestone[] = [
  {
    id: 'brand-core',
    title: 'Brand Core',
    description: 'Company basics and audience',
    stepIds: ['company-basics', 'audience'],
  },
  {
    id: 'goals-voice',
    title: 'Goals and Voice',
    description: 'Outcomes and communication style',
    stepIds: ['goals', 'style'],
  },
  {
    id: 'strategy',
    title: 'Publishing Plan',
    description: 'Cadence, pillars, and formats',
    stepIds: ['strategy'],
  },
  {
    id: 'positioning',
    title: 'Positioning',
    description: 'Offer details and market context',
    stepIds: ['product-details', 'competitors', 'capability'],
  },
];

export function getActiveMilestoneStep(
  activeQuestionStepId: string | undefined,
  isReviewStep: boolean,
) {
  if (isReviewStep) {
    return ONBOARDING_IMPORTANT_MILESTONES.length;
  }

  if (!activeQuestionStepId) {
    return 1;
  }

  const index = ONBOARDING_IMPORTANT_MILESTONES.findIndex((milestone) =>
    milestone.stepIds.includes(activeQuestionStepId),
  );

  return index >= 0 ? index + 1 : 1;
}
