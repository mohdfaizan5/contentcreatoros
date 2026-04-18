'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
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
import { runOnboardingAutofill } from '@/actions/onboarding-autofill';
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
  OnboardingXAccountInput,
  OnboardingSpeechInput,
  OnboardingSpeechTextarea,
  OnboardingWebsiteSearchInput,
} from './onboarding-speech-fields';
import { useOptionClickSound } from '@/hooks/use-option-click-sound';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { FaInfoCircle } from "react-icons/fa";
import { BenfitsAnimatedBeam } from './benefits-animated-beam';
import { OnboardingTerminal } from './onboarding-end-animation-terminal';
import { XLogoIcon } from '@phosphor-icons/react/dist/ssr';
import { BrandVisualOverview } from '../brand-kit/brand-visual-overview';
import type { BrandVisualIdentity } from '@/lib/brand-visuals';

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
  initialXHandle?: string | null;
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
  initialXHandle,
  redirectTo = '/app',
  stepRenderers,
}: OnboardingFlowProps) {
  const router = useRouter();
  const playOptionClick = useOptionClickSound();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(() => {
    const initialAnswers = getInitialOnboardingAnswers();

    if (initialXHandle && typeof initialAnswers.x_account === 'string') {
      initialAnswers.x_account = initialXHandle;
    }

    return initialAnswers;
  });
  const [questionIndexByStep, setQuestionIndexByStep] = useState<
    Record<string, number>
  >({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAutofillProcessing, setIsAutofillProcessing] = useState(false);
  const [autofillApplied, setAutofillApplied] = useState(false);
  const [autofillHint, setAutofillHint] = useState<string | null>(null);
  const [autofillSourceDomain, setAutofillSourceDomain] = useState<string | null>(null);
  const [autofillBrandIdentity, setAutofillBrandIdentity] = useState<BrandVisualIdentity | null>(null);
  const [showBrandGuidelinesOnly, setShowBrandGuidelinesOnly] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isAutofillPending, startAutofillTransition] = useTransition();

  const activeStep =
    currentStepIndex >= 0 && currentStepIndex < CONTENT_ONBOARDING_STEPS.length
      ? CONTENT_ONBOARDING_STEPS[currentStepIndex]
      : null;
  const activeQuestionStep = activeStep?.kind === 'questions' ? activeStep : null;
  const canContinue = activeQuestionStep ? isStepComplete(activeQuestionStep, answers) : true;
  const progressPercentage = getProgressPercentage(currentStepIndex);
  const questionStepNumber = activeQuestionStep
    ? getQuestionStepNumber(activeQuestionStep.id)
    : 0;
  const activeMilestoneStep = getActiveMilestoneStep(
    activeQuestionStep?.id,
    false,
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
  const isLastStepInFlow = currentStepIndex >= CONTENT_ONBOARDING_STEPS.length - 1;
  const isFinalQuestionInFlow =
    Boolean(activeQuestionStep) && isLastStepInFlow && isLastQuestionInStep;
  const isCurrentQuestionComplete = currentQuestion
    ? isQuestionComplete(currentQuestion, answers)
    : true;
  const isSourceSetupStep = activeQuestionStep?.id === 'source-setup';
  const websiteUrlValue =
    typeof answers.website_url === 'string' ? answers.website_url : '';
  const xAccountValue =
    typeof answers.x_account === 'string' ? answers.x_account : '';
  const isBusy = isPending || isAutofillPending;
  const isBrandGuidelinesOnlyView =
    activeQuestionStep?.id === 'company-basics' &&
    showBrandGuidelinesOnly &&
    Boolean(autofillBrandIdentity);

  const summaryCards = useMemo(
    () => getOnboardingSummaryCards(answers),
    [answers],
  );

  const milestoneSteps = useMemo<VerticalStepperStep[]>(
    () =>
      ONBOARDING_IMPORTANT_MILESTONES.map((milestone, index) => {
        const completed =
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
    [answers],
  );

  useEffect(() => {
    if (!showSuccess) {
      return;
    }

    const timeout = setTimeout(() => {
      router.push(redirectTo);
    }, 4800);

    return () => clearTimeout(timeout);
  }, [redirectTo, router, showSuccess]);

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

    if (activeQuestionStep && currentStepIndex >= CONTENT_ONBOARDING_STEPS.length - 1) {
      handleSubmit();
      return;
    }

    setDirection(1);
    setCurrentStepIndex((currentIndex) =>
      Math.min(CONTENT_ONBOARDING_STEPS.length - 1, currentIndex + 1),
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

    if (isSourceSetupStep) {
      runSourceAutofill();
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

  const runSourceAutofill = () => {
    const trimmedWebsite = websiteUrlValue.trim();

    if (!trimmedWebsite) {
      setSaveError('Add your website URL before continuing.');
      return;
    }

    setSaveError(null);
    setAutofillHint(null);
    setIsAutofillProcessing(true);

    startAutofillTransition(async () => {
      try {
        const result = await runOnboardingAutofill({
          websiteUrl: trimmedWebsite,
          xAccount: xAccountValue,
        });

        if (!result.success || result.error) {
          setSaveError(result.error ?? 'Unable to prefill your onboarding answers right now.');
          return;
        }

        const mergedAnswers: OnboardingAnswers = {
          ...result.inferredAnswers,
          website_url: result.source?.normalizedUrl ?? trimmedWebsite,
          x_account: result.source?.xAccount || xAccountValue,
        };

        setAnswers((currentAnswers) => ({
          ...currentAnswers,
          ...mergedAnswers,
        }));
        setAutofillBrandIdentity(result.brandIdentity ?? null);
        setAutofillSourceDomain(result.source?.domain ?? null);
        setAutofillApplied(true);
        setShowBrandGuidelinesOnly(Boolean(result.brandIdentity));
        setAutofillHint('We prefilled your onboarding using your website. Review and edit anything before saving.');

        setDirection(1);
        setCurrentStepIndex((currentIndex) =>
          Math.min(CONTENT_ONBOARDING_STEPS.length - 1, currentIndex + 1),
        );
      } catch {
        setSaveError('Unexpected issue while prefilling onboarding. Please try again.');
      } finally {
        setIsAutofillProcessing(false);
      }
    });
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

  const continueFromBrandGuidelines = () => {
    setSaveError(null);
    setShowBrandGuidelinesOnly(false);
    setActiveQuestionIndex(0);
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
            {question.key === 'website_url' ? (
              <OnboardingWebsiteSearchInput
                value={typeof rawValue === 'string' ? rawValue : ''}
                onValueChange={(value) => updateAnswer(question.key, value)}
                placeholder={question.placeholder}
                className="w-full max-w-none"
              />
            ) : question.key === 'x_account' ? (
              <OnboardingXAccountInput
                value={typeof rawValue === 'string' ? rawValue : ''}
                onValueChange={(value) => updateAnswer(question.key, value)}
                placeholder={question.placeholder}
                className="h-12 border-border/40 bg-background"
              />
            ) : (
              <OnboardingSpeechInput
                type={question.inputType ?? 'text'}
                value={typeof rawValue === 'string' ? rawValue : ''}
                onValueChange={(value) => updateAnswer(question.key, value)}
                placeholder={question.placeholder}
                className="h-12 border-border/40 bg-background"
              />
            )}
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
              className="border-border/40 bg-background"
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
                  className="h-11 border-border/40 bg-background"
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
                  className="h-11 border-border/40 bg-background"
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

  if (isAutofillProcessing) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#eef2f8] p-6 ">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl space-y-5"
        > 
          <OnboardingTerminal mode="processing" />

          <div className="rounded-xl border border-border/40 bg-white p-4 text-sm text-slate-600 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.55)]">
            Analyzing your website, extracting brand signals, and prefilling your answers...
          </div>
        </motion.div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#eef2f8] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl space-y-5"
        >
          <OnboardingTerminal mode="complete" />

          <div className="flex items-center justify-between rounded-xl border border-border/40 bg-white p-4 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.55)]">
            <p className="text-sm text-slate-600">Finalizing your setup and taking you to the workspace...</p>
            <Button
              className="h-10 rounded-full px-5"
              onClick={() => router.push(redirectTo)}
            >
              Continue now
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const renderer =
    activeStep?.kind === 'screen' ? stepRenderers?.[activeStep.id] : undefined;

  return (
    <section className="mx-auto   max-w-2xl h-screen flex  justify-between max-h-screen flex-col w-4xl  -bg-[#f4f6fa] md:min-h-0">
      <header className=" py-4  md:py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="">
            <Logo
              height={20}
              width={20}
              full
              textClassName="ml-[1px] text-base font-semibold text-slate-950"
            />
          </div>
          <p className="ml-auto text-xs text-slate-500">
            Having troubles?{' '}
            <a
              href="mailto:support@contentosx.com"
              className="f text-[#1f6fff] hover:underline"
            >
              Get Help
            </a>
          </p>
        </div>

        {activeQuestionStep ? (
          <div className="mt-4 space-y-2">
            {/* <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.14em] text-slate-500 md:text-sm md:tracking-[0.08em]">
                <p>
                  Question Step {questionStepNumber} of {QUESTION_STEPS.length}
                </p>
                <p className="hidden md:block">{activeQuestionStep.title}</p>
              </div> */}
            <div className="h-2 max-w-3xl overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full  rounded-full bg-[linear-gradient(90deg,#1f6fff,#39a8ff)] transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        ) : null}
      </header>

      <main className="flex-1  pb-6  md:pb-10">
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
                <section className=" ">
                  {!isBrandGuidelinesOnlyView ? (
                    <div className=" pb-5 flex items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1f6fff]">
                        {activeQuestionStep.eyebrow}
                      </p>
                      <h2 className=" font-medium text-base  text-slate-900 md:text-">
                        {activeQuestionStep.title}
                      </h2>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button variant="ghost" size="icon-sm">
                            <FaInfoCircle />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{activeQuestionStep.description}</p>
                        </TooltipContent>
                      </Tooltip>
                      {/* <p className="text-sm  text-slate-500 ">
                        
                      </p> */}
                      {/* <div className="inline-flex items-center rounded-md border border-border/40 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                              Question {activeQuestionIndex + 1} of {activeQuestionStep.questions.length}
                            </div> */}
                    </div>
                  ) : null}

                  {isSourceSetupStep ? (
                    <div className="space-y-5">
                      <OnboardingField
                        label="Add your website URL"
                        description="We scan this site and prefill most onboarding answers."
                        required
                      >
                        <OnboardingWebsiteSearchInput
                          value={websiteUrlValue}
                          onValueChange={(value) => updateAnswer('website_url', value)}
                          placeholder="https://yourwebsite.com"
                          className="w-full max-w-none"
                        />
                      </OnboardingField>

                      <OnboardingField
                        label="Add your X account"
                        description="Optional. We can use this for better voice alignment."
                      >
                        <div className="space-y-2">
                          {initialXHandle ? (
                            <p className="text-xs text-slate-500">
                              Auto-detected from your account connection. You can keep it as-is or edit it.
                            </p>
                          ) : null}
                          <OnboardingXAccountInput
                            value={xAccountValue}
                            onValueChange={(value) => updateAnswer('x_account', value)}
                            placeholder="https://x.com/yourhandle"
                            className="h-12 border-border/40 bg-background"
                          />
                        </div>
                      </OnboardingField>

                      {autofillBrandIdentity ? (
                        <BrandVisualOverview
                          identity={autofillBrandIdentity}
                          title="Brand Identity Snapshot"
                        />
                      ) : null}
                    </div>
                  ) : isBrandGuidelinesOnlyView ? (
                    <BrandVisualOverview
                      className="mb-2"
                      identity={{
                        ...autofillBrandIdentity,
                        sourceDomain: autofillSourceDomain,
                      }}
                      title="Brand Guidelines"
                    />
                  ) : (
                    <>
                      {autofillApplied ? (
                        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                          {autofillHint ?? 'Answers were prefilled from your website. You can edit every field before saving.'}
                        </div>
                      ) : null}

                      <div className="space-y-7">
                        {currentQuestion ? renderQuestion(currentQuestion) : null}
                      </div>

                      {isStepSkippable(activeQuestionStep) ? (
                        <div className="mt-6 inline-flex items-center gap-2 rounded-md border border-border/40 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                          <Lifebuoy className="size-3.5" weight="bold" />
                          Optional section
                        </div>
                      ) : null}
                    </>
                  )}

                  {saveError ? (
                    <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      {saveError}
                    </p>
                  ) : null}
                </section>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {activeStep?.kind !== 'screen' ? (
        <footer className="  py-4  end-0">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
            <Button
              type="button"
              variant="ghost"
              size={"sm"}

              onClick={goToPreviousQuestion}
              disabled={currentStepIndex <= 0 || isBusy}
              className="rounded-md text-slate-600"
            >
              <ArrowLeft className="size-4" />
              {isSourceSetupStep
                ? 'Back'
                : activeQuestionStep && activeQuestionIndex > 0
                  ? 'Previous question'
                  : 'Back'}
            </Button>

            <div className="flex items-center gap-3">
              {activeQuestionStep && isStepSkippable(activeQuestionStep) ? (
                <Button
                  type="button"
                  variant="ghost"
                  size={"sm"}
                  onClick={goNext}
                  disabled={isBusy}
                  className="rounded-md text-slate-500"
                >
                  Skip for now
                </Button>
              ) : null}

              <Button
                type="button"
                size={"sm"}
                onClick={
                  isSourceSetupStep
                    ? runSourceAutofill
                    : isBrandGuidelinesOnlyView
                      ? continueFromBrandGuidelines
                      : goToNextQuestion
                }
                disabled={
                  isSourceSetupStep
                    ? websiteUrlValue.trim().length === 0 || isBusy
                    : isBrandGuidelinesOnlyView
                      ? isBusy
                    : activeQuestionStep
                    ? isLastQuestionInStep
                      ? !canContinue || isBusy
                      : !isCurrentQuestionComplete
                    : false
                }
                className="h-11 rounded-md bg-[#1f6fff] px-6 text-white hover:bg-[#1959db]"
              >
                {isAutofillPending ? (
                  <>
                    <SpinnerGap className="size-4 animate-spin" />
                    Analyzing website
                  </>
                ) : isPending ? (
                  <>
                    <SpinnerGap className="size-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    {isSourceSetupStep
                      ? 'Confirm website and continue'
                      : isBrandGuidelinesOnlyView
                        ? 'Continue to Company Basics'
                      : activeQuestionStep && !isLastQuestionInStep
                      ? 'Next question'
                      : isFinalQuestionInFlow
                        ? 'Save and continue'
                        : 'Continue'}
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </footer>
      ) : null}
    </section>
  )
  return (
    <div className="max-h-svh -bg-[#e8edf5]">

      {/* <div className=" ">
        <div className="grid hidden md:grid-cols-[296px_1fr] ">
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
        </div>
      </div> */}
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
    <section className="flex flex-col items-center justify-between h-[80dvh] ">
      <div className="mt-12 space-y-4">
        <h1 className="text-3xl font-  mx-auto text-center max-w-xl text-[#1f6fff]">
          A few clicks away from creating <br />  perfect <XLogoIcon className='inline-flex'/> 
          {/* A few clicks away from creating <br />  your strategy. */}
        </h1>
        <BenfitsAnimatedBeam className='-my-10' />
        {/* <p className="text-center ">
          Start your content system in minutes. Save time and publish consistently.
        </p> */}
      </div>
      <Button
        onClick={onNext}
        className="h-11 rounded-full  bg-[#1f6fff] px-52 text-white hover:bg-[#1959db]"
      >
        {step.screen.ctaLabel}
        <ArrowRight className="size-4" />
      </Button>
      {/* <div className="grid md:grid-cols-[300px_1fr]">
        <div className="relative hidden bg-[#1f6fff] p-8 text-white md:flex md:flex-col">
          <Logo
            full
            textClassName="text-white font-semibold"
            height={22}
            width={22}
          />

         

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
                      : 'flex w-full items-center justify-between rounded-lg border border-border/40 bg-white px-5 py-4 text-left hover:border-border/50'
                  }
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={
                        active
                          ? 'inline-flex size-10 items-center justify-center rounded-lg bg-[#1f6fff] text-sm font-semibold text-white'
                          : 'inline-flex size-10 items-center justify-center rounded-lg border border-border/40 text-sm font-semibold text-slate-500'
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
            
            <p className="text-sm text-slate-500">You can edit everything later from Brand Kit.</p>
          </div>
        </div>
      </div> */}
    </section>
  );
  // return (
  //   <section className="overflow-hidden rounded-xl border border-border/40 bg-white shadow-[0_24px_50px_-40px_rgba(15,23,42,0.65)]">
  //     <div className="grid md:grid-cols-[300px_1fr]">
  //       <div className="relative hidden bg-[#1f6fff] p-8 text-white md:flex md:flex-col">
  //         <Logo
  //           full
  //           textClassName="text-white font-semibold"
  //           height={22}
  //           width={22}
  //         />

  //         <div className="mt-12 space-y-4">
  //           <h1 className="text-4xl font-semibold leading-tight">
  //             A few clicks away from creating your strategy.
  //           </h1>
  //           <p className="text-white/80">
  //             Start your content system in minutes. Save time and publish consistently.
  //           </p>
  //         </div>

  //         <div className="mt-auto rounded-lg border border-white/20 bg-white/10 p-4 text-sm text-white/90">
  //           {step.screen.estimatedTimeLabel}
  //         </div>
  //       </div>

  //       <div className="p-6 md:p-10">
  //         <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#1f6fff]">
  //           {step.eyebrow}
  //         </p>
  //         <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
  //           {step.title}
  //         </h2>
  //         <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 md:text-base">
  //           {step.description}
  //         </p>

  //         <div className="mt-7 space-y-4">
  //           {tracks.map((track) => {
  //             const active = selectedTrack === track.id;

  //             return (
  //               <button
  //                 key={track.id}
  //                 type="button"
  //                 onClick={() => setSelectedTrack(track.id)}
  //                 className={
  //                   active
  //                     ? 'flex w-full items-center justify-between rounded-lg border border-[#1f6fff] bg-[#eef5ff] px-5 py-4 text-left shadow-[0_10px_25px_-20px_rgba(31,111,255,0.7)]'
  //                     : 'flex w-full items-center justify-between rounded-lg border border-border/40 bg-white px-5 py-4 text-left hover:border-border/50'
  //                 }
  //               >
  //                 <div className="flex items-center gap-4">
  //                   <span
  //                     className={
  //                       active
  //                         ? 'inline-flex size-10 items-center justify-center rounded-lg bg-[#1f6fff] text-sm font-semibold text-white'
  //                         : 'inline-flex size-10 items-center justify-center rounded-lg border border-border/40 text-sm font-semibold text-slate-500'
  //                     }
  //                   >
  //                     {track.title.charAt(0)}
  //                   </span>
  //                   <div>
  //                     <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-800">
  //                       {track.title}
  //                     </p>
  //                     <p className="text-sm text-slate-500">{track.description}</p>
  //                   </div>
  //                 </div>
  //                 <ArrowRight
  //                   className={active ? 'size-4 text-[#1f6fff]' : 'size-4 text-slate-300'}
  //                 />
  //               </button>
  //             );
  //           })}
  //         </div>

  //         <div className="mt-8 flex items-center gap-3">
  //           <Button
  //             onClick={onNext}
  //             className="h-11 rounded-md bg-[#1f6fff] px-6 text-white hover:bg-[#1959db]"
  //           >
  //             {step.screen.ctaLabel}
  //             <ArrowRight className="size-4" />
  //           </Button>
  //           <p className="text-sm text-slate-500">You can edit everything later from Brand Kit.</p>
  //         </div>
  //       </div>
  //     </div>
  //   </section>
  // );
}