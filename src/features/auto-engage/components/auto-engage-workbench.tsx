'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ChevronDown,
  Copy,
  ExternalLink,
  RefreshCcw,
  ShieldCheck,
  SkipForward,
  Sparkles,
  Users2,
} from 'lucide-react';

import {
  addAutoEngageTarget,
  generateAutoEngageSuggestions,
  removeAutoEngageTarget,
  saveAutoEngageProfile,
  updateAutoEngageSuggestionStatus,
  type AutoEngagePageData,
} from '@/features/auto-engage/actions/auto-engage';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { toastManager } from '@/shared/components/ui/toast';
import { cn } from '@/shared/lib/utils';
import type { AutoEngageGoal, AutoEngageSuggestionStatus } from '@/shared/types/database';

type AutoEngageProfileView = AutoEngagePageData['profiles'][number];
type AutoEngageAccountView = AutoEngagePageData['xAccounts'][number];

type ProfileFormState = {
  brandVoice: string;
  contentPillars: string;
  dailyLimit: number;
  goal: AutoEngageGoal;
  niche: string;
  offer: string;
  profileName: string;
  targetAudience: string;
  topicsToAvoid: string;
};

function createFormState(
  account: AutoEngageAccountView | undefined,
  profile: AutoEngageProfileView | undefined,
  defaults: AutoEngagePageData['onboardingDefaults'],
): ProfileFormState {
  return {
    brandVoice: profile?.brand_voice ?? defaults.brandVoice,
    contentPillars: (profile?.content_pillars ?? defaults.contentPillars).join('\n'),
    dailyLimit: profile?.daily_limit ?? 10,
    goal:
      profile?.primary_goal ??
      (account?.role === 'founder'
        ? 'founder_personal_branding'
        : 'lead_generation'),
    niche: profile?.niche ?? defaults.niche,
    offer: profile?.offer ?? defaults.offer,
    profileName:
      profile?.profile_name ??
      `${account?.role === 'company' ? 'Company' : 'Founder'} @${account?.username ?? 'account'}`,
    targetAudience: profile?.target_audience ?? defaults.targetAudience,
    topicsToAvoid: (profile?.topics_to_avoid ?? defaults.topicsToAvoid).join('\n'),
  };
}

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

export function AutoEngageWorkbench({
  onboardingDefaults,
  pageError,
  profiles,
  xAccounts,
}: AutoEngagePageData) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(() => (profiles.length > 0 ? 2 : 1));
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    profiles[0]?.x_account_id ?? xAccounts[0]?.id ?? null,
  );
  const [profileForm, setProfileForm] = useState<ProfileFormState>(() =>
    createFormState(xAccounts[0], profiles[0], onboardingDefaults),
  );
  const [accountTarget, setAccountTarget] = useState('');
  const [keywordTarget, setKeywordTarget] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedAccount = useMemo(
    () => xAccounts.find((account) => account.id === selectedAccountId),
    [selectedAccountId, xAccounts],
  );
  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.x_account_id === selectedAccountId),
    [profiles, selectedAccountId],
  );

  useEffect(() => {
    setProfileForm(createFormState(selectedAccount, selectedProfile, onboardingDefaults));
  }, [onboardingDefaults, selectedAccount, selectedProfile]);

  const accountTargets = (selectedProfile?.targets ?? []).filter((target) => target.target_type === 'account');
  const keywordTargets = (selectedProfile?.targets ?? []).filter((target) => target.target_type === 'keyword');
  const suggestions = selectedProfile?.suggestions ?? [];
  const hasTargets = accountTargets.length > 0 || keywordTargets.length > 0;

  const updateForm = <Key extends keyof ProfileFormState>(key: Key, value: ProfileFormState[Key]) => {
    setProfileForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const runAction = (callback: () => Promise<void>) => {
    startTransition(async () => {
      await callback();
    });
  };

  const refreshAfterSuccess = () => {
    router.refresh();
  };

  const handleNext = () => {
    if (!selectedAccountId) {
      showToast({
        description: 'Pick a founder or company X account first.',
        id: 'auto-engage-account-required',
        title: 'Account required',
        type: 'warning',
      });
      return;
    }

    setStep(2);
  };

  const handleSaveProfile = () => {
    if (!selectedAccountId) {
      showToast({
        description: 'Pick a founder or company X account first.',
        id: 'auto-engage-account-required',
        title: 'Account required',
        type: 'warning',
      });
      return;
    }

    showToast({
      id: 'auto-engage-save-profile',
      title: 'Saving strategy...',
      type: 'loading',
    });

    runAction(async () => {
      const result = await saveAutoEngageProfile({
        ...profileForm,
        xAccountId: selectedAccountId,
      });

      if (!result.ok) {
        showToast({
          description: result.error,
          id: 'auto-engage-save-profile',
          title: 'Unable to save strategy',
          type: 'error',
        });
        return;
      }

      showToast({
        id: 'auto-engage-save-profile',
        title: 'Strategy saved',
        type: 'success',
      });
      refreshAfterSuccess();
    });
  };

  const handleAddTarget = (targetType: 'account' | 'keyword') => {
    if (!selectedAccountId) {
      showToast({
        description: 'Pick an X account first.',
        id: 'auto-engage-account-required',
        title: 'Account required',
        type: 'warning',
      });
      return;
    }

    const rawValue = targetType === 'account' ? accountTarget : keywordTarget;

    showToast({
      id: `auto-engage-add-${targetType}`,
      title: `Adding ${targetType}...`,
      type: 'loading',
    });

    runAction(async () => {
      const result = await addAutoEngageTarget({
        targetType,
        value: rawValue,
        xAccountId: selectedAccountId,
      });

      if (!result.ok) {
        showToast({
          description: result.error,
          id: `auto-engage-add-${targetType}`,
          title: `Unable to add ${targetType}`,
          type: 'error',
        });
        return;
      }

      showToast({
        id: `auto-engage-add-${targetType}`,
        title: targetType === 'account' ? 'Tracked account added' : 'Keyword added',
        type: 'success',
      });
      if (targetType === 'account') {
        setAccountTarget('');
      } else {
        setKeywordTarget('');
      }
      refreshAfterSuccess();
    });
  };

  const handleRemoveTarget = (targetId: string) => {
    showToast({
      id: `auto-engage-remove-${targetId}`,
      title: 'Removing target...',
      type: 'loading',
    });

    runAction(async () => {
      const result = await removeAutoEngageTarget(targetId);

      if (!result.ok) {
        showToast({
          description: result.error,
          id: `auto-engage-remove-${targetId}`,
          title: 'Unable to remove target',
          type: 'error',
        });
        return;
      }

      showToast({
        id: `auto-engage-remove-${targetId}`,
        title: 'Target removed',
        type: 'success',
      });
      refreshAfterSuccess();
    });
  };

  const handleGenerateQueue = () => {
    if (!selectedAccountId) {
      showToast({
        description: 'Pick an X account first.',
        id: 'auto-engage-account-required',
        title: 'Account required',
        type: 'warning',
      });
      return;
    }

    if (!hasTargets) {
      showToast({
        description: 'Add at least one tracked account or one keyword before generating the queue.',
        id: 'auto-engage-target-required',
        title: 'Targets required',
        type: 'warning',
      });
      return;
    }

    showToast({
      description: 'We are finding posts and drafting replies in the selected voice.',
      id: 'auto-engage-generate',
      title: 'Generating today’s queue...',
      type: 'loading',
    });

    runAction(async () => {
      const result = await generateAutoEngageSuggestions({
        xAccountId: selectedAccountId,
      });

      if (!result.ok) {
        showToast({
          description: result.error,
          id: 'auto-engage-generate',
          title: 'Unable to generate queue',
          type: 'error',
        });
        return;
      }

      const count = result.data?.count ?? 0;
      const runId = result.data?.runId;
      showToast({
        description: `${count} draft opportunities are ready for review.`,
        id: 'auto-engage-generate',
        title: 'Queue ready',
        type: 'success',
      });
      if (runId) {
        router.push(`/app/auto-engage/${runId}`);
        return;
      }
      refreshAfterSuccess();
    });
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

  if (!xAccounts.length) {
    return (
      <Card className="mx-auto max-w-3xl border-border/70">
        <CardHeader>
          <CardTitle>Connect an X account first</CardTitle>
          <CardDescription>
            Auto Engage needs a founder or company X connection before it can discover posts and prepare draft replies.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/app/settings">
              Open settings
              <ExternalLink className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/auto-engage/policies">Read the policies</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-12">
      {/* <section className="rounded-[2rem] border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(29,155,240,0.14),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.03),transparent_60%)] p-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1d9bf0]/20 bg-[#1d9bf0]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#1d9bf0]">
            <Sparkles className="size-3.5" />
            Auto Engage v1
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Pick an account. Add a few targets. Generate draft replies.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              This version is intentionally simple and safe. We find relevant X posts, write replies in the right voice, and leave the actual posting to you.
            </p>
          </div>
        </div>
      </section> */}
      <h1 className="text-3xl font-semibold tracking-tight sm:text-3xl">
        Pick an account. Add a few targets. Generate draft replies.
      </h1>

      {pageError ? (
        <Alert variant="warning">
          <ShieldCheck className="size-4" />
          <AlertTitle>Auto Engage needs attention</AlertTitle>
          <AlertDescription>{pageError}</AlertDescription>
        </Alert>
      ) : null}

      <div 
      className='max-w-3xl'
      // className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]"
      >
        {/* <Card className="border-border/70 lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="text-base">Progress</CardTitle>
            <CardDescription>Default path only. Advanced settings stay out of the way.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className={cn('rounded-2xl border px-4 py-3 text-sm', step >= 1 ? 'border-[#1d9bf0]/30 bg-[#1d9bf0]/8' : 'border-border/60')}>
              <p className="font-medium">1. Choose account</p>
              <p className="mt-1 text-muted-foreground">Founder or company.</p>
            </div>
            <div className={cn('rounded-2xl border px-4 py-3 text-sm', step >= 2 ? 'border-[#1d9bf0]/30 bg-[#1d9bf0]/8' : 'border-border/60')}>
              <p className="font-medium">2. Add targets + generate</p>
              <p className="mt-1 text-muted-foreground">Tracked accounts, keywords, then today&apos;s queue.</p>
            </div>
          </CardContent>
        </Card> */}

        <div className="space-y-6">
          {step === 1 ? (
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Select the account</CardTitle>
                <CardDescription>
                  Start with the X account that should own the engagement queue.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3">
                  {xAccounts.map((account) => {
                    const isActive = account.id === selectedAccountId;
                    return (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => setSelectedAccountId(account.id)}
                        className={cn(
                          'flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition-colors',
                          isActive
                            ? 'border-[#1d9bf0] bg-[#1d9bf0]/10'
                            : 'border-border/60 bg-background hover:bg-muted/40',
                        )}
                      >
                        <div>
                          <p className="font-medium">
                            {account.role === 'company' ? 'Company' : 'Founder'} @{account.username}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {account.role === 'company'
                              ? 'Use the company voice and audience.'
                              : 'Use the founder voice and audience.'}
                          </p>
                        </div>
                        {isActive ? <Badge>Selected</Badge> : null}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleNext} loading={isPending}>
                    Next
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/app/auto-engage/policies">Read the policies</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-border/70">
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle>
                        {selectedAccount?.role === 'company' ? 'Company' : 'Founder'} @{selectedAccount?.username}
                      </CardTitle>
                      <CardDescription>
                        Add a couple of discovery targets, then generate today&apos;s manual-reply queue.
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button onClick={handleGenerateQueue} loading={isPending}>
                        <RefreshCcw className="size-4" />
                        Generate queue
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-6 xl:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label>Tracked accounts</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="@someone or someone"
                          value={accountTarget}
                          onChange={(event) => setAccountTarget(event.target.value)}
                        />
                        <Button
                          variant="outline"
                          onClick={() => handleAddTarget('account')}
                          loading={isPending}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {accountTargets.length ? accountTargets.map((target) => (
                          <button
                            key={target.id}
                            type="button"
                            onClick={() => handleRemoveTarget(target.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1.5 text-sm transition-colors hover:bg-muted/60"
                          >
                            @{target.value}
                            <span className="text-muted-foreground">remove</span>
                          </button>
                        )) : (
                          <p className="text-sm text-muted-foreground">None yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Keywords</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="ai agents, startup landing pages, growth loops"
                          value={keywordTarget}
                          onChange={(event) => setKeywordTarget(event.target.value)}
                        />
                        <Button
                          variant="outline"
                          onClick={() => handleAddTarget('keyword')}
                          loading={isPending}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {keywordTargets.length ? keywordTargets.map((target) => (
                          <button
                            key={target.id}
                            type="button"
                            onClick={() => handleRemoveTarget(target.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1.5 text-sm transition-colors hover:bg-muted/60"
                          >
                            {target.value}
                            <span className="text-muted-foreground">remove</span>
                          </button>
                        )) : (
                          <p className="text-sm text-muted-foreground">None yet.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 p-5">
                    <div className="flex items-start gap-3">
                      <Users2 className="mt-0.5 size-5 text-[#1d9bf0]" />
                      <div className="space-y-2">
                        <p className="font-medium">What happens next</p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          We look through tracked accounts and recent keyword matches, score the best opportunities, and draft replies in the chosen voice. Nothing is auto-posted.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">Draft only</Badge>
                          <Badge variant="outline">Manual reply</Badge>
                          <Badge variant="outline">Up to 10/day</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                <Card className="border-border/70">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-base">Advanced strategy</CardTitle>
                        <CardDescription>
                          Hidden by default. Use this only if you want to tune the voice, audience, or goal.
                        </CardDescription>
                      </div>
                      <CollapsibleTrigger
                        className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-2 text-sm"
                      >
                        {advancedOpen ? 'Hide' : 'Show'}
                        <ChevronDown className={cn('size-4 transition-transform', advancedOpen && 'rotate-180')} />
                      </CollapsibleTrigger>
                    </div>
                  </CardHeader>
                  <CollapsiblePanel>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="profile-name">Profile name</Label>
                        <Input
                          id="profile-name"
                          value={profileForm.profileName}
                          onChange={(event) => updateForm('profileName', event.target.value)}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="niche">Niche</Label>
                          <Input
                            id="niche"
                            value={profileForm.niche}
                            onChange={(event) => updateForm('niche', event.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="offer">Offer</Label>
                          <Input
                            id="offer"
                            value={profileForm.offer}
                            onChange={(event) => updateForm('offer', event.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="target-audience">Target audience</Label>
                        <Textarea
                          id="target-audience"
                          value={profileForm.targetAudience}
                          onChange={(event) => updateForm('targetAudience', event.target.value)}
                          textareaClassName="min-h-20"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="brand-voice">Brand voice</Label>
                        <Textarea
                          id="brand-voice"
                          value={profileForm.brandVoice}
                          onChange={(event) => updateForm('brandVoice', event.target.value)}
                          textareaClassName="min-h-20"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="content-pillars">Content pillars</Label>
                          <Textarea
                            id="content-pillars"
                            value={profileForm.contentPillars}
                            onChange={(event) => updateForm('contentPillars', event.target.value)}
                            textareaClassName="min-h-28"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="topics-to-avoid">Topics to avoid</Label>
                          <Textarea
                            id="topics-to-avoid"
                            value={profileForm.topicsToAvoid}
                            onChange={(event) => updateForm('topicsToAvoid', event.target.value)}
                            textareaClassName="min-h-28"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Primary goal</Label>
                          <div className="grid gap-2">
                            {(
                              [
                                ['founder_personal_branding', 'Founder personal branding'],
                                ['lead_generation', 'Lead generation'],
                                ['community_engagement', 'Community engagement'],
                              ] as const
                            ).map(([value, label]) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => updateForm('goal', value)}
                                className={cn(
                                  'rounded-2xl border px-4 py-3 text-left text-sm transition-colors',
                                  profileForm.goal === value
                                    ? 'border-[#1d9bf0] bg-[#1d9bf0]/10 text-foreground'
                                    : 'border-border/60 bg-background hover:bg-muted/40',
                                )}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="daily-limit">Daily suggestion cap</Label>
                          <Input
                            id="daily-limit"
                            type="number"
                            min={1}
                            max={10}
                            value={profileForm.dailyLimit}
                            onChange={(event) => updateForm('dailyLimit', Number(event.target.value || 10))}
                          />
                          <p className="text-xs text-muted-foreground">
                            The queue remains intentionally capped so the drafts stay selective.
                          </p>
                        </div>
                      </div>

                      <Button onClick={handleSaveProfile} loading={isPending}>
                        Save advanced strategy
                      </Button>
                    </CardContent>
                  </CollapsiblePanel>
                </Card>
              </Collapsible>

              <Card className="border-border/70">
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle>Today&apos;s draft queue</CardTitle>
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
                        >
                          <SkipForward className="size-4" />
                          Skip
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleUpdateStatus(suggestion.id, 'posted')}
                        >
                          <ShieldCheck className="size-4" />
                          Mark as posted
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-3xl border border-dashed border-border/70 bg-muted/15 p-8 text-center">
                      <p className="font-medium">No draft opportunities yet.</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Add a couple of targets, then generate today&apos;s queue.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
