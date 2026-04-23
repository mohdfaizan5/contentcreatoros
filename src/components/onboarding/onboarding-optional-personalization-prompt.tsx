'use client';

import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr';

type OnboardingOptionalPersonalizationPromptProps = {
  importantAnsweredCount: number;
  importantTotal: number;
  optionalRemainingCount: number;
  isBusy: boolean;
  onContinuePersonalization: () => void;
  onSkipToWorkflow: () => void;
};

export function OnboardingOptionalPersonalizationPrompt({
  importantAnsweredCount,
  importantTotal,
  optionalRemainingCount,
  isBusy,
  onContinuePersonalization,
  onSkipToWorkflow,
}: OnboardingOptionalPersonalizationPromptProps) {
  return (
    <div className="space-y-4 flex flex-col min-h-[50dvh] items-center justify-center rounded-xl  p-5 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.35)]">
      {/* <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1f6fff]">
        Core setup complete
      </p> */}

      <div className="space-y-2 ">
        <h3 className="text-3xl text-center font-semibold ">
          {/* Want stronger personalization? */}
          We had somemore questions to ask that can help us get to know you better
        </h3>
        {/* <p className="text-sm leading-6 text-muted-foreground">
          You have answered {importantAnsweredCount}/{importantTotal} important questions.
          There are {optionalRemainingCount} more optional questions that can improve voice,
          angles, and quality.
        </p> */}
        <p className="text-sm text-muted-foreground text-center">
          You can skip to the main workflow now and finish these later from Brand Kit.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="ghost"
          disabled={isBusy}
          onClick={onSkipToWorkflow}
          // className="h-11 rounded-md"
        >
          {/* Skip to main workflow */}
          No thanks, I'll do this later
        </Button>

        <Button
          type="button"
          disabled={isBusy}
          onClick={onContinuePersonalization}
          className="h-11 rounded-md bg-[#1f6fff] text-white hover:bg-[#1959db]"
        >
          Continue personalization <ArrowRightIcon/>
        </Button>
      </div>
    </div>
  );
}
