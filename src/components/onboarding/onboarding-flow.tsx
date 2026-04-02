'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  PencilSimple,
  Sparkle,
  SpinnerGap,
  TrendUp,
  WarningCircle,
} from '@phosphor-icons/react';

import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { saveOnboarding } from '@/actions/onboarding';
import {
  CONTENT_ONBOARDING_STEPS,
  getInitialOnboardingAnswers,
  getQuestionSteps,
  getQuestionSummaryValue,
  isStepComplete,
  isStepSkippable,
  OTHER_OPTION_VALUE,
} from '@/lib/onboarding';
import type {
  OnboardingAnswers,
  OnboardingQuestion,
  OnboardingScreenStepDefinition,
} from '@/types/onboarding';
import {
  OnboardingCheckboxGroup,
  OnboardingField,
  OnboardingRadioGroup,
  OnboardingTagInput,
} from './onboarding-cards';
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

const QUESTION_STEPS = getQuestionSteps();

const slideVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 48 : -48,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction < 0 ? 48 : -48,
  }),
};

function getProgressPercentage(stepIndex: number) {
  const questionStepIndexes = CONTENT_ONBOARDING_STEPS.flatMap((step, index) =>
    step.kind === 'questions' ? [index] : [],
  );
  const questionStepPosition = questionStepIndexes.indexOf(stepIndex);

  if (questionStepPosition < 0) {
    return 0;
  }

  return ((questionStepPosition + 1) / QUESTION_STEPS.length) * 100;
}

function questionNeedsOtherInput(question: OnboardingQuestion, answers: OnboardingAnswers) {
  if (
    (question.type !== 'single-select' && question.type !== 'multi-select') ||
    !question.otherOption
  ) {
    return false;
  }

  const value = answers[question.key];

  if (question.type === 'single-select') {
    return value === OTHER_OPTION_VALUE;
  }

  return Array.isArray(value) && value.includes(OTHER_OPTION_VALUE);
}

function DefaultEntryStep({
  onNext,
  step,
}: Pick<OnboardingStepRendererProps, 'onNext' | 'step'>) {
  return (
    <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs uppercase tracking-[0.24em] text-sky-700">
          <Sparkle className="size-3.5" weight="fill" />
          {step.eyebrow}
        </div>
        <div className="space-y-4">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {step.title}
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-600">
            {step.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={onNext} className="h-12 rounded-full px-6 text-sm font-semibold">
            {step.screen.ctaLabel}
            <ArrowRight className="size-4" />
          </Button>
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            {step.screen.estimatedTimeLabel}
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(248,250,252,0.98))] p-6 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.35)]">
        {step.screen.highlights?.length ? (
          <div className="flex flex-wrap items-center gap-3 text-center">
            {step.screen.highlights.map((item) => (
              <Badge key={item} variant="outline" className="border-slate-200 px-3 py-1.5">
                <span className="text-sm font-medium text-slate-900">{item}</span>
              </Badge>
            ))}
          </div>
        ) : null}
        {step.screen.previewItems?.length ? (
          <div className="mt-5 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              What you are setting up
            </p>
            <div className="mt-4 space-y-3">
              {step.screen.previewItems.map((item, index) => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="mt-1 flex size-7 items-center justify-center rounded-full bg-slate-900 text-xs text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
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
    ? QUESTION_STEPS.findIndex((step) => step.id === activeQuestionStep.id) + 1
    : 0;

  const summaryCards = useMemo(
    () =>
      CONTENT_ONBOARDING_STEPS.flatMap((step, stepIndex) =>
        step.kind === 'questions'
          ? [
              {
                ...step,
                stepIndex,
                entries: step.questions.map((question) => ({
                  key: question.key,
                  label: question.label,
                  value: getQuestionSummaryValue(question, answers),
                })),
              },
            ]
          : [],
      ),
    [answers],
  );

  const entryStep = CONTENT_ONBOARDING_STEPS.find(
    (step): step is OnboardingScreenStepDefinition =>
      step.kind === 'screen' && step.screen.variant === 'entry',
  );

  const updateAnswer = (key: string, value: OnboardingAnswers[string]) => {
    setSaveError(null);
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [key]: value,
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
    const otherInputVisible = questionNeedsOtherInput(question, answers);
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
            <Input
              type={question.inputType ?? 'text'}
              value={typeof rawValue === 'string' ? rawValue : ''}
              onChange={(event) => updateAnswer(question.key, event.target.value)}
              placeholder={question.placeholder}
              className="h-12 rounded-[20px] border-slate-200 bg-white"
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
            <Textarea
              value={typeof rawValue === 'string' ? rawValue : ''}
              onChange={(event) => updateAnswer(question.key, event.target.value)}
              placeholder={question.placeholder}
              rows={question.rows ?? 4}
              className="rounded-[24px] border-slate-200 bg-white"
            />
          </OnboardingField>
        );
      case 'single-select': {
        const options = question.otherOption
          ? [
              ...question.options,
              {
                value: OTHER_OPTION_VALUE,
                label: question.otherOption.optionLabel ?? 'Other',
                description: 'Add a custom answer',
              },
            ]
          : question.options;

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

            {otherInputVisible && question.otherOption ? (
              <OnboardingField label={question.otherOption.label}>
                <Input
                  value={
                    typeof answers[question.otherOption.answerKey] === 'string'
                      ? answers[question.otherOption.answerKey]
                      : ''
                  }
                  onChange={(event) =>
                    updateAnswer(question.otherOption.answerKey, event.target.value)
                  }
                  placeholder={question.otherOption.placeholder}
                  className="h-11 rounded-[18px] border-slate-200 bg-white"
                />
              </OnboardingField>
            ) : null}
          </div>
        );
      }
      case 'multi-select': {
        const options = question.otherOption
          ? [
              ...question.options,
              {
                value: OTHER_OPTION_VALUE,
                label: question.otherOption.optionLabel ?? 'Other',
                description: 'Add a custom answer',
              },
            ]
          : question.options;
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

            {otherInputVisible && question.otherOption ? (
              <OnboardingField label={question.otherOption.label}>
                <Input
                  value={
                    typeof answers[question.otherOption.answerKey] === 'string'
                      ? answers[question.otherOption.answerKey]
                      : ''
                  }
                  onChange={(event) =>
                    updateAnswer(question.otherOption.answerKey, event.target.value)
                  }
                  placeholder={question.otherOption.placeholder}
                  className="h-11 rounded-[18px] border-slate-200 bg-white"
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
      <div className="flex min-h-svh items-center justify-center bg-[linear-gradient(180deg,_#f8fafc,_#eef2ff)] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl rounded-[32px] border border-white/70 bg-white/90 p-8 text-center shadow-[0_28px_80px_-42px_rgba(15,23,42,0.45)] backdrop-blur"
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
    <div className="flex min-h-svh flex-col bg-[linear-gradient(180deg,_#f8fafc,_#eef2ff)]">
      <header className="border-b border-slate-200/70 bg-white/70 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Logo
            height={22}
            width={22}
            full
            textClassName="ml-[1px] text-sm font-semibold text-slate-950"
          />
          {entryStep ? (
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Guided setup
              </p>
              <p className="text-sm text-slate-500">{entryStep.screen.estimatedTimeLabel}</p>
            </div>
          ) : null}
        </div>
      </header>

      {activeQuestionStep && !isReviewStep ? (
        <div className="border-b border-slate-200/70 bg-white/60 px-6 py-5 backdrop-blur">
          <div className="mx-auto max-w-6xl space-y-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-slate-700">
                Step {questionStepNumber} of {QUESTION_STEPS.length}
              </p>
              <p className="text-sm text-slate-500">{activeQuestionStep.title}</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,_#0f172a,_#2563eb)] transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStepIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.24, ease: 'easeInOut' }}
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
                <section className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
                  <div className="space-y-4">
                    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-500">
                      {activeQuestionStep.eyebrow}
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                        {activeQuestionStep.title}
                      </h2>
                      <p className="max-w-md text-sm leading-7 text-slate-600">
                        {activeQuestionStep.description}
                      </p>
                    </div>
                    {isStepSkippable(activeQuestionStep) ? (
                      <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-500">
                        This step is optional. You can skip it and come back later.
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-[32px] border border-white/80 bg-white/88 p-6 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.38)] backdrop-blur">
                    <div className="space-y-8">
                      {activeQuestionStep.questions.map((question) => renderQuestion(question))}
                    </div>
                  </div>
                </section>
              ) : null}

              {isReviewStep ? (
                <section className="space-y-6">
                  <div className="max-w-2xl space-y-3">
                    <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs uppercase tracking-[0.24em] text-emerald-700">
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
                        className="rounded-[28px] border border-white/80 bg-white/88 p-6 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.32)]"
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
                            className="rounded-full text-slate-500"
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
                            <div key={entry.key} className="rounded-2xl bg-slate-50 p-4">
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

                  <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(37,99,235,0.92))] p-6 text-white shadow-[0_28px_80px_-42px_rgba(15,23,42,0.5)]">
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
        <footer className="border-t border-slate-200/70 bg-white/70 px-6 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={goBack}
              disabled={currentStepIndex <= 0 || isPending}
              className="rounded-full text-slate-600"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            <div className="flex items-center gap-3">
              {activeQuestionStep && isStepSkippable(activeQuestionStep) ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={goNext}
                  disabled={isPending}
                  className="rounded-full text-slate-500"
                >
                  Skip for now
                </Button>
              ) : null}

              {!isReviewStep ? (
                <Button
                  type="button"
                  onClick={goNext}
                  disabled={activeQuestionStep ? !canContinue : false}
                  className="h-11 rounded-full px-6"
                >
                  Continue
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="h-11 rounded-full px-6"
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
    </div>
  );
}
