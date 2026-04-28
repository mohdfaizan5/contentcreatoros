'use client';

import { useMemo, useState, useTransition } from 'react';
import { format } from 'date-fns';
import {
  ArrowUpRight,
  CalendarDots,
  CheckCircle,
  ClockCountdown,
  MagicWand,
  SpinnerGap,
  UploadSimple,
  WarningCircle,
} from '@phosphor-icons/react';

import type { GeneratedTweet, XAccountRole } from '@/shared/types/database';
import { buildTweetIntentUrl } from '@/features/x/lib/x-intent';
import CalendarSelectWithTime from '@/shared/components/calendar-select-with-time';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { generateTweetFromTemplate, scheduleGeneratedTweet } from '@/features/(legacy)/templates/generated-tweets';

type BrandTweetStudioProps = {
  canAutoSchedule: boolean;
  generatedTweets: GeneratedTweet[];
  templateId: string;
  xAccounts: Array<{
    id: string;
    role: XAccountRole;
    username: string;
  }>;
};

function getStatusCopy(status: GeneratedTweet['status']) {
  switch (status) {
    case 'draft':
      return { label: 'Draft', tone: 'bg-slate-900 text-white' };
    case 'scheduled':
      return { label: 'Scheduled', tone: 'bg-amber-100 text-amber-800' };
    case 'publishing':
      return { label: 'Publishing', tone: 'bg-sky-100 text-sky-800' };
    case 'published':
      return { label: 'Published', tone: 'bg-emerald-100 text-emerald-800' };
    case 'failed':
      return { label: 'Failed', tone: 'bg-rose-100 text-rose-800' };
  }
}

function getRoleLabel(role: XAccountRole) {
  return role === 'company' ? 'Company' : 'Founder';
}

export function BrandTweetStudio({
  canAutoSchedule,
  generatedTweets,
  templateId,
  xAccounts,
}: BrandTweetStudioProps) {
  const [tweets, setTweets] = useState(generatedTweets);
  const [selectedTweetId, setSelectedTweetId] = useState<string | null>(null);
  const [selectedXAccountId, setSelectedXAccountId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isGenerating, startGenerationTransition] = useTransition();
  const [isScheduling, startScheduleTransition] = useTransition();

  const selectedTweet = useMemo(
    () => tweets.find((tweet) => tweet.id === selectedTweetId) ?? null,
    [selectedTweetId, tweets],
  );
  const selectedXAccount = useMemo(
    () => xAccounts.find((account) => account.id === selectedXAccountId) ?? null,
    [selectedXAccountId, xAccounts],
  );

  const handleGenerate = () => {
    setGenerationError(null);
    startGenerationTransition(async () => {
      try {
        const result = await generateTweetFromTemplate(templateId);
        setTweets((currentTweets) => [result.generatedTweet, ...currentTweets]);
      } catch (error) {
        setGenerationError(
          error instanceof Error ? error.message : 'Unable to generate a brand tweet.',
        );
      }
    });
  };

  const handleSchedule = (date: Date) => {
    if (!selectedTweet) {
      return;
    }

    if (!selectedXAccountId) {
      setScheduleError('Choose a founder or company X account before scheduling.');
      return;
    }

    setScheduleError(null);
    startScheduleTransition(async () => {
      try {
        const scheduledTweet = await scheduleGeneratedTweet({
          generatedTweetId: selectedTweet.id,
          scheduledFor: date.toISOString(),
          xAccountId: selectedXAccountId,
        });

        setTweets((currentTweets) =>
          currentTweets.map((tweet) =>
            tweet.id === scheduledTweet.id ? scheduledTweet : tweet,
          ),
        );
        setIsScheduleDialogOpen(false);
        setSelectedTweetId(null);
      } catch (error) {
        setScheduleError(
          error instanceof Error ? error.message : 'Unable to schedule this tweet.',
        );
      }
    });
  };

  return (
    <section className="rounded-[28px] border border-border/40 bg-[linear-gradient(145deg,_rgba(255,255,255,0.96),_rgba(241,245,249,0.94))] p-6 shadow-[0_32px_80px_-50px_rgba(15,23,42,0.5)]">
      <div className="flex flex-col gap-4 border-b border-border/40 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Brand Engine
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Turn this template into your brand voice
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              &quot;My Brand&quot; pulls your onboarding answers into the prompt, uses this
              template as the structure reference, and writes a tweet that fits inside
              X&apos;s character limit.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex flex-wrap gap-2">
            {xAccounts.length > 0 ? (
              xAccounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => setSelectedXAccountId(account.id)}
                  className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                    selectedXAccountId === account.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-border/50 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {getRoleLabel(account.role)} @{account.username}
                </button>
              ))
            ) : (
              <div className="rounded-full border border-border/50 bg-white px-3 py-2 text-xs text-slate-500">
                No founder or company X account connected
              </div>
            )}
          </div>
          {canAutoSchedule ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              <CheckCircle className="size-4" weight="fill" />
              {selectedXAccount
                ? `Publishing as ${getRoleLabel(selectedXAccount.role)}`
                : 'Choose founder or company before scheduling'}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              <WarningCircle className="size-4" weight="fill" />
              Reconnect X to enable auto-scheduling
            </div>
          )}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="h-11 rounded-full px-5"
          >
            {isGenerating ? (
              <>
                <SpinnerGap className="size-4 animate-spin" />
                Generating
              </>
            ) : (
              <>
                <MagicWand className="size-4" />
                My Brand
              </>
            )}
          </Button>
        </div>
      </div>

      {generationError ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <WarningCircle className="size-4" weight="fill" />
          {generationError}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4">
        {tweets.length > 0 ? (
          tweets.map((tweet) => {
            const status = getStatusCopy(tweet.status);

            return (
              <article
                key={tweet.id}
                className="overflow-hidden rounded-[26px] border border-border/40 bg-white shadow-[0_20px_50px_-38px_rgba(15,23,42,0.45)]"
              >
                <div className="flex flex-col gap-4 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${status.tone}`}
                      >
                        {status.label}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {tweet.character_count}/280 chars
                      </span>
                      {tweet.scheduled_for ? (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <ClockCountdown className="size-3.5" />
                          {format(new Date(tweet.scheduled_for), 'PPP p')}
                        </span>
                      ) : null}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" className="rounded-full">
                          <UploadSimple className="size-4" />
                          Upload
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem
                          onSelect={() => {
                            window.location.assign(buildTweetIntentUrl(tweet.content));
                          }}
                        >
                          <ArrowUpRight className="size-4" />
                          Tweet now
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={!canAutoSchedule || !selectedXAccountId}
                          onSelect={() => {
                            setSelectedTweetId(tweet.id);
                            setScheduleError(null);
                            setIsScheduleDialogOpen(true);
                          }}
                        >
                          <CalendarDots className="size-4" />
                          Schedule tweet
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="rounded-[22px] bg-slate-50 p-4">
                    <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-800">
                      {tweet.content}
                    </p>
                  </div>

                  {tweet.status === 'failed' && tweet.error_message ? (
                    <p className="text-sm text-rose-700">{tweet.error_message}</p>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[26px] border border-dashed border-border/50 bg-slate-50 px-5 py-8 text-center">
            <p className="text-base font-medium text-slate-900">
              No brand-generated tweets yet
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Click &quot;My Brand&quot; to turn this template into a ready-to-publish tweet using
              your onboarding context.
            </p>
          </div>
        )}
      </div>

      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Schedule tweet</DialogTitle>
            <DialogDescription>
              Pick the date and time for this tweet. It will publish through{' '}
              {selectedXAccount
                ? `${getRoleLabel(selectedXAccount.role)} @${selectedXAccount.username}.`
                : 'the selected founder/company account.'}
            </DialogDescription>
          </DialogHeader>

          <CalendarSelectWithTime
            confirmLabel="Schedule tweet"
            isSubmitting={isScheduling}
            onConfirm={handleSchedule}
          />

          {scheduleError ? (
            <p className="text-sm text-rose-700">{scheduleError}</p>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
