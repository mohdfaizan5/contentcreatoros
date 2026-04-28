'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { SpeechInputPro } from '@/shared/components/ui/speech-input-pro';
import { FaviconSearch } from '@/features/onboarding/components/favicon-search';

type SpeechControlProps = {
  value: string;
  onValueChange: (value: string) => void;
  languageCode?: string;
};

type OnboardingSpeechInputProps = SpeechControlProps & {
  className?: string;
  placeholder?: string;
  type?: string;
};

type OnboardingSpeechTextareaProps = SpeechControlProps & {
  className?: string;
  placeholder?: string;
  rows?: number;
};

type OnboardingWebsiteSearchInputProps = SpeechControlProps & {
  className?: string;
  placeholder?: string;
};

type OnboardingXAccountInputProps = SpeechControlProps & {
  className?: string;
  placeholder?: string;
};

type XProfileLookupResult = {
  id?: string;
  name: string;
  username: string;
  profileImageUrl?: string | null;
  verified?: boolean;
  followersCount?: number | null;
  followingCount?: number | null;
  tweetCount?: number | null;
};

function extractXHandle(input: string): string | null {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('@')) {
    const handle = trimmed.slice(1).trim();
    return handle || null;
  }

  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    const hostname = url.hostname.toLowerCase();

    if (!hostname.includes('x.com') && !hostname.includes('twitter.com')) {
      return null;
    }

    const [firstPathSegment] = url.pathname
      .split('/')
      .map((segment) => segment.trim())
      .filter(Boolean);

    return firstPathSegment || null;
  } catch {
    const directHandle = trimmed.replace(/^@/, '').replace(/^https?:\/\//i, '');

    if (directHandle.includes('/') || directHandle.includes(' ')) {
      return null;
    }

    return directHandle || null;
  }
}

function formatMetric(value?: number | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '--';
  }

  return value.toLocaleString();
}

export function OnboardingSpeechInput({
  className,
  languageCode,
  onValueChange,
  placeholder,
  type = 'text',
  value,
}: OnboardingSpeechInputProps) {
  return (
    <SpeechInputPro
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      type={type}
      className={className}
      languageCode={languageCode}
    />
  );
}

export function OnboardingSpeechTextarea({
  className,
  languageCode,
  onValueChange,
  placeholder,
  rows = 4,
  value,
}: OnboardingSpeechTextareaProps) {
  return (
    <SpeechInputPro
      as="textarea"
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      rows={rows}
      className={className}
      languageCode={languageCode}
    />
  );
}

export function OnboardingWebsiteSearchInput({
  className,
  onValueChange,
  placeholder,
  value,
}: OnboardingWebsiteSearchInputProps) {
  return (
    <FaviconSearch
      value={value}
      onChange={onValueChange}
      placeholder={placeholder}
      className={className}
      inputClassName="h-12 rounded-lg border-border/40 bg-background"
      clearable
    />
  );
}

export function OnboardingXAccountInput({
  className,
  languageCode,
  onValueChange,
  placeholder,
  value,
}: OnboardingXAccountInputProps) {
  const [profile, setProfile] = useState<XProfileLookupResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const handle = useMemo(() => extractXHandle(value), [value]);

  useEffect(() => {
    if (!handle) {
      setProfile(null);
      setLookupError(null);
      setIsLookingUp(false);
      return;
    }

    const abortController = new AbortController();
    const timeout = setTimeout(async () => {
      setIsLookingUp(true);
      setLookupError(null);

      try {
        const response = await fetch(
          `/api/x/profile?handle=${encodeURIComponent(handle)}`,
          {
            signal: abortController.signal,
          },
        );

        const payload = (await response.json().catch(() => null)) as
          | {
              error?: string;
              profile?: XProfileLookupResult;
            }
          | null;

        if (!response.ok || !payload?.profile) {
          throw new Error(payload?.error || 'Unable to find this X account.');
        }

        setProfile(payload.profile);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setProfile(null);
        setLookupError(error instanceof Error ? error.message : 'Unable to load X account.');
      } finally {
        if (!abortController.signal.aborted) {
          setIsLookingUp(false);
        }
      }
    }, 500);

    return () => {
      abortController.abort();
      clearTimeout(timeout);
    };
  }, [handle]);

  return (
    <div className="space-y-2">
      <SpeechInputPro
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
        className={className}
        type="text"
        languageCode={languageCode}
      />

      {isLookingUp ? (
        <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Checking X account...
        </p>
      ) : null}

      {profile ? (
        <div className="rounded-lg border border-border/40 bg-card px-3 py-2">
          <div className="flex items-center gap-2">
            {profile.profileImageUrl ? (
              <img
                src={profile.profileImageUrl}
                alt={profile.name}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{profile.name}</p>
              <p className="truncate text-xs text-muted-foreground">@{profile.username}</p>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground">{formatMetric(profile.followersCount)}</p>
              <p>Followers</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">{formatMetric(profile.followingCount)}</p>
              <p>Following</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">{formatMetric(profile.tweetCount)}</p>
              <p>Posts</p>
            </div>
          </div>
        </div>
      ) : null}

      {lookupError ? <p className="text-xs text-amber-600">{lookupError}</p> : null}
    </div>
  );
}

