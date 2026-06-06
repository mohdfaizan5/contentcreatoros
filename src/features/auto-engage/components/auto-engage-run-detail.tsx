'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { format } from 'date-fns';
import { Copy, ExternalLink, ShieldCheck, SkipForward } from 'lucide-react';

import { updateAutoEngageSuggestionStatus } from '@/features/auto-engage/actions/auto-engage';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { toastManager } from '@/shared/components/ui/toast';
import type { AutoEngageSuggestion, AutoEngageSuggestionStatus, XAccountRole } from '@/shared/types/database';

function formatRelativeTime(value: string | null) {
  if (!value) {
    return 'Freshly discovered';
  }

  const timestamp = new Date(value).getTime();
  const deltaMinutes = Math.max(1, Math.round((Date.now() - timestamp) / 60_000));

  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const deltaHours = Math.round(deltaMinutes / 60);

  if (deltaHours < 24) {
    return `${deltaHours}h ago`;
  }

  return `${Math.round(deltaHours / 24)}d ago`;
}

function getStatusTone(status: AutoEngageSuggestionStatus) {
  switch (status) {
    case 'posted':
      return 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300';
    case 'copied':
      return 'bg-sky-500/12 text-sky-700 dark:text-sky-300';
    case 'skipped':
      return 'bg-amber-500/12 text-amber-700 dark:text-amber-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function showToast(params: {
  description?: string;
  id: string;
  title: string;
  type: 'error' | 'info' | 'loading' | 'success' | 'warning';
}) {
  toastManager.add({
    description: params.description,
    id: params.id,
    title: params.title,
    type: params.type,
  });
}

type AutoEngageRunDetailProps = {
  account: {
    role: XAccountRole;
    username: string;
  };
  createdAt: string;
  pageError?: string | null;
  runId: string;
  suggestions: AutoEngageSuggestion[];
};

export function AutoEngageRunDetail({
  account,
  createdAt,
  pageError,
  runId,
  suggestions,
}: AutoEngageRunDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const counts = suggestions.reduce(
    (total, suggestion) => {
      total.total += 1;
      if (suggestion.status === 'pending') total.pending += 1;
      if (suggestion.status === 'copied') total.copied += 1;
      if (suggestion.status === 'posted') total.posted += 1;
      if (suggestion.status === 'skipped') total.skipped += 1;
      return total;
    },
    { total: 0, pending: 0, copied: 0, posted: 0, skipped: 0 },
  );

  const runAction = (callback: () => Promise<void>) => {
    startTransition(async () => {
      await callback();
    });
  };

  const refreshAfterSuccess = () => {
    router.refresh();
  };

  const handleCopyReply = async (suggestionId: string, reply: string) => {
    try {
      await navigator.clipboard.writeText(reply);
      showToast({
        description: 'Open the X post and paste the draft there.',
        id: `auto-engage-copy-${suggestionId}`,
        title: 'Reply copied',
        type: 'success',
      });

      runAction(async () => {
        const result = await updateAutoEngageSuggestionStatus({
          runId,
          status: 'copied',
          suggestionId,
        });

        if (!result.ok) {
          showToast({
            description: result.error,
            id: `auto-engage-copy-${suggestionId}`,
            title: 'Copied, but status did not update',
            type: 'warning',
          });
          return;
        }

        refreshAfterSuccess();
      });
    } catch {
      showToast({
        description: 'Clipboard access failed. Copy the draft manually.',
        id: `auto-engage-copy-${suggestionId}`,
        title: 'Unable to copy',
        type: 'error',
      });
    }
  };

  const handleUpdateStatus = (suggestionId: string, status: AutoEngageSuggestionStatus) => {
    showToast({
      id: `auto-engage-status-${suggestionId}`,
      title: status === 'posted' ? 'Marking as posted...' : 'Updating suggestion...',
      type: 'loading',
    });

    runAction(async () => {
      const result = await updateAutoEngageSuggestionStatus({
        runId,
        status,
        suggestionId,
      });

      if (!result.ok) {
        showToast({
          description: result.error,
          id: `auto-engage-status-${suggestionId}`,
          title: 'Unable to update suggestion',
          type: 'error',
        });
        return;
      }

      showToast({
        id: `auto-engage-status-${suggestionId}`,
        title: status === 'posted' ? 'Marked as posted' : 'Suggestion skipped',
        type: 'success',
      });
      refreshAfterSuccess();
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-12">
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Auto Engage Run</p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {account.role === 'company' ? 'Company' : 'Founder'} @{account.username}
            </h1>
            <p className="text-sm text-muted-foreground">
              Generated {format(new Date(createdAt), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/app/auto-engage">All runs</Link>
            </Button>
            <Button asChild>
              <Link href="/app/auto-engage/new">New run</Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{counts.total} drafts</Badge>
          <Badge variant="outline">{counts.copied} copied</Badge>
          <Badge variant="outline">{counts.posted} posted</Badge>
          <Badge variant="outline">{counts.skipped} skipped</Badge>
        </div>
      </section>

      {pageError ? (
        <Alert variant="warning">
          <ShieldCheck className="size-4" />
          <AlertTitle>Auto Engage needs attention</AlertTitle>
          <AlertDescription>{pageError}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="border-border/70">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Draft queue</CardTitle>
              <CardDescription>
                Open the post, copy the draft, and reply manually on X.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Manual reply only</Badge>
              <Badge variant="outline">{suggestions.length} drafts</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions.length ? suggestions.map((suggestion) => (
            <div key={suggestion.id} className="rounded-3xl border border-border/60 bg-background/70 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">@{suggestion.x_post_author_username}</p>
                    <Badge className={getStatusTone(suggestion.status)}>{suggestion.status}</Badge>
                    <Badge variant="outline">Score {suggestion.score}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {suggestion.source_value ? `Matched via ${suggestion.source_value}. ` : ''}
                    {formatRelativeTime(suggestion.x_post_created_at)}
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href={suggestion.x_post_url} target="_blank" rel="noreferrer">
                    Open on X
                    <ExternalLink className="size-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
                <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6">{suggestion.x_post_text}</p>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Why this one</p>
                  <p className="mt-2 text-sm leading-6">{suggestion.reason}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background p-4">
                  <p className="text-sm font-medium">Risk</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {suggestion.risk_level === 'low'
                      ? 'Low risk'
                      : suggestion.risk_level === 'medium'
                        ? 'Medium risk'
                        : 'Avoid'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {suggestion.reply_options.map((reply, index) => (
                  <div
                    key={`${suggestion.id}-${index}`}
                    className="rounded-2xl border border-border/60 bg-background p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="outline">Draft {index + 1}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyReply(suggestion.id, reply)}
                        disabled={isPending}
                      >
                        <Copy className="size-4" />
                        Copy
                      </Button>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-6">
                      {reply}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(suggestion.id, 'skipped')}
                  disabled={isPending}
                >
                  <SkipForward className="size-4" />
                  Skip
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(suggestion.id, 'posted')}
                  disabled={isPending}
                >
                  <ShieldCheck className="size-4" />
                  Mark as posted
                </Button>
              </div>
            </div>
          )) : (
            <div className="rounded-3xl border border-dashed border-border/70 bg-muted/15 p-8 text-center">
              <p className="font-medium">No draft opportunities in this run.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Generate a new run if you need fresh suggestions.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
