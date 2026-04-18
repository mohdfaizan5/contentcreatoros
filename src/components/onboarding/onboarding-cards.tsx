'use client';

import { createElement, isValidElement, useId, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, X, Question } from '@phosphor-icons/react';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { OnboardingOption, OnboardingQuestionLayout } from '@/types/onboarding';

function renderChoiceIcon(icon: OnboardingOption['icon']) {
  if (!icon) {
    return null;
  }

  if (isValidElement(icon)) {
    return icon;
  }

  if (typeof icon === 'function') {
    return createElement(icon, { className: 'size-4' });
  }

  return icon;
}

type ChoiceGroupProps = {
  layout?: OnboardingQuestionLayout;
  options: OnboardingOption[];
  onOptionSelect?: () => void;
};

type SingleChoiceGroupProps = ChoiceGroupProps & {
  type: 'single';
  value: string;
  onChange: (value: string) => void;
};

type MultiChoiceGroupProps = ChoiceGroupProps & {
  type: 'multi';
  values: string[];
  onChange: (value: string[]) => void;
  maxSelections?: number;
};

function ChoiceCard({
  active,
  description,
  icon,
  label,
  layout = 'cards',
}: {
  active: boolean;
  description?: string;
  icon?: OnboardingOption['icon'];
  label: string;
  layout?: OnboardingQuestionLayout;
}) {
  const renderedIcon = renderChoiceIcon(icon);

  if (layout === 'pills') {
    return (
      <span
        className={cn(
          'inline-flex min-h-8 items-center rounded-md border px-4 text-sm font-medium transition-all duration-200',
          active
            ? 'border-border/90 bg-slate-900 text-white shadow-[0_10px_24px_-14px_rgba(15,23,42,0.85)]'
            : 'border-border/40 bg-white text-slate-700 hover:border-border/50 hover:bg-slate-50',
        )}
      >
        {renderedIcon ? <span className="mr-2 inline-flex shrink-0">{renderedIcon}</span> : null}
        {label}
      </span>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-3.5 transition-all duration-200',
        active
          ? 'border-border/90 bg-slate-900 text-white shadow-[0_14px_32px_-24px_rgba(15,23,42,0.8)]'
          : 'border-border/40 bg-white  hover:border-border/50 hover:bg-slate-50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {renderedIcon ? <span className="inline-flex shrink-0">{renderedIcon}</span> : null}
            <p className={cn("text-sm font-semibold ", active ? "text-white" : "text-slate-900")}>{label}</p>
          </div>
          {description && (
            <p
              className={cn(
                'text-sm leading-6',
                active ? 'text-slate-200/85' : 'text-slate-500',
              )}
            >
              {description}
            </p>
          )}
        </div>
        <span
          className={cn(
            'mt-0.5 flex size-5 items-center justify-center rounded-full border',
            active
              ? 'border-white/30 bg-white/10 text-white'
              : 'border-border/40 bg-slate-50 text-transparent',
          )}
        >
          <Check className="size-3" weight="bold" />
        </span>
      </div>
    </div>
  );
}

export function OnboardingChoiceGroup(props: SingleChoiceGroupProps | MultiChoiceGroupProps) {
  const id = useId();
  const { layout = 'cards', onOptionSelect, options } = props;

  const handleToggle = (optionValue: string) => {
    onOptionSelect?.();

    if (props.type === 'single') {
      props.onChange(optionValue);
      return;
    }

    const exists = props.values.includes(optionValue);
    const nextValues = exists
      ? props.values.filter((value) => value !== optionValue)
      : [...props.values, optionValue];

    if (!exists && props.maxSelections && nextValues.length > props.maxSelections) {
      return;
    }

    props.onChange(nextValues);
  };

  return (
    <div
      className={cn(
        layout === 'cards' ? 'grid gap-3 sm:grid-cols-2' : 'flex flex-wrap gap-2',
      )}
    >
      <AnimatePresence mode="popLayout">
        {options.map((option, index) => {
          const active =
            props.type === 'single'
              ? props.value === option.value
              : props.values.includes(option.value);

          return (
            <motion.button
              key={option.value}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.22 }}
              onClick={() => handleToggle(option.value)}
              className={cn(
                'text-left outline-none',
                layout === 'cards' ? 'w-full' : 'w-auto',
              )}
              aria-pressed={active}
              aria-labelledby={`${id}-${option.value}`}
            >
              <div id={`${id}-${option.value}`}>
                <ChoiceCard
                  active={active}
                  description={option.description}
                  icon={option.icon}
                  label={option.label}
                  layout={layout}
                />
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function OnboardingTagInput({
  maxItems,
  onChange,
  placeholder,
  values,
}: {
  maxItems?: number;
  onChange: (values: string[]) => void;
  placeholder?: string;
  values: string[];
}) {
  const [draft, setDraft] = useState('');

  const commitDraft = () => {
    const nextValue = draft.trim();

    if (!nextValue) {
      return;
    }

    if (values.includes(nextValue)) {
      setDraft('');
      return;
    }

    if (maxItems && values.length >= maxItems) {
      return;
    }

    onChange([...values, nextValue]);
    setDraft('');
  };

  const removeTag = (valueToRemove: string) => {
    onChange(values.filter((value) => value !== valueToRemove));
  };

  return (
    <div className="rounded-lg border border-border/40 bg-card p-2.5 shadow-sm shadow-slate-950/5">
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-1 text-sm text-white"
          >
            {value}
            <button
              type="button"
              onClick={() => removeTag(value)}
              className="rounded-md text-white/70 transition hover:text-white"
              aria-label={`Remove ${value}`}
            >
              <X className="size-3" weight="bold" />
            </button>
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              commitDraft();
            }

            if (event.key === 'Backspace' && !draft && values.length > 0) {
              removeTag(values[values.length - 1]);
            }
          }}
          onBlur={commitDraft}
          placeholder={placeholder}
          className="h-10 border-border/40 bg-background"
        />
      </div>
    </div>
  );
}

export function OnboardingRadioGroup({
  layout = 'cards',
  onChange,
  onOptionSelect,
  options,
  value,
}: {
  layout?: OnboardingQuestionLayout;
  options: OnboardingOption[];
  value: string | null;
  onChange: (value: string) => void;
  onOptionSelect?: () => void;
}) {
  return (
    <OnboardingChoiceGroup
      type="single"
      layout={layout}
      options={options}
      value={value ?? ''}
      onChange={onChange}
      onOptionSelect={onOptionSelect}
    />
  );
}

export function OnboardingCheckboxGroup({
  layout = 'cards',
  maxSelections,
  onChange,
  onOptionSelect,
  options,
  values,
}: {
  layout?: OnboardingQuestionLayout;
  maxSelections?: number;
  options: OnboardingOption[];
  values: string[];
  onChange: (value: string[]) => void;
  onOptionSelect?: () => void;
}) {
  return (
    <OnboardingChoiceGroup
      type="multi"
      layout={layout}
      options={options}
      values={values}
      maxSelections={maxSelections}
      onChange={onChange}
      onOptionSelect={onOptionSelect}
    />
  );
}

export function OnboardingField({
  children,
  description,
  helperText,
  label,
  required,
}: {
  children: React.ReactNode;
  description?: string;
  helperText?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label className="text-lg font-semibold ">
          {label}
          {required && <span className="ml-1 text-slate-400">*</span>}
        </Label>
        {description && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild delay={150}>
                <div className="inline-flex size-4 cursor-default items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                  <Question weight="bold" className="size-2.5" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-70 p-3 text-xs leading-relaxed hidden sm:block" side="right">
                {description}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {children}
      {helperText && <p className="text-xs text-slate-400">{helperText}</p>}
    </div>
  );
}

