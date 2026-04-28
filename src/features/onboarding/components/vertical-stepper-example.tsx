"use client";

import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/shared/components/ui/stepper";
import { cn } from "@/shared/lib/utils";

export type VerticalStepperStep = {
  step: number;
  title: string;
  description?: string;
  completed?: boolean;
};

type VerticalStepperExampleProps = {
  steps: VerticalStepperStep[];
  value: number;
  className?: string;
  onValueChange?: (step: number) => void;
};

export function VerticalStepperExample({
  className,
  onValueChange,
  steps,
  value,
}: VerticalStepperExampleProps) {
  return (
    <Stepper
      className={cn("w-full", className)}
      onValueChange={onValueChange}
      orientation="vertical"
      value={value}
    >
      {steps.map(({ step, title, description, completed }) => (
        <StepperItem
          className="relative not-last:flex-1 items-start"
          completed={completed}
          key={step}
          step={step}
        >
          <StepperTrigger className="items-start rounded-md pb-11 last:pb-0">
            <StepperIndicator className="size-6 border border-white/45 bg-transparent text-white/70 data-[state=active]:border-white data-[state=active]:bg-white data-[state=active]:text-[#1f6fff] data-[state=completed]:border-white/95 data-[state=completed]:bg-white/95 data-[state=completed]:text-[#1f6fff]" />
            <div className="mt-0.5 space-y-0.5 px-2 text-left">
              <StepperTitle className="text-[13px] uppercase tracking-[0.13em] text-white group-data-[state=inactive]/step:text-white/65">
                {title}
              </StepperTitle>
              {description ? (
                <StepperDescription className="text-xs text-white/85 group-data-[state=inactive]/step:text-white/60">
                  {description}
                </StepperDescription>
              ) : null}
            </div>
          </StepperTrigger>
          {step < steps.length && (
            <StepperSeparator className="-order-1 -translate-x-1/2 absolute inset-y-0 top-6.5 left-3 m-0 h-[calc(100%-1.5rem-0.25rem)] w-0.5 bg-white/35 data-[state=completed]:bg-white/80" />
          )}
        </StepperItem>
      ))}
    </Stepper>
  );
}

const steps = [
  {
    description: "Desc for step one",
    step: 1,
    title: "Step One",
  },
  {
    description: "Desc for step two",
    step: 2,
    title: "Step Two",
  },
  {
    description: "Desc for step three",
    step: 3,
    title: "Step Three",
  },
];

export default function Component() {
  return (
    <div className="space-y-8 text-center">
      <VerticalStepperExample steps={steps} value={2} />
      <p
        aria-live="polite"
        className="mt-2 text-muted-foreground text-xs"
        role="region"
      >
        Vertical stepper with inline titles and descriptions
      </p>
    </div>
  );
}
