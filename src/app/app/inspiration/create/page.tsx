'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tweet } from 'react-tweet';
import { ArrowLeft, Sparkle, Link as LinkIcon, User, SpinnerGap, TwitterLogo, LinkedinLogo, YoutubeLogo, InstagramLogo } from '@phosphor-icons/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import { createInspiration } from '@/actions/inspiration';
import { detectUrlInfo, extractTweetId, getPlatformColors, getPlatformLabel } from '@/lib/url-detector';
import type { InspirationType } from '@/types/database';

const platformIcons = {
    x: TwitterLogo,
    linkedin: LinkedinLogo,
    youtube: YoutubeLogo,
    instagram: InstagramLogo,
    link: LinkIcon,
};

export default function CreateInspirationPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [url, setUrl] = useState('');
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');

    // Auto-detected info
    const urlInfo = url.trim() ? detectUrlInfo(url) : null;
    const tweetId = urlInfo?.platform === 'x' && urlInfo.isPost ? extractTweetId(url) : null;
    const colors = urlInfo ? getPlatformColors(urlInfo.platform) : null;
    const PlatformIcon = urlInfo ? platformIcons[urlInfo.platform] : null;

    // Auto-set type based on detection
    const detectedType: InspirationType = urlInfo?.isProfile ? 'creator' : 'content';

    const handleSubmit = () => {
        if (!url.trim()) return;

        startTransition(async () => {
            try {
                await createInspiration({
                    url: url.trim(),
                    type: detectedType,
                    title: title.trim() || null,
                    notes: notes.trim() || null,
                    what_worked: null,
                });
                router.push('/app/inspiration');
            } catch (error) {
                console.error('Failed to save inspiration:', error);
            }
        });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
            {/* Back navigation */}
            <Link
                href="/app/inspiration"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Inspiration
            </Link>

            {/* URL Input */}
            <div className="space-y-2">
                <input
                    type="url"
                    placeholder="Paste URL here..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-4 py-4 rounded-2xl border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-lg transition-all"
                />

                {/* Auto-detected badge */}
                {urlInfo && colors && PlatformIcon && (
                    <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${colors.bg} ${colors.text} text-sm`}>
                            <PlatformIcon className="h-4 w-4" weight="fill" />
                            <span className="font-medium">{getPlatformLabel(urlInfo.platform)}</span>
                            <span className="text-muted-foreground">•</span>
                            <span>{urlInfo.isProfile ? 'Profile' : 'Post'}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Tweet Preview for X posts */}
            {tweetId && (
                <div className="rounded-2xl border bg-card overflow-hidden">
                    <div className="flex justify-center py-4 [&>div]:my-0!">
                        <Tweet id={tweetId} />
                    </div>
                </div>
            )}

            {/* Optional fields */}
            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="Title (optional) — describe what this is"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />

                <AutoResizeTextarea
                    placeholder="Notes — Why is this inspiring? What worked? (hook, framing, angle...)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    minRows={3}
                    maxRows={10}
                    className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleSubmit}
                    disabled={isPending || !url.trim()}
                    className="gap-2 px-6"
                >
                    {isPending ? (
                        <>
                            <SpinnerGap className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Inspiration'
                    )}
                </Button>
            </div>
        </div>
    );
}
