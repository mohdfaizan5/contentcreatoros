'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { CheckCircle, SpinnerGap } from '@phosphor-icons/react';
import { saveOnboarding } from '@/actions/onboarding';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { getQuestionSteps } from '@/lib/onboarding';
import {
  buildOptionsWithOther,
  countAnsweredFields,
  countAnsweredQuestionsInStep,
  shouldShowOtherInput,
} from '@/lib/onboarding/question-ui-utils';
import type {
  OnboardingAnswers,
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
  HouseIcon,
  PaletteIcon,
  PanelsTopLeftIcon,
} from "lucide-react";
import { BrandVisualOverview } from '@/components/brand-kit/brand-visual-overview';
import type { BrandVisualIdentity } from '@/lib/brand-visuals';

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

export default function BrandSettingsForm({
  initialAnswers,
  brandIdentity,
  companyOverview,
  showShell = true,
  view = 'brand-voice',
}: BrandSettingsFormProps) {
  const [answers, setAnswers] = useState<OnboardingAnswers>(initialAnswers);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  const questionSteps = useMemo(
    () => getQuestionSteps(),
    [],
  );

  const updateAnswer = (key: string, value: OnboardingAnswers[string]) => {
    setSaveState('idle');
    setSaveError(null);
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [key]: value,
    }));
  };

  const handleSave = () => {
    setSaveError(null);

    startTransition(async () => {
      const result = await saveOnboarding({ answers });

      if (result.error) {
        setSaveState('error');
        setSaveError(result.error);
        return;
      }

      setSaveState('saved');
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
            helperText={getQuestionControlDescription()}
            required={question.required}
          >
            <Textarea
              value={typeof rawValue === 'string' ? rawValue : ''}
              onChange={(event) => updateAnswer(question.key, event.target.value)}
              placeholder={question.placeholder}
              rows={question.rows ?? 4}
              className="rounded-3xl border-slate-200 bg-white"
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
              <Input
                value={typeof answers[question.otherOption.answerKey] === 'string'
                  ? answers[question.otherOption.answerKey]
                  : ''}
                onChange={(event) =>
                  updateAnswer(question.otherOption!.answerKey, event.target.value)
                }
                placeholder={question.otherOption.placeholder}
                className="h-12 rounded-[20px] border-slate-200 bg-white"
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
              <Input
                value={typeof answers[question.otherOption.answerKey] === 'string'
                  ? answers[question.otherOption.answerKey]
                  : ''}
                onChange={(event) =>
                  updateAnswer(question.otherOption!.answerKey, event.target.value)
                }
                placeholder={question.otherOption.placeholder}
                className="h-12 rounded-[20px] border-slate-200 bg-white"
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
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-42px_rgba(15,23,42,0.35)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Company overview from onboarding
            </p>
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

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 hidden">
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
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
          className="space-y-6"
        >
          {questionSteps.map((step) => (
            <section
              key={step.id}
              className="rounded-4xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-42px_rgba(15,23,42,0.35)] sm:p-7"
            >
              {/* <div className="mb-6 space-y-1">
                <div className="text-xs font-semibold uppercase  text-slate-400">
                  {step.eyebrow}
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{step.title}</h2>
                <p className="max-w-2xl text-sm leading-6 text-slate-600">{step.description}</p>
              </div> */}

              <div className="space-y-6">
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
              </div>
            </section>
          ))}

          {saveError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {saveError}
            </div>
          ) : null}

          {saveState === 'saved' ? (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle className="size-4" weight="fill" />
              Brand data saved.
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending} className="h-12 rounded-full px-6 text-sm font-semibold">
              {isPending ? (
                <>
                  <SpinnerGap className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save / update data'
              )}
            </Button>
          </div>
        </form>

        {/* <aside className="h-fit rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-42px_rgba(15,23,42,0.35)]">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-950">How this saves</h3>
            <p className="text-sm leading-6 text-slate-600">
              Each answer is written back to the same `onboarding_answers` table with its
              `question_key`, `flow_key`, and JSON answer payload.
            </p>
          </div>

          <div className="mt-6 space-y-3 text-sm text-slate-600">
            {questionSteps.map((step) => (
              <div key={step.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-medium text-slate-900">{step.title}</p>
                <p className="mt-1">{step.questions.length} questions</p>
              </div>
            ))}
          </div>
        </aside> */}
        </div>
      )}
    </div>
  );
}