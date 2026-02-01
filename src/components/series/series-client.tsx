'use client';

import Link from 'next/link';
import { Plus, Stack } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { SeriesMasonryGrid } from './series-components';
import type { SeriesWithIdeas } from '@/types/database';

interface SeriesClientProps {
    seriesList: SeriesWithIdeas[];
}

export function SeriesClient({ seriesList }: SeriesClientProps) {
    // Calculate stats
    const totalIdeas = seriesList.reduce((acc, s) => acc + (s.ideas?.length || 0), 0);
    const completedSeries = seriesList.filter(s => {
        const ideas = s.ideas || [];
        return ideas.length > 0 && ideas.every(i => i.status === 'scripted');
    }).length;

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="animate-fade-in-up flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <Stack className="h-5 w-5 text-green-500" weight="duotone" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Series</h1>
                        <p className="text-muted-foreground text-sm">
                            Think in systems, not random posts
                        </p>
                    </div>
                </div>
                <Link href="/app/series/create">
                    <Button className="gap-2 rounded-xl transition-all duration-200 hover:scale-105">
                        <Plus className="h-4 w-4" weight="bold" />
                        New Series
                    </Button>
                </Link>
            </div>

            {/* Stats pills */}
            {seriesList.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-sm text-green-600">
                        <Stack className="h-4 w-4" weight="fill" />
                        <span className="font-medium">{seriesList.length}</span>
                        <span className="text-muted-foreground">series</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-sm text-blue-600">
                        <span className="font-medium">{totalIdeas}</span>
                        <span className="text-muted-foreground">linked ideas</span>
                    </div>
                    {completedSeries > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-sm text-amber-600">
                            <span className="font-medium">{completedSeries}</span>
                            <span className="text-muted-foreground">completed</span>
                        </div>
                    )}
                </div>
            )}

            {/* Masonry Grid */}
            <SeriesMasonryGrid seriesList={seriesList} />
        </div>
    );
}
