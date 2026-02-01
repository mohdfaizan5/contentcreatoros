'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Sparkle, TwitterLogo, LinkedinLogo, YoutubeLogo, InstagramLogo, Link as LinkIcon, User, Article } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { InspirationMasonryGrid } from './inspiration-components';
import { detectUrlInfo, getPlatformColors, type Platform } from '@/lib/url-detector';
import type { Inspiration } from '@/types/database';

const platformIcons: Record<Platform, React.ElementType> = {
    x: TwitterLogo,
    linkedin: LinkedinLogo,
    youtube: YoutubeLogo,
    instagram: InstagramLogo,
    link: LinkIcon,
};

interface InspirationClientProps {
    inspirations: Inspiration[];
}

export function InspirationClient({ inspirations }: InspirationClientProps) {
    const [filter, setFilter] = useState<Platform | 'all'>('all');

    // Calculate platform counts
    const platformStats = useMemo(() => {
        const stats: Record<Platform, number> = {
            x: 0,
            linkedin: 0,
            youtube: 0,
            instagram: 0,
            link: 0,
        };

        inspirations.forEach((insp) => {
            const info = detectUrlInfo(insp.url);
            stats[info.platform]++;
        });

        return stats;
    }, [inspirations]);

    // Filter inspirations
    const filteredInspirations = useMemo(() => {
        if (filter === 'all') return inspirations;

        return inspirations.filter((insp) => {
            const info = detectUrlInfo(insp.url);
            return info.platform === filter;
        });
    }, [inspirations, filter]);

    // Non-zero platforms for filter pills
    const activePlatforms = Object.entries(platformStats)
        .filter(([, count]) => count > 0) as [Platform, number][];

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="animate-fade-in-up flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Sparkle className="h-5 w-5 text-purple-500" weight="duotone" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Inspiration</h1>
                        <p className="text-muted-foreground text-sm">
                            Collect content that sparks your creativity
                        </p>
                    </div>
                </div>
                <Link href="/app/inspiration/create">
                    <Button className="gap-2 rounded-xl transition-all duration-200 hover:scale-105">
                        <Plus className="h-4 w-4" weight="bold" />
                        Add Inspiration
                    </Button>
                </Link>
            </div>

            {/* Filter pills */}
            {inspirations.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    {/* All filter */}
                    <button
                        onClick={() => setFilter('all')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${filter === 'all'
                                ? 'bg-purple-500/10 text-purple-600 ring-1 ring-purple-500/30'
                                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                            }`}
                    >
                        <Sparkle className="h-4 w-4" weight={filter === 'all' ? 'fill' : 'regular'} />
                        <span className="font-medium">{inspirations.length}</span>
                        <span>all</span>
                    </button>

                    {/* Platform filters */}
                    {activePlatforms.map(([platform, count]) => {
                        const Icon = platformIcons[platform];
                        const colors = getPlatformColors(platform);
                        const isActive = filter === platform;

                        return (
                            <button
                                key={platform}
                                onClick={() => setFilter(platform)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${isActive
                                        ? `${colors.bg} ${colors.text} ring-1 ${colors.border}`
                                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                    }`}
                            >
                                <Icon className="h-4 w-4" weight={isActive ? 'fill' : 'regular'} />
                                <span className="font-medium">{count}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Masonry Grid */}
            <InspirationMasonryGrid inspirations={filteredInspirations} />
        </div>
    );
}
