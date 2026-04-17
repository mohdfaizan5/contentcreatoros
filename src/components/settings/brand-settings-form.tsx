'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { SpinnerGap } from '@phosphor-icons/react';
import { saveOnboarding } from '@/actions/onboarding';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getQuestionSteps } from '@/lib/onboarding';
import {
  buildOptionsWithOther,
  countAnsweredFields,
  countAnsweredQuestionsInStep,
  shouldShowOtherInput,
} from '@/lib/onboarding/question-ui-utils';
import type {
  OnboardingAnswers,
  OnboardingFieldValue,
  OnboardingQuestion,
  OnboardingQuestionStepDefinition,
} from '@/types/onboarding';
import {
  OnboardingCheckboxGroup,
  OnboardingField,
  OnboardingRadioGroup,
  OnboardingTagInput,
} from '@/components/onboarding/onboarding-cards';
import {
  CircleCheckIcon,
  HouseIcon,
  PaletteIcon,
  PanelsTopLeftIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { BrandVisualOverview } from '@/components/brand-kit/brand-visual-overview';
import type { BrandVisualIdentity } from '@/lib/brand-visuals';
import { SpeechInputPro } from '@/components/ui/speech-input-pro';

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type BrandSettingsFormProps = {
  initialAnswers: OnboardingAnswers;
  brandIdentity?: BrandVisualIdentity;
  companyOverview?: string;
  showShell?: boolean;
  view?: 'overview' | 'brand-voice';
};

function getQuestionControlDescription() {
  return ``;
}

function normalizeAnswerValue(value: OnboardingFieldValue | undefined) {
  if (Array.isArray(value)) {
    const normalizedEntries = value
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    return normalizedEntries.length > 0 ? normalizedEntries : undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  return undefined;
}

function areAnswerValuesEqual(
  left: OnboardingFieldValue | undefined,
  right: OnboardingFieldValue | undefined,
) {
  const normalizedLeft = normalizeAnswerValue(left);
  const normalizedRight = normalizeAnswerValue(right);

  if (normalizedLeft === undefined && normalizedRight === undefined) {
    return true;
  }

  if (Array.isArray(normalizedLeft) && Array.isArray(normalizedRight)) {
    return (
      normalizedLeft.length === normalizedRight.length
      && normalizedLeft.every((entry, index) => entry === normalizedRight[index])
    );
  }

  return normalizedLeft === normalizedRight;
}

export default function BrandSettingsForm({
  initialAnswers,
  brandIdentity,
  companyOverview,
  showShell = true,
  view = 'brand-voice',
}: BrandSettingsFormProps) {
  const [answers, setAnswers] = useState<OnboardingAnswers>(initialAnswers);
  const [savedAnswers, setSavedAnswers] = useState<OnboardingAnswers>(initialAnswers);
  const [saveStateByStepId, setSaveStateByStepId] = useState<
    Record<string, 'idle' | 'saved' | 'error'>
  >({});
  const [saveErrorByStepId, setSaveErrorByStepId] = useState<Record<string, string>>({});
  const [savingStepId, setSavingStepId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  const questionSteps = useMemo(
    () => getQuestionSteps(),
    [],
  );

  const questionKeyToStepId = useMemo(
    () =>
      new Map(
        questionSteps.flatMap((step) =>
          step.questions.map((question) => [question.key, step.id] as const),
        ),
      ),
    [questionSteps],
  );

  const updateAnswer = (key: string, value: OnboardingAnswers[string]) => {
    const stepId = questionKeyToStepId.get(key);

    if (stepId) {
      setSaveStateByStepId((current) => ({
        ...current,
        [stepId]: 'idle',
      }));

      setSaveErrorByStepId((current) => {
        if (!(stepId in current)) {
          return current;
        }

        const next = { ...current };
        delete next[stepId];
        return next;
      });
    }

    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [key]: value,
    }));
  };

  const getStringAnswer = (key: string) => {
    const value = answers[key];
    return typeof value === 'string' ? value : '';
  };

  const getQuestionKeysForStep = (step: OnboardingQuestionStepDefinition) =>
    step.questions.flatMap((question) => {
      if ('otherOption' in question && question.otherOption) {
        return [question.key, question.otherOption.answerKey];
      }

      return [question.key];
    });

  const editableQuestionKeys = useMemo(
    () =>
      Array.from(
        new Set(
          questionSteps.flatMap((step) =>
            step.questions.flatMap((question) => {
              if ('otherOption' in question && question.otherOption) {
                return [question.key, question.otherOption.answerKey];
              }

              return [question.key];
            }),
          ),
        ),
      ),
    [questionSteps],
  );

  const hasUnsavedChanges = useMemo(() => {
    if (view !== 'brand-voice') {
      return false;
    }

    return editableQuestionKeys.some(
      (key) => !areAnswerValuesEqual(answers[key], savedAnswers[key]),
    );
  }, [answers, editableQuestionKeys, savedAnswers, view]);

  useEffect(() => {
    if (view !== 'brand-voice' || !hasUnsavedChanges) {
      return;
    }

    const warningMessage =
      'You have unsaved Brand Voice changes. Save your content before leaving this page.';

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = warningMessage;
      return warningMessage;
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      if (!(event.target instanceof Element)) {
        return;
      }

      const anchor = event.target.closest('a[href]') as HTMLAnchorElement | null;

      if (!anchor) {
        return;
      }

      if (anchor.target === '_blank' || anchor.hasAttribute('download')) {
        return;
      }

      const nextUrl = new URL(anchor.href, window.location.href);
      const isSameOrigin = nextUrl.origin === window.location.origin;

      if (!isSameOrigin) {
        return;
      }

      const isSameRoute =
        nextUrl.pathname === window.location.pathname
        && nextUrl.search === window.location.search;

      if (isSameRoute) {
        return;
      }

      if (!window.confirm(warningMessage)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const handlePopState = () => {
      const shouldLeave = window.confirm(warningMessage);

      if (!shouldLeave) {
        window.history.go(1);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleDocumentClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleDocumentClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, view]);

  const handleSaveStep = (step: OnboardingQuestionStepDefinition) => {
    setSavingStepId(step.id);
    setSaveStateByStepId((current) => ({
      ...current,
      [step.id]: 'idle',
    }));

    setSaveErrorByStepId((current) => {
      if (!(step.id in current)) {
        return current;
      }

      const next = { ...current };
      delete next[step.id];
      return next;
    });

    const questionKeys = getQuestionKeysForStep(step);
    const stepAnswerSnapshot = questionKeys.reduce<OnboardingAnswers>(
      (current, key) => ({
        ...current,
        [key]: answers[key],
      }),
      {},
    );

    startTransition(async () => {
      const result = await saveOnboarding({ answers, questionKeys });

      if (result.error) {
        setSaveStateByStepId((current) => ({
          ...current,
          [step.id]: 'error',
        }));

        setSaveErrorByStepId((current) => ({
          ...current,
          [step.id]: result.error,
        }));

        setSavingStepId((current) => (current === step.id ? null : current));
        return;
      }

      setSaveStateByStepId((current) => ({
        ...current,
        [step.id]: 'saved',
      }));
      setSavedAnswers((current) => ({
        ...current,
        ...stepAnswerSnapshot,
      }));
      setSavingStepId((current) => (current === step.id ? null : current));
    });
  };

  const renderQuestion = (question: OnboardingQuestion) => {
    const rawValue = answers[question.key];
    const otherInputVisible = shouldShowOtherInput(question, answers);

    switch (question.type) {
      case 'text':
        return (
          <OnboardingField
            key={question.key}
            label={question.label}
            description={question.description}
            helperText={getQuestionControlDescription()}
            required={question.required}
          >
            <SpeechInputPro
              type={question.inputType ?? 'text'}
              value={typeof rawValue === 'string' ? rawValue : ''}
              onValueChange={(value) => updateAnswer(question.key, value)}
              placeholder={question.placeholder}
            />
          </OnboardingField>
        );
      case 'textarea':
        return (
          <OnboardingField
            key={question.key}
            label={question.label}
            description={question.description}
            helperText={getQuestionControlDescription()}
            required={question.required}
          >
            <SpeechInputPro
              as="textarea"
              value={typeof rawValue === 'string' ? rawValue : ''}
              onValueChange={(value) => updateAnswer(question.key, value)}
              placeholder={question.placeholder}
              rows={question.rows ?? 4}
            />
          </OnboardingField>
        );
      case 'single-select': {
        const options = buildOptionsWithOther(question);

        return (
          <div key={question.key} className="space-y-3">
            <OnboardingField
              label={question.label}
              description={question.description}
              helperText={getQuestionControlDescription()}
              required={question.required}
            >
              <OnboardingRadioGroup
                layout={question.layout}
                options={options}
                value={typeof rawValue === 'string' ? rawValue : null}
                onChange={(value) => updateAnswer(question.key, value)}
              />
            </OnboardingField>

            {question.otherOption && otherInputVisible ? (
              <SpeechInputPro
                value={getStringAnswer(question.otherOption.answerKey)}
                onValueChange={(value) =>
                  updateAnswer(question.otherOption!.answerKey, value)
                }
                placeholder={question.otherOption.placeholder}
              />
            ) : null}
          </div>
        );
      }
      case 'multi-select': {
        const options = buildOptionsWithOther(question);

        return (
          <div key={question.key} className="space-y-3">
            <OnboardingField
              label={question.label}
              description={question.description}
              helperText={getQuestionControlDescription()}
              required={question.required}
            >
              <OnboardingCheckboxGroup
                layout={question.layout}
                options={options}
                values={Array.isArray(rawValue) ? rawValue : []}
                maxSelections={question.maxSelections}
                onChange={(value) => updateAnswer(question.key, value)}
              />
            </OnboardingField>

            {question.otherOption && otherInputVisible ? (
              <SpeechInputPro
                value={getStringAnswer(question.otherOption.answerKey)}
                onValueChange={(value) =>
                  updateAnswer(question.otherOption!.answerKey, value)
                }
                placeholder={question.otherOption.placeholder}
              />
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
            helperText={getQuestionControlDescription()}
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
      default:
        return null;
    }
  };

  const answeredCount = countAnsweredFields(answers);

  const totalQuestionCount = questionSteps.reduce(
    (count, step) => count + step.questions.length,
    0,
  );
  const answeredQuestionCount = questionSteps.reduce(
    (count, step) => count + countAnsweredQuestionsInStep(step, answers),
    0,
  );
  const completionPercentage = totalQuestionCount
    ? Math.round((answeredQuestionCount / totalQuestionCount) * 100)
    : 0;
  const scoreTier = completionPercentage >= 80
    ? 'Excellent'
    : completionPercentage >= 55
      ? 'Solid'
      : 'Needs work';
  const scoreToneClass = completionPercentage >= 80
    ? 'text-emerald-700'
    : completionPercentage >= 55
      ? 'text-amber-700'
      : 'text-rose-700';
  const scoreTip = completionPercentage >= 80
    ? 'Great detail. Keep refining examples and tone references for even stronger outputs.'
    : completionPercentage >= 55
      ? 'You are close. Add clearer details in each section to improve answer quality.'
      : 'Add more specific inputs. Better brand voice context produces better AI answers.';

  const isOverviewView = view === 'overview';
  const hasBrandVisualData = Boolean(
    brandIdentity &&
      (
        brandIdentity.logoUrl ||
        brandIdentity.ogImageUrl ||
        brandIdentity.companyName ||
        brandIdentity.sourceDomain ||
        brandIdentity.colors.length > 0
      ),
  );

  const isTabActive = (href: string) => {
    if (href === '/app/brand-kit/voice') {
      return pathname === href || pathname.startsWith(`${href}/`);
    }

    if (href === '/app/brand-kit/visuals') {
      return pathname === href || pathname.startsWith(`${href}/`);
    }

    return pathname === href;
  };

  const getStepAnsweredCount = (step: OnboardingQuestionStepDefinition) =>
    countAnsweredQuestionsInStep(step, answers);

  return (
    <div className="space-y-8">
      {showShell ? (
        <>
          <div className="rounded-4xl border border-slate-200 bg-[#1384FF] text-white p-6 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.35)] sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <Badge variant="secondary" className="">
                  Brand settings
                </Badge>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight ">
                    {isOverviewView ? 'Brand kit overview' : 'Edit your onboarding data'}
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 ">
                    {isOverviewView
                      ? 'Use this overview to review progress, then jump into Brand Voice or Visual Identity.'
                      : 'This page loads the same onboarding questions and current saved answers, so you can update your brand data in one place and save it back to the same storage shape.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm ">
                <Badge variant="outline" className="border-slate-200 px-3 py-1">
                  {answeredCount} saved values
                </Badge>
                <Badge variant="outline" className="border-slate-200 px-3 py-1">
                  onboarding_answers
                </Badge>
              </div>
            </div>
          </div>

          <ScrollArea>
            <div className="mb-3 flex h-auto gap-2 rounded-none border-b bg-transparent px-0 py-1 text-foreground">
              <Link
                href="/app/brand-kit"
                className={cn(
                  "after:-mb-1 relative inline-flex items-center rounded-md px-3 py-2 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5",
                  isTabActive('/app/brand-kit')
                    ? "bg-transparent text-foreground shadow-none after:bg-primary"
                    : "text-foreground/70 hover:bg-accent hover:text-foreground after:bg-transparent",
                )}
              >
                <HouseIcon
                  aria-hidden="true"
                  className="-ms-0.5 me-1.5 opacity-60"
                  size={16}
                />
                Overview
              </Link>

              <Link
                href="/app/brand-kit/voice"
                className={cn(
                  "after:-mb-1 relative inline-flex items-center rounded-md px-3 py-2 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5",
                  isTabActive('/app/brand-kit/voice')
                    ? "bg-transparent text-foreground shadow-none after:bg-primary"
                    : "text-foreground/70 hover:bg-accent hover:text-foreground after:bg-transparent",
                )}
              >
                <PanelsTopLeftIcon
                  aria-hidden="true"
                  className="-ms-0.5 me-1.5 opacity-60"
                  size={16}
                />
                Brand Voice
                <Badge
                  className="ms-1.5 min-w-5 bg-primary/15 px-1"
                  variant="secondary"
                >
                  {totalQuestionCount}
                </Badge>
              </Link>

              <Link
                href="/app/brand-kit/visuals"
                className={cn(
                  "after:-mb-1 relative inline-flex items-center rounded-md px-3 py-2 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5",
                  isTabActive('/app/brand-kit/visuals')
                    ? "bg-transparent text-foreground shadow-none after:bg-primary"
                    : "text-foreground/70 hover:bg-accent hover:text-foreground after:bg-transparent",
                )}
              >
                <PaletteIcon
                  aria-hidden="true"
                  className="-ms-0.5 me-1.5 opacity-60"
                  size={16}
                />
                Visual Identity
              </Link>
            </div>

            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </>
      ) : null}

      {isOverviewView ? (
        <div className="space-y-4 hid">
          <section className="max-w-4xl shadow-[0_20px_50px_-42px_rgba(15,23,42,0.35)]">
            {/* <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Company overview from onboarding
            </p> */}
            <p className="mt-2 text-base leading-7 text-slate-900">
              {companyOverview || 'No overview summary was found yet. Complete website autofill in onboarding to populate this.'}
            </p>
          </section>

          {hasBrandVisualData && brandIdentity ? (
            <BrandVisualOverview
              identity={brandIdentity}
              title="Brand Visual Overview"
            />
          ) : null}

          <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-3">
          {questionSteps.map((step) => {
            const stepAnsweredCount = getStepAnsweredCount(step);

            return (
              <section
                key={step.id}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-42px_rgba(15,23,42,0.35)]"
              >
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {step.eyebrow ?? 'Section'}
                  </p>
                  <h2 className="text-lg font-semibold tracking-tight text-slate-950">{step.title}</h2>
                  <p className="text-sm leading-6 text-slate-600">{step.description}</p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <Badge variant="outline" className="border-slate-200 px-3 py-1">
                    {step.questions.length} questions
                  </Badge>
                  <span className="text-sm text-slate-600">
                    {stepAnsweredCount}/{step.questions.length} answered
                  </span>
                </div>
              </section>
            );
          })}

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-42px_rgba(15,23,42,0.35)] md:col-span-2 xl:col-span-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">Continue editing your brand voice</h2>
                <p className="text-sm leading-6 text-slate-600">
                  You have completed {answeredCount} answers across {totalQuestionCount} Brand Voice questions.
                </p>
              </div>

              <Button asChild className="h-11 rounded-full px-5 text-sm font-semibold">
                <Link href="/app/brand-kit/voice">Open Brand Voice questions</Link>
              </Button>
            </div>
          </section>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-4">
            {questionSteps.map((step) => {
              const stepAnsweredCount = getStepAnsweredCount(step);
              const stepSaveState = saveStateByStepId[step.id] ?? 'idle';
              const stepSaveError = saveErrorByStepId[step.id] ?? null;
              const isSavingStep = isPending && savingStepId === step.id;

              return (
                <Card key={step.id}>
                  <CardHeader>
                    <div className="text-xs font-semibold uppercase text-muted-foreground">
                      {step.eyebrow}
                    </div>
                    <CardTitle>{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </CardHeader>

                  <CardPanel className="flex flex-col gap-6">
                    {step.questions.map((question) => (
                      <div key={question.key} className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          {/* <div className="flex items-center gap-3">
                          <span className="text-base font-medium text-slate-950">{question.label}---</span>
                          {renderQuestionKeyValue(question, answers)}
                        </div> */}
                        </div>

                        {/* {question.description ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <Button variant="outline" size="icon-sm">
                              <QuestionMarkIcon />
                            </Button></TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm leading-6 text-slate-500">{question.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : null} */}
                        {renderQuestion(question)}
                        {/* <p className="text-xs text-slate-400">
                        Current value: {getQuestionSummaryValue(question, answers)}
                      </p> */}
                      </div>
                    ))}

                    {stepSaveError ? (
                      <Alert variant="error">
                        <TriangleAlertIcon />
                        <AlertTitle>Save failed</AlertTitle>
                        <AlertDescription>{stepSaveError}</AlertDescription>
                      </Alert>
                    ) : null}

                    {stepSaveState === 'saved' ? (
                      <Alert variant="success">
                        <CircleCheckIcon />
                        <AlertTitle>Saved</AlertTitle>
                        <AlertDescription>{step.title} saved.</AlertDescription>
                      </Alert>
                    ) : null}
                  </CardPanel>

                  <CardFooter className="justify-between gap-3 max-sm:flex-col max-sm:items-start">
                    <Badge variant="outline">
                      {stepAnsweredCount}/{step.questions.length} answered
                    </Badge>

                    <Button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleSaveStep(step)}
                    >
                      {isSavingStep ? (
                        <>
                          <SpinnerGap className="size-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        `Save ${step.eyebrow ?? step.title}`
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <div className="space-y-4 lg:sticky lg:top-24">
            <Card>
              <CardHeader className="space-y-2">
                <CardDescription>Quick overview</CardDescription>
                <CardTitle className="text-lg">Brand Voice Score</CardTitle>
              </CardHeader>
              <CardPanel className="space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex items-baseline gap-1">
                    <span className={cn('text-3xl font-semibold tabular-nums', scoreToneClass)}>
                      {completionPercentage}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                  </div>
                  <Badge variant="outline">{scoreTier}</Badge>
                </div>

                <div className="h-2 rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      completionPercentage >= 80
                        ? 'bg-emerald-500'
                        : completionPercentage >= 55
                          ? 'bg-amber-500'
                          : 'bg-rose-500',
                    )}
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  {answeredQuestionCount} of {totalQuestionCount} questions answered.
                </p>
                <p className="text-sm text-foreground/90">{scoreTip}</p>
              </CardPanel>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Section progress</CardTitle>
                <CardDescription>
                  Better detail here gives you better quality answers across the app.
                </CardDescription>
              </CardHeader>
              <CardPanel className="space-y-3">
                {questionSteps.map((step) => {
                  const stepAnsweredCount = getStepAnsweredCount(step);
                  const stepCompletion = step.questions.length
                    ? Math.round((stepAnsweredCount / step.questions.length) * 100)
                    : 0;

                  return (
                    <div key={`sidebar-${step.id}`} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">{step.eyebrow ?? step.title}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {stepAnsweredCount}/{step.questions.length}
                        </p>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${stepCompletion}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardPanel>
              <CardFooter>
                {hasUnsavedChanges ? (
                  <Alert className="w-full" variant="warning">
                    <TriangleAlertIcon />
                    <AlertTitle>Unsaved changes</AlertTitle>
                    <AlertDescription>
                      Save each section before leaving this page.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="w-full" variant="success">
                    <CircleCheckIcon />
                    <AlertTitle>All changes saved</AlertTitle>
                    <AlertDescription>
                      You are safe to navigate away.
                    </AlertDescription>
                  </Alert>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}