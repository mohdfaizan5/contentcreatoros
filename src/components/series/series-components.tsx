'use client';

import { useState, useTransition } from 'react';
import { Stack, Plus, Trash, ArrowsClockwise } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { createSeries, deleteSeries } from '@/actions/series';
import type { SeriesWithIdeas, IdeaStatus } from '@/types/database';

interface SeriesFormProps {
    onClose?: () => void;
}

export function SeriesForm({ onClose }: SeriesFormProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [platform, setPlatform] = useState('');
    const [totalItems, setTotalItems] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleSubmit = () => {
        if (!name.trim()) return;
        startTransition(async () => {
            await createSeries({
                name: name.trim(),
                description: description.trim() || null,
                target_platform: platform.trim() || null,
                total_planned_items: parseInt(totalItems) || 0,
            });
            onClose?.();
        });
    };

    return (
        <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
                <Stack className="h-5 w-5 text-green-500" weight="duotone" />
                <h2 className="font-semibold">Create Series</h2>
            </div>

            <input
                type="text"
                placeholder="Series name (e.g., 21 Startup Terms)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />

            <div className="grid grid-cols-2 gap-4">
                <input
                    type="text"
                    placeholder="Platform (e.g., X, YouTube)"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                    type="number"
                    placeholder="Total planned items"
                    value={totalItems}
                    onChange={(e) => setTotalItems(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={!name.trim() || isPending} className="flex-1">
                    {isPending ? 'Creating...' : 'Create Series'}
                </Button>
            </div>
        </div>
    );
}

interface SeriesCardProps {
    series: SeriesWithIdeas;
}

export function SeriesCard({ series }: SeriesCardProps) {
    const [isPending, startTransition] = useTransition();
    const ideas = series.ideas || [];

    const statusCounts = ideas.reduce((acc, idea) => {
        acc[idea.status] = (acc[idea.status] || 0) + 1;
        return acc;
    }, {} as Record<IdeaStatus, number>);

    const completed = statusCounts['scripted'] || 0;
    const inProgress = (statusCounts['refined'] || 0) + (statusCounts['planned'] || 0);
    const total = series.total_planned_items || ideas.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    const handleDelete = () => {
        if (!confirm('Delete this series? Ideas will be unlinked but not deleted.')) return;
        startTransition(async () => {
            await deleteSeries(series.id);
        });
    };

    return (
        <div className="group rounded-xl border bg-card p-6 transition-all hover:shadow-md hover:border-primary/30">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <h3 className="font-semibold text-lg">{series.name}</h3>
                    {series.description && (
                        <p className="text-sm text-muted-foreground mt-1">{series.description}</p>
                    )}
                    {series.target_platform && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground mt-2">
                            {series.target_platform}
                        </span>
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

            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{completed} / {total}</span>
                </div>

                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>✓ {completed} completed</span>
                    <span>◐ {inProgress} in progress</span>
                    <span>○ {total - completed - inProgress} remaining</span>
                </div>
            </div>
        </div>
    );
}

interface SeriesListProps {
    seriesList: SeriesWithIdeas[];
}

export function SeriesList({ seriesList }: SeriesListProps) {
    if (seriesList.length === 0) {
        return (
            <div className="text-center py-12 rounded-xl border border-dashed">
                <Stack className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">No series yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Create a series to think in systems, not random posts
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {seriesList.map((s) => (
                <SeriesCard key={s.id} series={s} />
            ))}
        </div>
    );
}

// Masonry grid layout
export function SeriesMasonryGrid({ seriesList }: SeriesListProps) {
    if (seriesList.length === 0) {
        return (
            <div className="text-center py-16 rounded-2xl border border-dashed bg-muted/20">
                <Stack className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" weight="duotone" />
                <h3 className="font-semibold text-muted-foreground">No series yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                    Create a series to think in systems, not random posts
                </p>
            </div>
        );
    }

    return (
        <div
            className="columns-1 md:columns-2 lg:columns-3 gap-4"
            style={{ columnFill: 'balance' }}
        >
            {seriesList.map((s) => (
                <div key={s.id} className="mb-4 break-inside-avoid">
                    <SeriesCard series={s} />
                </div>
            ))}
        </div>
    );
}
