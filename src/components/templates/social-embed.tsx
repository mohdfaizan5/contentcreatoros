'use client';

import { useEffect, useRef, useState } from 'react';
import { TwitterLogo, LinkedinLogo, InstagramLogo, Link as LinkIcon, ArrowSquareOut } from '@phosphor-icons/react';
import type { TemplateReference, EmbedType } from '@/types/database';
import { extractTweetId } from '@/lib/template-utils';

const embedConfig: Record<EmbedType, { icon: React.ElementType; color: string; label: string }> = {
    x: { icon: TwitterLogo, color: 'text-sky-500 bg-sky-500/10 border-sky-500/20', label: 'X Post' },
    instagram: { icon: InstagramLogo, color: 'text-pink-500 bg-pink-500/10 border-pink-500/20', label: 'Instagram' },
    linkedin: { icon: LinkedinLogo, color: 'text-blue-600 bg-blue-600/10 border-blue-600/20', label: 'LinkedIn' },
    link: { icon: LinkIcon, color: 'text-gray-500 bg-gray-500/10 border-gray-500/20', label: 'Link' },
};

interface SocialEmbedProps {
    reference: TemplateReference;
    onDelete?: () => void;
}

/**
 * Renders a social media embed or link card
 */
export function SocialEmbed({ reference, onDelete }: SocialEmbedProps) {
    const config = embedConfig[reference.embed_type];
    const Icon = config.icon;

    // For X embeds, try to render the actual embed
    if (reference.embed_type === 'x') {
        return <TwitterEmbed reference={reference} />;
    }

    // For other types, show a link card
    return (
        <a
            href={reference.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md ${config.color}`}
        >
            <div className="shrink-0">
                <Icon className="h-6 w-6" weight="fill" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                    {reference.title || 'View on ' + config.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">{reference.url}</p>
            </div>
            <ArrowSquareOut className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
    );
}

interface TwitterEmbedProps {
    reference: TemplateReference;
}

/**
 * Renders an embedded X/Twitter post
 * Uses the Twitter widgets.js for proper embedding
 */
function TwitterEmbed({ reference }: TwitterEmbedProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const tweetId = extractTweetId(reference.url);

    useEffect(() => {
        if (!tweetId || !containerRef.current) {
            setError(true);
            setIsLoading(false);
            return;
        }

        // Load Twitter widgets.js if not already loaded
        const loadTwitterWidget = async () => {
            try {
                // Check if twttr is already available
                if ((window as any).twttr) {
                    await (window as any).twttr.widgets.createTweet(
                        tweetId,
                        containerRef.current,
                        { conversation: 'none', cards: 'hidden' }
                    );
                    setIsLoading(false);
                } else {
                    // Load the script
                    const script = document.createElement('script');
                    script.src = 'https://platform.twitter.com/widgets.js';
                    script.async = true;
                    script.onload = async () => {
                        if ((window as any).twttr && containerRef.current) {
                            await (window as any).twttr.widgets.createTweet(
                                tweetId,
                                containerRef.current,
                                { conversation: 'none', cards: 'hidden' }
                            );
                        }
                        setIsLoading(false);
                    };
                    script.onerror = () => {
                        setError(true);
                        setIsLoading(false);
                    };
                    document.body.appendChild(script);
                }
            } catch (e) {
                setError(true);
                setIsLoading(false);
            }
        };

        loadTwitterWidget();
    }, [tweetId]);

    if (error || !tweetId) {
        // Fallback to link card
        return (
            <a
                href={reference.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-4 rounded-xl border border-sky-500/20 bg-sky-500/5 transition-all hover:shadow-md"
            >
                <TwitterLogo className="h-6 w-6 text-sky-500" weight="fill" />
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                        {reference.title || 'View post on X'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{reference.url}</p>
                </div>
                <ArrowSquareOut className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
        );
    }

    return (
        <div className="rounded-xl overflow-hidden border bg-card">
            {isLoading && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
            )}
            <div ref={containerRef} className={isLoading ? 'hidden' : ''} />
        </div>
    );
}

interface ReferencesListProps {
    references: TemplateReference[];
}

/**
 * List of social embeds and reference links
 */
export function ReferencesList({ references }: ReferencesListProps) {
    if (references.length === 0) {
        return (
            <div className="text-center py-8 rounded-xl border border-dashed">
                <p className="text-muted-foreground text-sm">No references yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add links to posts that use this template style</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {references.map((reference) => (
                <SocialEmbed key={reference.id} reference={reference} />
            ))}
        </div>
    );
}
