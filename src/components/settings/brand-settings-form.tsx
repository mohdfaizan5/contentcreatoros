'use client';

import { useMemo, useState, useTransition } from 'react';
import { CheckCircle, SpinnerGap } from '@phosphor-icons/react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { saveOnboarding } from '@/actions/onboarding';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  CONTENT_ONBOARDING_STEPS,
  OTHER_OPTION_VALUE,
  getQuestionSummaryValue,
  isOtherOptionSelected,
} from '@/lib/onboarding';
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
import { QuestionMarkIcon } from '@phosphor-icons/react/dist/ssr';
import {
  BoxIcon,
  ChartLine,
  HouseIcon,
  PanelsTopLeftIcon,
  SettingsIcon,
  UsersRoundIcon,
} from "lucide-react";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type BrandSettingsFormProps = {
  initialAnswers: OnboardingAnswers;
};

function renderQuestionKeyValue(question: OnboardingQuestion, answers: OnboardingAnswers) {
  if (!question.required) {
    return <Badge variant="outline">Optional</Badge>;
  }

  return <Badge variant="outline">Required</Badge>;
}

function getQuestionControlDescription(question: OnboardingQuestion, answers: OnboardingAnswers) {
  const currentValue = getQuestionSummaryValue(question, answers);
  // return `Current value: ${currentValue}`;
  return ``;
}

export default function BrandSettingsForm({ initialAnswers }: BrandSettingsFormProps) {
  const [answers, setAnswers] = useState<OnboardingAnswers>(initialAnswers);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const questionSteps = useMemo(
    () => CONTENT_ONBOARDING_STEPS.filter(
      (step): step is OnboardingQuestionStepDefinition => step.kind === 'questions',
    ),
    [],
  );

  const [activeStepId, setActiveStepId] = useState<string>(questionSteps[0]?.id || '');

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
    const otherInputVisible = isOtherOptionSelected(question, answers);

    switch (question.type) {
      case 'text':
        return (
          <OnboardingField
            key={question.key}
            label={question.label}
            description={question.description}
            helperText={getQuestionControlDescription(question, answers)}
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
            helperText={getQuestionControlDescription(question, answers)}
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
              helperText={getQuestionControlDescription(question, answers)}
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
              helperText={getQuestionControlDescription(question, answers)}
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
            helperText={getQuestionControlDescription(question, answers)}
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

  const answeredCount = Object.entries(answers).filter(([key, value]) => {
    if (key.endsWith('_other')) {
      return typeof value === 'string' && value.trim().length > 0;
    }

    return Array.isArray(value)
      ? value.length > 0
      : typeof value === 'string'
        ? value.trim().length > 0
        : false;
  }).length;

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-slate-200 bg-[#1384FF] text-white p-6 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.35)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary" className="">
              Brand settings
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight ">
                Edit your onboarding data
              </h1>
              <p className="max-w-3xl text-sm leading-6 ">
                This page loads the same onboarding questions and current saved answers, so you can
                update your brand data in one place and save it back to the same storage shape.
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

        {/* <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 ">
          Text, select, multi-select, and tag fields are saved in the same JSON-backed onboarding
          format used by the onboarding flow, including custom "Other" values where present.
        </div> */}
      </div>
      <Tabs defaultValue="tab-1">
        <ScrollArea>
          <TabsList className="mb-3 h-auto gap-2 rounded-none border-b bg-transparent px-0 py-1 text-foreground">
            <TabsTrigger
              className="after:-mb-1 relative after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:hover:bg-accent data-[state=active]:after:bg-primary"
              value="tab-1"
            >
              <HouseIcon
                aria-hidden="true"
                className="-ms-0.5 me-1.5 opacity-60"
                size={16}
              />
              Overview
            </TabsTrigger>
            <TabsTrigger
              className="after:-mb-1 relative after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:hover:bg-accent data-[state=active]:after:bg-primary"
              value="tab-2"
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
                3
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              className="after:-mb-1 relative after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:hover:bg-accent data-[state=active]:after:bg-primary"
              value="tab-3"
            >
              <BoxIcon
                aria-hidden="true"
                className="-ms-0.5 me-1.5 opacity-60"
                size={16}
              />
              Packages
              <Badge className="ms-1.5">New</Badge>
            </TabsTrigger>
            <TabsTrigger
              className="after:-mb-1 relative after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:hover:bg-accent data-[state=active]:after:bg-primary"
              value="tab-4"
            >
              <UsersRoundIcon
                aria-hidden="true"
                className="-ms-0.5 me-1.5 opacity-60"
                size={16}
              />
              Team
            </TabsTrigger>
           
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <TabsContent value="tab-1">
          <p className="pt-1 text-center text-muted-foreground text-xs">
            Content for Tab 1
          </p>
        </TabsContent>
        <TabsContent value="tab-2">
          <p className="pt-1 text-center text-muted-foreground text-xs">
            Content for Tab 2
          </p>
        </TabsContent>
        <TabsContent value="tab-3">
          <p className="pt-1 text-center text-muted-foreground text-xs">
            Content for Tab 3
          </p>
        </TabsContent>
       
      </Tabs>

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
              className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-42px_rgba(15,23,42,0.35)] sm:p-7"
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
    </div>
  );
}