"use client";

import { useEffect, useState } from 'react';

import { AnimatedSpan, Terminal, TypingAnimation } from '@/shared/components/ui/terminal';
import { cn } from '@/shared/lib/utils';
import { TextShimmerWave } from '@/features/onboarding/components/text-shimmer-wave';

type OnboardingTerminalProps = {
  mode?: 'processing' | 'complete';
};

const PROCESSING_STEPS = [
  'Validating source URL and preparing scrape request.',
  'Scanning website content and metadata .',
  'Extracting brand signals (logo, colors, voice hints).',
  'Inferring onboarding answers with AI.',
  'Saving profile snapshot for editable review.',
];

export function OnboardingTerminal({ mode = 'complete' }: OnboardingTerminalProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (mode !== 'processing') {
      return;
    }

    const stageInterval = window.setInterval(() => {
      setActiveStepIndex((current) => (current + 1) % PROCESSING_STEPS.length);
    }, 2);

    const elapsedInterval = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => {
      window.clearInterval(stageInterval);
      window.clearInterval(elapsedInterval);
    };
  }, [mode]);

  if (mode === 'processing') {
    const dots = '.'.repeat((elapsedSeconds % 3) + 1);

    
    return (<Terminal className="w-full max-w-2xl bg-muted-foreground/5">
      <TypingAnimation>&gt; building your brand strategy profile...</TypingAnimation>

      {/* <TextShimmerWave
        className='[--base-color:#0D74CE] [--base-gradient-color:#5EB1EF]'
        duration={1}
        spread={1}
        zDistance={1}
        scaleDistance={1.1}
        rotateYDistance={20}
      >
        Creating the perfect dish...
      </TextShimmerWave> */}
      <AnimatedSpan className="text-green-500">
        ✔ Captured your audience segments and experience level.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Mapped your goals, CTA style, and growth priorities.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Learned your tone, writing style, and inspiration signals.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Organized your content pillars, formats, and posting cadence.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Added product positioning, features, and differentiators.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Applied capability constraints for a realistic weekly output.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500 mb-8">
        ✔ Prepared a high-confidence 30-day X planning brief.
      </AnimatedSpan>

      {/* <AnimatedSpan className="text-blue-500">
        <span>ℹ Strategy context assembled:</span>
        <span className="pl-2">- audience + voice + offer + execution constraints</span>
      </AnimatedSpan> */}

      <TypingAnimation className="text-muted-foreground">
        We are working hard to get the to know about what you do
      </TypingAnimation>
     

      <p className="mt-6 text-sm font-semibold text-muted-foreground">
        Prefill in progress{dots} {elapsedSeconds}s
      </p>
    </Terminal>)
    return (
      <Terminal className="w-full  bg-muted-foreground/5" >
        <p className="text-sm font-normal tracking-tight text-slate-200">
          &gt; collecting your website and brand context...
        </p>

        {PROCESSING_STEPS.map((step, index) => {
          const isActive = index === activeStepIndex;

          return (
            <div
              key={step}
              className={cn(
                'flex items-center gap-2 text-sm font-normal tracking-tight transition-opacity duration-300',
                isActive ? ' opacity-100' : 'opacity-80',
              )}
            >
              <span
                className={cn(
                  'inline-flex size-2 rounded-full',
                  isActive ? 'animate-pulse ' : 'bg-emerald-400/45',
                )}
              />
              <span>{step}</span>
            </div>
          );
        })}
        <TextShimmerWave className='font-mono text-sm' duration={1}>
          Generating code...
        </TextShimmerWave>
        <AnimatedSpan className="text-green-500">
          ✔ Captured your audience segments and experience level.
        </AnimatedSpan>

        <AnimatedSpan className="text-green-500">
          ✔ Mapped your goals, CTA style, and growth priorities.
        </AnimatedSpan>

        <AnimatedSpan className="text-green-500">
          ✔ Learned your tone, writing style, and inspiration signals.
        </AnimatedSpan>
        <p className="mt-6 text-sm font-semibold text-muted-foreground">
          Prefill in progress{dots} {elapsedSeconds}s
        </p>
      </Terminal>
    );
  }

  return (
    <Terminal className="w-full max-w-2xl bg-muted-foreground/5">
      <TypingAnimation>&gt; building your brand strategy profile...</TypingAnimation>

      {/* <TextShimmerWave
        className='[--base-color:#0D74CE] [--base-gradient-color:#5EB1EF]'
        duration={1}
        spread={1}
        zDistance={1}
        scaleDistance={1.1}
        rotateYDistance={20}
      >
        Creating the perfect dish...
      </TextShimmerWave> */}
      <AnimatedSpan className="text-green-500">
        ✔ Captured your audience segments and experience level.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Mapped your goals, CTA style, and growth priorities.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Learned your tone, writing style, and inspiration signals.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Organized your content pillars, formats, and posting cadence.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Added product positioning, features, and differentiators.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Applied capability constraints for a realistic weekly output.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500 mb-8">
        ✔ Prepared a high-confidence 30-day X planning brief.
      </AnimatedSpan>

      <AnimatedSpan className="text-blue-500">
        <span>ℹ Strategy context assembled:</span>
        <span className="pl-2">- audience + voice + offer + execution constraints</span>
      </AnimatedSpan>

      <TypingAnimation className="text-muted-foreground">
        You did the hard part. We now understand your brand direction clearly.
      </TypingAnimation>

      <TypingAnimation className="text-muted-foreground font-bold">
        Next: generating your tailored 30-day content strategy.
      </TypingAnimation>
    </Terminal>
  );
}

