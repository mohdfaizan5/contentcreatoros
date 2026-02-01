'use client';

import React, { useState, useTransition, Suspense } from 'react';
import Link from 'next/link';
import { Tweet } from 'react-tweet';
import { Sparkle, Trash, Link as LinkIcon, User, TwitterLogo, LinkedinLogo, YoutubeLogo, InstagramLogo } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { createInspiration, deleteInspiration } from '@/actions/inspiration';
import { detectUrlInfo, getPlatformColors, extractTweetId, type Platform } from '@/lib/url-detector';
import type { Inspiration, InspirationType } from '@/types/database';

const platformIcons: Record<Platform, React.ElementType> = {
    x: TwitterLogo,
    linkedin: LinkedinLogo,
    youtube: YoutubeLogo,
    instagram: InstagramLogo,
    link: LinkIcon,
};

interface InspirationFormProps {
    onClose?: () => void;
}

export function InspirationForm({ onClose }: InspirationFormProps) {
    const [url, setUrl] = useState('');
    const [type, setType] = useState<InspirationType>('content');
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [whatWorked, setWhatWorked] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleSubmit = () => {
        if (!url.trim()) return;

        startTransition(async () => {
            try {
                await createInspiration({
                    url: url.trim(),
                    type,
                    title: title.trim() || null,
                    notes: notes.trim() || null,
                    what_worked: whatWorked.trim() || null,
                });
                setUrl('');
                setType('content');
                setTitle('');
                setNotes('');
                setWhatWorked('');
                onClose?.();
            } catch (error) {
                console.error('Failed to save inspiration:', error);
            }
        });
    };

    return (
        <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
                <Sparkle className="h-5 w-5 text-purple-500" weight="duotone" />
                <h2 className="font-semibold">Add Inspiration</h2>
            </div>

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setType('content')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${type === 'content' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                        }`}
                >
                    <LinkIcon className="h-4 w-4" />
                    Content Link
                </button>
                <button
                    type="button"
                    onClick={() => setType('creator')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${type === 'creator' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                        }`}
                >
                    <User className="h-4 w-4" />
                    Creator Profile
                </button>
            </div>

            <input
                type="url"
                placeholder="Paste URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <input
                type="text"
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <textarea
                placeholder="Why was it good? (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />

            <textarea
                placeholder="What worked? (hook, framing, angle...)"
                value={whatWorked}
                onChange={(e) => setWhatWorked(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />

            <Button onClick={handleSubmit} disabled={!url.trim() || isPending} className="w-full">
                {isPending ? 'Saving...' : 'Save Inspiration'}
            </Button>
        </div>
    );
}

interface InspirationCardProps {
    inspiration: Inspiration;
}

export function InspirationCard({ inspiration }: InspirationCardProps) {
    const [isPending, startTransition] = useTransition();
    const urlInfo = detectUrlInfo(inspiration.url);
    const colors = getPlatformColors(urlInfo.platform);
    const PlatformIcon = platformIcons[urlInfo.platform];
    const tweetId = urlInfo.platform === 'x' && urlInfo.isPost ? extractTweetId(inspiration.url) : null;

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Delete this inspiration?')) return;
        startTransition(async () => {
            await deleteInspiration(inspiration.id);
        });
    };

    // For X posts, show embed
    if (tweetId) {
        return (
            <div className="group rounded-xl border bg-card overflow-hidden transition-all hover:shadow-md hover:border-primary/30">
                {/* Header with actions */}
                <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                    <Link href={`/app/inspiration/${inspiration.id}`} className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${colors.bg} ${colors.text}`}>
                            <PlatformIcon className="h-3 w-3" weight="fill" />
                            X
                        </span>
                        {inspiration.title && (
                            <span className="text-sm font-medium truncate max-w-[150px]">{inspiration.title}</span>
                        )}
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleDelete}
                        disabled={isPending}
                        className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>

                {/* Tweet Embed */}
                <Link href={`/app/inspiration/${inspiration.id}`} className="block">
                    <div className="flex justify-center [&>div]:my-0! [&_.react-tweet-theme]:my-0!">
                        <TweetEmbed id={tweetId} />
                    </div>
                </Link>

                {/* Notes if present */}
                {inspiration.notes && (
                    <div className="px-4 py-3 border-t bg-muted/10">
                        <p className="text-sm text-muted-foreground line-clamp-2">{inspiration.notes}</p>
                    </div>
                )}
            </div>
        );
    }

    // For other platforms, show simple card
    return (
        <Link href={`/app/inspiration/${inspiration.id}`}>
            <div className="group rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        {/* Platform badge */}
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${colors.bg} ${colors.text}`}>
                                <PlatformIcon className="h-3 w-3" weight="fill" />
                                {urlInfo.platform.toUpperCase()}
                            </span>
                            {urlInfo.isProfile && (
                                <span className="text-xs text-muted-foreground">Profile</span>
                            )}
                        </div>

                        {/* Title */}
                        <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                            {inspiration.title || new URL(inspiration.url).hostname.replace('www.', '')}
                        </h3>

                        {inspiration.notes && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{inspiration.notes}</p>
                        )}

                        {inspiration.what_worked && (
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1 line-clamp-1">
                                ✓ {inspiration.what_worked}
                            </p>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleDelete}
                        disabled={isPending}
                        className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Link>
    );
}

// Tweet embed with error boundary fallback
function TweetEmbed({ id }: { id: string }) {
    return (
        <ErrorBoundary fallback={<TweetFallback />}>
            <Suspense fallback={<TweetLoading />}>
                <Tweet id={id} />
            </Suspense>
        </ErrorBoundary>
    );
}

function TweetLoading() {
    return (
        <div className="w-full max-w-[500px] p-8 flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-sky-500/20" />
                <div className="h-4 w-48 rounded bg-muted" />
                <div className="h-3 w-64 rounded bg-muted" />
            </div>
        </div>
    );
}

function TweetFallback() {
    return (
        <div className="w-full max-w-[500px] p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <TwitterLogo className="h-10 w-10 text-sky-500/50" weight="fill" />
                <span className="text-sm">Tweet preview unavailable</span>
            </div>
        </div>
    );
}

// Simple error boundary
class ErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

interface InspirationListProps {
    inspirations: Inspiration[];
}

export function InspirationList({ inspirations }: InspirationListProps) {
    if (inspirations.length === 0) {
        return (
            <div className="text-center py-12 rounded-xl border border-dashed">
                <Sparkle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">No inspiration saved</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Start collecting content that inspires you
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-3">
            {inspirations.map((insp) => (
                <InspirationCard key={insp.id} inspiration={insp} />
            ))}
        </div>
    );
}

// Masonry grid layout
export function InspirationMasonryGrid({ inspirations }: InspirationListProps) {
    if (inspirations.length === 0) {
        return (
            <div className="text-center py-16 rounded-2xl border border-dashed bg-muted/20">
                <Sparkle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" weight="duotone" />
                <h3 className="font-semibold text-muted-foreground">No inspiration saved</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                    Start collecting content that sparks your creativity
                </p>
            </div>
        );
    }

    return (
        <div
            className="columns-1 md:columns-2 lg:columns-3 gap-4"
            style={{ columnFill: 'balance' }}
        >
            {inspirations.map((insp) => (
                <div key={insp.id} className="mb-4 break-inside-avoid">
                    <InspirationCard inspiration={insp} />
                </div>
            ))}
        </div>
    );
}
