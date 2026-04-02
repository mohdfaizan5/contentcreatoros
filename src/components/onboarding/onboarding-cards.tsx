'use client';

import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, X } from '@phosphor-icons/react';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { OnboardingOption, OnboardingQuestionLayout } from '@/types/onboarding';

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
  icon?: React.ReactNode;
  label: string;
  layout?: OnboardingQuestionLayout;
}) {
  if (layout === 'pills') {
    return (
      <span
        className={cn(
          'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-all duration-200',
          active
            ? 'border-slate-900 bg-slate-900 text-white shadow-[0_10px_24px_-14px_rgba(15,23,42,0.85)]'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
        )}
      >
        {icon ? <span className="mr-2 inline-flex shrink-0">{icon}</span> : null}
        {label}
      </span>
    );
  }

  return (
    <div
      className={cn(
        'rounded-[24px] border p-4 transition-all duration-200',
        active
          ? 'border-slate-900 bg-slate-900 text-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.85)]'
          : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            {icon ? <span className="inline-flex shrink-0">{icon}</span> : null}
            <p className="text-sm font-semibold">{label}</p>
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
              : 'border-slate-200 bg-slate-50 text-transparent',
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
        layout === 'cards' ? 'grid gap-3 sm:grid-cols-2' : 'flex flex-wrap gap-3',
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
    <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.65)]">
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-sm text-white"
          >
            {value}
            <button
              type="button"
              onClick={() => removeTag(value)}
              className="rounded-full text-white/70 transition hover:text-white"
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
          className="h-11 rounded-2xl border-slate-200 bg-slate-50"
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
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-sm font-semibold text-slate-900">
          {label}
          {required && <span className="ml-1 text-slate-400">*</span>}
        </Label>
        {description && <p className="text-sm leading-6 text-slate-500">{description}</p>}
      </div>
      {children}
      {helperText && <p className="text-xs text-slate-400">{helperText}</p>}
    </div>
  );
}
