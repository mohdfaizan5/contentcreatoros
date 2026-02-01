'use client';

import { TwitterLogo, LinkedinLogo, YoutubeLogo, Heart, ChatCircle, ArrowsClockwise, Share, ThumbsUp, ChatTeardropText, Repeat } from '@phosphor-icons/react';
import { PlaceholderRenderer } from './placeholder-renderer';
import type { PlatformType } from '@/types/database';

interface PlatformPreviewProps {
    platform: PlatformType;
    content: string;
}

/**
 * Renders a platform-specific preview of the template content
 */
export function PlatformPreview({ platform, content }: PlatformPreviewProps) {
    switch (platform) {
        case 'x':
            return <TwitterPreview content={content} />;
        case 'linkedin':
            return <LinkedInPreview content={content} />;
        case 'youtube':
            return <YouTubePreview content={content} />;
        default:
            return <GenericPreview content={content} />;
    }
}

function TwitterPreview({ content }: { content: string }) {
    return (
        <div className="rounded-2xl border bg-card overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-linear-to-br from-sky-400 to-sky-600" />
                <div className="flex-1">
                    <div className="flex items-center gap-1">
                        <span className="font-semibold text-sm">Your Name</span>
                        <svg className="h-4 w-4 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z" />
                        </svg>
                    </div>
                    <span className="text-xs text-muted-foreground">@yourhandle</span>
                </div>
                <TwitterLogo className="h-5 w-5 text-sky-500" weight="fill" />
            </div>

            {/* Content */}
            <div className="px-4 pb-3">
                <PlaceholderRenderer templateText={content} className="text-[15px] leading-relaxed" />
            </div>

            {/* Actions */}
            <div className="px-4 py-2 border-t flex items-center justify-between text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-sky-500 transition-colors">
                    <ChatCircle className="h-4 w-4" />
                    <span className="text-xs">123</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-green-500 transition-colors">
                    <ArrowsClockwise className="h-4 w-4" />
                    <span className="text-xs">456</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                    <Heart className="h-4 w-4" />
                    <span className="text-xs">789</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-sky-500 transition-colors">
                    <Share className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

function LinkedInPreview({ content }: { content: string }) {
    return (
        <div className="rounded-2xl border bg-card overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 flex items-start gap-3">
                <div className="h-12 w-12 rounded-full bg-linear-to-br from-blue-500 to-blue-700" />
                <div className="flex-1">
                    <p className="font-semibold text-sm">Your Name</p>
                    <p className="text-xs text-muted-foreground">Your headline • 1h</p>
                </div>
                <LinkedinLogo className="h-5 w-5 text-blue-600" weight="fill" />
            </div>

            {/* Content */}
            <div className="px-4 pb-3">
                <PlaceholderRenderer templateText={content} className="text-sm leading-relaxed" />
            </div>

            {/* Engagement */}
            <div className="px-4 py-2 border-t border-b text-xs text-muted-foreground">
                <span>👍 ❤️ 💡 1,234</span>
            </div>

            {/* Actions */}
            <div className="px-4 py-2 flex items-center justify-around text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-blue-600/10">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-xs font-medium">Like</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-blue-600/10">
                    <ChatTeardropText className="h-4 w-4" />
                    <span className="text-xs font-medium">Comment</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-blue-600/10">
                    <Repeat className="h-4 w-4" />
                    <span className="text-xs font-medium">Repost</span>
                </button>
            </div>
        </div>
    );
}

function YouTubePreview({ content }: { content: string }) {
    // Simple, compact YouTube title preview - no thumbnail
    return (
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                <YoutubeLogo className="h-5 w-5 text-red-500" weight="fill" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">YouTube Title</p>
                <PlaceholderRenderer templateText={content} className="font-medium text-sm" />
            </div>
        </div>
    );
}

function GenericPreview({ content }: { content: string }) {
    return (
        <div className="rounded-xl border bg-card p-4">
            <PlaceholderRenderer templateText={content} className="text-sm leading-relaxed" />
        </div>
    );
}
