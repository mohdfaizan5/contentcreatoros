'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tweet } from 'react-tweet';
import { ArrowLeft, Trash, Pencil, ArrowSquareOut, User, Link as LinkIcon, SpinnerGap } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { deleteInspiration } from '@/actions/inspiration';
import { detectUrlInfo, extractTweetId, getPlatformColors } from '@/lib/url-detector';
import type { Inspiration } from '@/types/database';

interface InspirationDetailProps {
    inspiration: Inspiration;
}

export function InspirationDetail({ inspiration }: InspirationDetailProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const urlInfo = detectUrlInfo(inspiration.url);
    const tweetId = urlInfo.platform === 'x' && urlInfo.isPost ? extractTweetId(inspiration.url) : null;
    const colors = getPlatformColors(urlInfo.platform);

    const handleDelete = () => {
        if (!confirm('Delete this inspiration?')) return;
        startTransition(async () => {
            await deleteInspiration(inspiration.id);
            router.push('/app/inspiration');
        });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
            {/* Back navigation */}
            <Link
                href="/app/inspiration"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Inspiration
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                        {urlInfo.isProfile ? (
                            <User className={`h-5 w-5 ${colors.text}`} weight="fill" />
                        ) : (
                            <LinkIcon className={`h-5 w-5 ${colors.text}`} weight="duotone" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">
                            {inspiration.title || 'Untitled'}
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${colors.bg} ${colors.text}`}>
                                {urlInfo.platform.toUpperCase()}
                            </span>
                            <span>•</span>
                            <span>{urlInfo.isProfile ? 'Profile' : 'Post'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <a
                        href={inspiration.url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button variant="outline" size="sm" className="gap-2">
                            <ArrowSquareOut className="h-4 w-4" />
                            Open
                        </Button>
                    </a>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleDelete}
                        disabled={isPending}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        {isPending ? (
                            <SpinnerGap className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Tweet Embed for X posts */}
            {tweetId && (
                <div className="rounded-2xl border bg-card overflow-hidden">
                    <div className="flex justify-center py-4 [&>div]:my-0!">
                        <Tweet id={tweetId} />
                    </div>
                </div>
            )}

            {/* URL for non-embeddable content */}
            {!tweetId && (
                <a
                    href={inspiration.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-2xl border bg-card p-6 hover:border-primary/30 transition-colors"
                >
                    <p className="text-primary hover:underline break-all">{inspiration.url}</p>
                </a>
            )}

            {/* Notes */}
            {inspiration.notes && (
                <div className="rounded-xl border bg-card p-5">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                    <p className="text-foreground whitespace-pre-wrap">{inspiration.notes}</p>
                </div>
            )}

            {/* What Worked */}
            {inspiration.what_worked && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5">
                    <h3 className="text-sm font-medium text-green-600 mb-2">What Worked</h3>
                    <p className="text-foreground whitespace-pre-wrap">{inspiration.what_worked}</p>
                </div>
            )}

            {/* Metadata */}
            <div className="text-xs text-muted-foreground">
                Added {new Date(inspiration.created_at).toLocaleDateString()}
            </div>
        </div>
    );
}
