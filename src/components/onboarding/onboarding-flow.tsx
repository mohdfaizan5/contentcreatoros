'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Lifebuoy,
  PencilSimple,
  SpinnerGap,
  TrendUp,
  WarningCircle,
} from '@phosphor-icons/react';

import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import {
  VerticalStepperExample,
  type VerticalStepperStep,
} from '@/components/vertical-stepper-example';
import { saveOnboarding } from '@/actions/onboarding';
import {
  CONTENT_ONBOARDING_STEPS,
  getInitialOnboardingAnswers,
  isQuestionComplete,
  isStepComplete,
  isStepSkippable,
} from '@/lib/onboarding';
import {
  getFlowQuestionSteps,
  getOnboardingSummaryCards,
  getProgressPercentage,
  getQuestionStepNumber,
} from '@/lib/onboarding/flow-view-model';
import {
  buildOptionsWithOther,
  shouldShowOtherInput,
} from '@/lib/onboarding/question-ui-utils';
import {
  getActiveMilestoneStep,
  ONBOARDING_IMPORTANT_MILESTONES,
} from '@/lib/onboarding/visual-flow';
import type {
  OnboardingAnswers,
  OnboardingOption,
  OnboardingQuestion,
  OnboardingQuestionStepDefinition,
  OnboardingScreenStepDefinition,
} from '@/types/onboarding';
import {
  OnboardingCheckboxGroup,
  OnboardingField,
  OnboardingRadioGroup,
  OnboardingTagInput,
} from './onboarding-cards';
import {
  OnboardingSpeechInput,
  OnboardingSpeechTextarea,
} from './onboarding-speech-fields';
import { useOptionClickSound } from '@/hooks/use-option-click-sound';

type OnboardingStepRendererProps = {
  answers: OnboardingAnswers;
  currentStepIndex: number;
  onBack: () => void;
  onNext: () => void;
  progressPercentage: number;
  step: OnboardingScreenStepDefinition;
  totalSteps: number;
  updateAnswer: (key: string, value: OnboardingAnswers[string]) => void;
};

type OnboardingFlowProps = {
  redirectTo?: string;
  stepRenderers?: Partial<
    Record<string, (props: OnboardingStepRendererProps) => React.ReactNode>
  >;
};

const slideVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 32 : -32,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction < 0 ? 32 : -32,
  }),
};

const QUESTION_STEPS = getFlowQuestionSteps();
const QUESTION_STEP_MAP = new Map(
  QUESTION_STEPS.map((step) => [step.id, step]),
);

function withOptionVisuals(options: OnboardingOption[]) {
  return options.map((option, index) => ({
    ...option,
    icon:
      option.icon ?? (
        <span className="inline-flex size-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
          {option.label.charAt(0).toUpperCase() || String(index + 1)}
        </span>
      ),
  }));
}



export default function OnboardingFlow({
  redirectTo = '/app/analytics',
  stepRenderers,
}: OnboardingFlowProps) {
  const router = useRouter();
  const playOptionClick = useOptionClickSound();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(() =>
    getInitialOnboardingAnswers(),
  );
  const [questionIndexByStep, setQuestionIndexByStep] = useState<
    Record<string, number>
  >({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeStep =
    currentStepIndex >= 0 && currentStepIndex < CONTENT_ONBOARDING_STEPS.length
      ? CONTENT_ONBOARDING_STEPS[currentStepIndex]
      : null;
  const activeQuestionStep = activeStep?.kind === 'questions' ? activeStep : null;
  const isReviewStep = currentStepIndex === CONTENT_ONBOARDING_STEPS.length;
  const canContinue = activeQuestionStep ? isStepComplete(activeQuestionStep, answers) : true;
  const progressPercentage = getProgressPercentage(currentStepIndex);
  const questionStepNumber = activeQuestionStep
    ? getQuestionStepNumber(activeQuestionStep.id)
    : 0;
  const activeMilestoneStep = getActiveMilestoneStep(
    activeQuestionStep?.id,
    isReviewStep,
  );
  const activeQuestionIndex = activeQuestionStep
    ? Math.min(
        questionIndexByStep[activeQuestionStep.id] ?? 0,
        Math.max(activeQuestionStep.questions.length - 1, 0),
      )
    : 0;
  const currentQuestion = activeQuestionStep
    ? activeQuestionStep.questions[activeQuestionIndex]
    : null;
  const isLastQuestionInStep = activeQuestionStep
    ? activeQuestionIndex >= activeQuestionStep.questions.length - 1
    : true;
  const isCurrentQuestionComplete = currentQuestion
    ? isQuestionComplete(currentQuestion, answers)
    : true;

  const summaryCards = useMemo(
    () => getOnboardingSummaryCards(answers),
    [answers],
  );

  const milestoneSteps = useMemo<VerticalStepperStep[]>(
    () =>
      ONBOARDING_IMPORTANT_MILESTONES.map((milestone, index) => {
        const completed =
          isReviewStep ||
          milestone.stepIds.every((stepId) => {
            const step = QUESTION_STEP_MAP.get(stepId);
            return step ? isStepComplete(step, answers) : false;
          });

        return {
          step: index + 1,
          title: milestone.title,
          description: milestone.description,
          completed,
        };
      }),
    [answers, isReviewStep],
  );

  const updateAnswer = (key: string, value: OnboardingAnswers[string]) => {
    setSaveError(null);
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [key]: value,
    }));
  };

  const setActiveQuestionIndex = (nextIndex: number) => {
    if (!activeQuestionStep) {
      return;
    }

    setQuestionIndexByStep((current) => ({
      ...current,
      [activeQuestionStep.id]: Math.max(0, nextIndex),
    }));
  };

  const goNext = () => {
    setSaveError(null);
    setDirection(1);
    setCurrentStepIndex((currentIndex) =>
      Math.min(CONTENT_ONBOARDING_STEPS.length, currentIndex + 1),
    );
  };

  const goBack = () => {
    setSaveError(null);
    setDirection(-1);
    setCurrentStepIndex((currentIndex) => Math.max(0, currentIndex - 1));
  };

  const goToNextQuestion = () => {
    if (!activeQuestionStep) {
      return;
    }

    if (isLastQuestionInStep) {
      goNext();
      return;
    }

    setSaveError(null);
    setActiveQuestionIndex(activeQuestionIndex + 1);
  };

  const goToPreviousQuestion = () => {
    if (!activeQuestionStep || activeQuestionIndex <= 0) {
      goBack();
      return;
    }

    setSaveError(null);
    setActiveQuestionIndex(activeQuestionIndex - 1);
  };

  const goToMilestone = (milestoneStep: number) => {
    const milestone = ONBOARDING_IMPORTANT_MILESTONES[milestoneStep - 1];

    if (!milestone) {
      return;
    }

    const firstStepId = milestone.stepIds[0];
    const nextIndex = CONTENT_ONBOARDING_STEPS.findIndex(
      (step): step is OnboardingQuestionStepDefinition =>
        step.kind === 'questions' && step.id === firstStepId,
    );

    if (nextIndex < 0) {
      return;
    }

    setSaveError(null);
    setDirection(nextIndex >= currentStepIndex ? 1 : -1);
    setCurrentStepIndex(nextIndex);
  };

  const handleSubmit = () => {
    setSaveError(null);
    startTransition(async () => {
      const result = await saveOnboarding({ answers });

      if (result.error) {
        setSaveError(result.error);
        return;
      }

      setShowSuccess(true);
    });
  };

  const renderQuestion = (question: OnboardingQuestion) => {
    const otherInputVisible = shouldShowOtherInput(question, answers);
    const rawValue = answers[question.key];

    switch (question.type) {
      case 'text':
        return (
          <OnboardingField
            key={question.key}
            label={question.label}
            description={question.description}
            helperText={question.helperText}
            required={question.required}
          >
            <OnboardingSpeechInput
              type={question.inputType ?? 'text'}
              value={typeof rawValue === 'string' ? rawValue : ''}
              onValueChange={(value) => updateAnswer(question.key, value)}
              placeholder={question.placeholder}
              className="h-12 rounded-md border-slate-200 bg-white"
            />
          </OnboardingField>
        );
      case 'textarea':
        return (
          <OnboardingField
            key={question.key}
            label={question.label}
            description={question.description}
            helperText={question.helperText}
            required={question.required}
          >
            <OnboardingSpeechTextarea
              value={typeof rawValue === 'string' ? rawValue : ''}
              onValueChange={(value) => updateAnswer(question.key, value)}
              placeholder={question.placeholder}
              rows={question.rows ?? 4}
              className="rounded-md border-slate-200 bg-white"
            />
          </OnboardingField>
        );
      case 'single-select': {
        const otherOption = question.otherOption;
        const otherAnswerKey = otherOption?.answerKey;
        const options = withOptionVisuals(buildOptionsWithOther(question));

        return (
          <div key={question.key} className="space-y-3">
            <OnboardingField
              label={question.label}
              description={question.description}
              helperText={question.helperText}
              required={question.required}
            >
              <OnboardingRadioGroup
                layout={question.layout}
                value={typeof rawValue === 'string' ? rawValue : null}
                onChange={(value) => updateAnswer(question.key, value)}
                onOptionSelect={playOptionClick}
                options={options}
              />
            </OnboardingField>

            {otherInputVisible && otherOption && otherAnswerKey ? (
              <OnboardingField label={otherOption.label}>
                <OnboardingSpeechInput
                  value={
                    typeof answers[otherAnswerKey] === 'string'
                      ? answers[otherAnswerKey]
                      : ''
                  }
                  onValueChange={(value) =>
                    updateAnswer(otherAnswerKey, value)
                  }
                  placeholder={otherOption.placeholder}
                  className="h-11 rounded-md border-slate-200 bg-white"
                />
              </OnboardingField>
            ) : null}
          </div>
        );
      }
      case 'multi-select': {
        const otherOption = question.otherOption;
        const otherAnswerKey = otherOption?.answerKey;
        const options = withOptionVisuals(buildOptionsWithOther(question));
        const values = Array.isArray(rawValue) ? rawValue : [];

        return (
          <div key={question.key} className="space-y-3">
            <OnboardingField
              label={question.label}
              description={question.description}
              helperText={question.helperText}
              required={question.required}
            >
              <OnboardingCheckboxGroup
                layout={question.layout}
                values={values}
                maxSelections={question.maxSelections}
                onChange={(value) => updateAnswer(question.key, value)}
                onOptionSelect={playOptionClick}
                options={options}
              />
            </OnboardingField>

            {otherInputVisible && otherOption && otherAnswerKey ? (
              <OnboardingField label={otherOption.label}>
                <OnboardingSpeechInput
                  value={
                    typeof answers[otherAnswerKey] === 'string'
                      ? answers[otherAnswerKey]
                      : ''
                  }
                  onValueChange={(value) =>
                    updateAnswer(otherAnswerKey, value)
                  }
                  placeholder={otherOption.placeholder}
                  className="h-11 rounded-md border-slate-200 bg-white"
                />
              </OnboardingField>
            ) : null}
          </div>
        );
      }
      case 'tag-input':
        return (
          <OnboardingField
            key={question.key}
            label={question.label}
            description={question.description}
            helperText={question.helperText}
            required={question.required}
          >
            <OnboardingTagInput
              values={Array.isArray(rawValue) ? rawValue : []}
              onChange={(value) => updateAnswer(question.key, value)}
              placeholder={question.placeholder}
              maxItems={question.maxItems}
            />
          </OnboardingField>
        );
    }
  };

  if (showSuccess) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#eef2f8] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl rounded-4xl border border-slate-200 bg-white p-8 text-center shadow-[0_24px_50px_-40px_rgba(15,23,42,0.55)]"
        >
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-slate-900 text-white">
            <CheckCircle className="size-8" weight="fill" />
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">
            Your onboarding profile is ready
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            We saved your content strategy inputs in a structured format so the next
            step can generate a sharper 30-day X plan.
          </p>
          <Button
            className="mt-8 h-11 rounded-full px-6"
            onClick={() => router.push(redirectTo)}
          >
            Continue to workspace
            <ArrowRight className="size-4" />
          </Button>
        </motion.div>
      </div>
    );
  }

  const renderer =
    activeStep?.kind === 'screen' ? stepRenderers?.[activeStep.id] : undefined;

  return (
    <div className="min-h-svh bg-[#e8edf5]">
      <div className="mx-auto w-full max-w-7xl md:min-h-svh">
        <div className="grid md:min-h-svh md:grid-cols-[296px_1fr]">
          <aside className="hidden flex-col bg-[linear-gradient(180deg,#1f6fff_0%,#184dc0_100%)] text-white md:flex">
            <div className="px-7 pt-7">
              <Logo
                height={22}
                width={22}
                full
                textClassName="ml-[1px] text-sm font-semibold text-white"
              />
            </div>
            <div className="px-6 pt-8">
              <VerticalStepperExample
                onValueChange={goToMilestone}
                steps={milestoneSteps}
                value={activeMilestoneStep}
              />
            </div>

            <div className="mt-auto px-6 pb-6">
              <div className="rounded-lg border border-white/20 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-white/70">
                  Quick Setup
                </p>
                <p className="mt-2 text-sm text-white/85">
                  We only show milestone steps here to keep the flow calm and focused.
                </p>
              </div>
            </div>
          </aside>

          <section className="flex min-h-svh flex-col bg-[#f4f6fa] md:min-h-0">
            <header className="px-5 py-4 md:px-10 md:py-6">
              <div className="flex items-center justify-between gap-4">
                <div className="md:hidden">
                  <Logo
                    height={22}
                    width={22}
                    full
                    textClassName="ml-[1px] text-sm font-semibold text-slate-950"
                  />
                </div>
                <p className="ml-auto text-sm text-slate-500">
                  Having troubles?{' '}
                  <a
                    href="mailto:support@contentosx.com"
                    className="font-semibold text-[#1f6fff] hover:underline"
                  >
                    Get Help
                  </a>
                </p>
              </div>

              {activeQuestionStep && !isReviewStep ? (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.14em] text-slate-500 md:text-sm md:tracking-[0.08em]">
                    <p>
                      Question Step {questionStepNumber} of {QUESTION_STEPS.length}
                    </p>
                    <p className="hidden md:block">{activeQuestionStep.title}</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#1f6fff,#39a8ff)] transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </header>

            <main className="flex-1 px-4 pb-6 md:px-10 md:pb-10">
              <div className="mx-auto w-full max-w-3xl">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentStepIndex}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    {activeStep?.kind === 'screen'
                      ? renderer?.({
                        answers,
                        currentStepIndex,
                        onBack: goBack,
                        onNext: goNext,
                        progressPercentage,
                        step: activeStep,
                        totalSteps: CONTENT_ONBOARDING_STEPS.length,
                        updateAnswer,
                      }) ?? <DefaultEntryStep onNext={goNext} step={activeStep} />
                      : null}

                    {activeQuestionStep ? (
                      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_20px_40px_-35px_rgba(15,23,42,0.65)] md:p-7">
                        <div className="space-y-3 pb-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1f6fff]">
                            {activeQuestionStep.eyebrow}
                          </p>
                          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                            {activeQuestionStep.title}
                          </h2>
                          <p className="text-sm leading-7 text-slate-500 md:text-base">
                            {activeQuestionStep.description}
                          </p>
                          <div className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Question {activeQuestionIndex + 1} of {activeQuestionStep.questions.length}
                          </div>
                        </div>

                        <div className="space-y-7">
                          {currentQuestion ? renderQuestion(currentQuestion) : null}
                        </div>

                        {isStepSkippable(activeQuestionStep) ? (
                          <div className="mt-6 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                            <Lifebuoy className="size-3.5" weight="bold" />
                            Optional section
                          </div>
                        ) : null}
                      </section>
                    ) : null}

                    {isReviewStep ? (
                      <section className="space-y-6">
                        <div className="max-w-2xl space-y-3">
                          <div className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs uppercase tracking-[0.24em] text-emerald-700">
                            Review
                          </div>
                          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                            Review your onboarding answers
                          </h2>
                          <p className="text-sm leading-7 text-slate-600">
                            Everything here is editable. This is the structured context the product
                            will use when generating a 30-day X strategy.
                          </p>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                          {summaryCards.map((card) => (
                            <div
                              key={card.id}
                              className="rounded-xl border border-white/80 bg-white/88 p-6 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.32)]"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                                    {card.eyebrow}
                                  </p>
                                  <h3 className="mt-2 text-lg font-semibold text-slate-950">
                                    {card.title}
                                  </h3>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="rounded-md text-slate-500"
                                  onClick={() => {
                                    setSaveError(null);
                                    setDirection(-1);
                                    setCurrentStepIndex(card.stepIndex);
                                  }}
                                >
                                  <PencilSimple className="size-4" />
                                  Edit
                                </Button>
                              </div>
                              <div className="mt-5 space-y-4">
                                {card.entries.map((entry) => (
                                  <div key={entry.key} className="rounded-lg bg-slate-50 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                      {entry.label}
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-slate-700">
                                      {entry.value}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(37,99,235,0.92))] p-6 text-white shadow-[0_28px_80px_-42px_rgba(15,23,42,0.5)]">
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-2">
                              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-white/70">
                                <TrendUp className="size-3.5" weight="fill" />
                                Ready to generate
                              </p>
                              <p className="text-lg font-semibold">
                                Save this profile and move into the X planning workspace.
                              </p>
                              {saveError ? (
                                <p className="inline-flex items-center gap-2 text-sm text-rose-200">
                                  <WarningCircle className="size-4" weight="fill" />
                                  {saveError}
                                </p>
                              ) : null}
                            </div>
                            <Button
                              type="button"
                              onClick={handleSubmit}
                              disabled={isPending}
                              className="h-11 rounded-full bg-white px-6 text-slate-950 hover:bg-slate-100"
                            >
                              {isPending ? (
                                <>
                                  <SpinnerGap className="size-4 animate-spin" />
                                  Saving
                                </>
                              ) : (
                                <>
                                  Generate my 30-day strategy
                                  <ArrowRight className="size-4" />
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </section>
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>

            {activeStep?.kind !== 'screen' ? (
              <footer className="border-t border-slate-200/80 bg-white px-4 py-4 md:px-10">
                <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={goToPreviousQuestion}
                    disabled={currentStepIndex <= 0 || isPending}
                    className="rounded-md text-slate-600"
                  >
                    <ArrowLeft className="size-4" />
                    {activeQuestionStep && activeQuestionIndex > 0 ? 'Previous question' : 'Back'}
                  </Button>

                  <div className="flex items-center gap-3">
                    {activeQuestionStep && isStepSkippable(activeQuestionStep) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={goNext}
                        disabled={isPending}
                        className="rounded-md text-slate-500"
                      >
                        Skip for now
                      </Button>
                    ) : null}

                    {!isReviewStep ? (
                      <Button
                        type="button"
                        onClick={goToNextQuestion}
                        disabled={
                          activeQuestionStep
                            ? isLastQuestionInStep
                              ? !canContinue
                              : !isCurrentQuestionComplete
                            : false
                        }
                        className="h-11 rounded-md bg-[#1f6fff] px-6 text-white hover:bg-[#1959db]"
                      >
                        {activeQuestionStep && !isLastQuestionInStep
                          ? 'Next question'
                          : 'Continue'}
                        <ArrowRight className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="h-11 rounded-md bg-[#1f6fff] px-6 text-white hover:bg-[#1959db]"
                      >
                        {isPending ? (
                          <>
                            <SpinnerGap className="size-4 animate-spin" />
                            Saving
                          </>
                        ) : (
                          <>
                            Save and continue
                            <CheckCircle className="size-4" weight="fill" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </footer>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function DefaultEntryStep({
  onNext,
  step,
}: Pick<OnboardingStepRendererProps, 'onNext' | 'step'>) {
  const [selectedTrack, setSelectedTrack] = useState<'guided' | 'fast'>('guided');

  const tracks = [
    {
      id: 'guided' as const,
      title: 'Guided setup',
      description: 'Best first run, balanced quality and speed.',
    },
    {
      id: 'fast' as const,
      title: 'Fast setup',
      description: 'Shorter inputs, refine later from Brand Kit.',
    },
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_24px_50px_-40px_rgba(15,23,42,0.65)]">
      <div className="grid md:grid-cols-[300px_1fr]">
        <div className="relative hidden bg-[#1f6fff] p-8 text-white md:flex md:flex-col">
          <Logo
            full
            textClassName="text-white font-semibold"
            height={22}
            width={22}
          />

          <div className="mt-12 space-y-4">
            <h1 className="text-4xl font-semibold leading-tight">
              A few clicks away from creating your strategy.
            </h1>
            <p className="text-white/80">
              Start your content system in minutes. Save time and publish consistently.
            </p>
          </div>

          <div className="mt-auto rounded-lg border border-white/20 bg-white/10 p-4 text-sm text-white/90">
            {step.screen.estimatedTimeLabel}
          </div>
        </div>

        <div className="p-6 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#1f6fff]">
            {step.eyebrow}
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
            {step.title}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 md:text-base">
            {step.description}
          </p>

          <div className="mt-7 space-y-4">
            {tracks.map((track) => {
              const active = selectedTrack === track.id;

              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setSelectedTrack(track.id)}
                  className={
                    active
                      ? 'flex w-full items-center justify-between rounded-lg border border-[#1f6fff] bg-[#eef5ff] px-5 py-4 text-left shadow-[0_10px_25px_-20px_rgba(31,111,255,0.7)]'
                      : 'flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4 text-left hover:border-slate-300'
                  }
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={
                        active
                          ? 'inline-flex size-10 items-center justify-center rounded-lg bg-[#1f6fff] text-sm font-semibold text-white'
                          : 'inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-500'
                      }
                    >
                      {track.title.charAt(0)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-800">
                        {track.title}
                      </p>
                      <p className="text-sm text-slate-500">{track.description}</p>
                    </div>
                  </div>
                  <ArrowRight
                    className={active ? 'size-4 text-[#1f6fff]' : 'size-4 text-slate-300'}
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex items-center gap-3">
            <Button
              onClick={onNext}
              className="h-11 rounded-md bg-[#1f6fff] px-6 text-white hover:bg-[#1959db]"
            >
              {step.screen.ctaLabel}
              <ArrowRight className="size-4" />
            </Button>
            <p className="text-sm text-slate-500">You can edit everything later from Brand Kit.</p>
          </div>
        </div>
      </div>
    </section>
  );
}