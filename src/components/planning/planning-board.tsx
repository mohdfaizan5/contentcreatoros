'use client';

import { useState, useTransition } from 'react';
import { CalendarBlank, Lightbulb, Stack, ArrowRight, Funnel } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { updateIdeaStatus } from '@/actions/ideas';
import type { IdeaWithSeries, IdeaStatus, SeriesWithIdeas } from '@/types/database';

type ViewMode = 'all' | 'by-series' | 'standalone';

const statusConfig: Record<IdeaStatus, { label: string; color: string }> = {
    dumped: { label: 'Dumped', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-300' },
    refined: { label: 'Refined', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-300' },
    planned: { label: 'Planned', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300' },
    scripted: { label: 'Scripted', color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-300' },
};

const statusOrder: IdeaStatus[] = ['dumped', 'refined', 'planned', 'scripted'];

interface PlanningItemProps {
    idea: IdeaWithSeries;
}

function PlanningItem({ idea }: PlanningItemProps) {
    const [isPending, startTransition] = useTransition();
    const status = statusConfig[idea.status];
    const currentIndex = statusOrder.indexOf(idea.status);
    const nextStatus = currentIndex < statusOrder.length - 1 ? statusOrder[currentIndex + 1] : null;

    const handleAdvance = () => {
        if (!nextStatus) return;
        startTransition(async () => {
            await updateIdeaStatus(idea.id, nextStatus);
        });
    };

    return (
        <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-sm transition-all">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    {idea.idea_type === 'series_concept' ? (
                        <Stack className="h-4 w-4 text-green-500 shrink-0" weight="fill" />
                    ) : (
                        <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" weight="duotone" />
                    )}
                    <span className="font-medium truncate">{idea.title}</span>
                </div>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${status.color}`}>
                        {status.label}
                    </span>
                    {idea.series && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            {idea.series.name}
                        </span>
                    )}
                    {idea.target_platform && (
                        <span className="text-xs text-muted-foreground">{idea.target_platform}</span>
                    )}
                </div>
            </div>

            {nextStatus && (
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAdvance}
                    disabled={isPending}
                >
                    {statusConfig[nextStatus].label}
                    <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
            )}
        </div>
    );
}

interface PlanningBoardProps {
    ideas: IdeaWithSeries[];
    seriesList: SeriesWithIdeas[];
}

export function PlanningBoard({ ideas, seriesList }: PlanningBoardProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('all');

    const filteredIdeas = ideas.filter(idea => {
        if (viewMode === 'standalone') return !idea.linked_series_id;
        return true;
    });

    const groupedBySeries = seriesList.map(series => ({
        series,
        ideas: ideas.filter(idea => idea.linked_series_id === series.id),
    })).filter(group => group.ideas.length > 0);

    const standaloneIdeas = ideas.filter(idea => !idea.linked_series_id);

    // Status counts
    const dumpedCount = ideas.filter(i => i.status === 'dumped').length;
    const refinedCount = ideas.filter(i => i.status === 'refined').length;
    const plannedCount = ideas.filter(i => i.status === 'planned').length;
    const scriptedCount = ideas.filter(i => i.status === 'scripted').length;

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="animate-fade-in-up flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                        <CalendarBlank className="h-5 w-5 text-cyan-500" weight="duotone" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Content Planning</h1>
                        <p className="text-muted-foreground text-sm">
                            Move ideas through your pipeline
                        </p>
                    </div>
                </div>
            </div>

            {/* Pipeline Status */}
            {ideas.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-xl bg-gray-500/5 border border-gray-500/10 p-3 text-center transition-all hover:border-gray-400/30">
                        <div className="text-xl font-bold text-gray-600 dark:text-gray-400">{dumpedCount}</div>
                        <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            Dumped
                        </div>
                    </div>
                    <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-3 text-center transition-all hover:border-blue-400/30">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{refinedCount}</div>
                        <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            Refined
                        </div>
                    </div>
                    <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3 text-center transition-all hover:border-amber-400/30">
                        <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{plannedCount}</div>
                        <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            Planned
                        </div>
                    </div>
                    <div className="rounded-xl bg-green-500/5 border border-green-500/10 p-3 text-center transition-all hover:border-green-400/30">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">{scriptedCount}</div>
                        <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            Scripted
                        </div>
                    </div>
                </div>
            )}

            {/* View Mode Filter */}
            <div className="flex items-center gap-3">
                <Funnel className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
                    {(['all', 'by-series', 'standalone'] as ViewMode[]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === mode
                                ? 'bg-background shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {mode === 'all' ? 'All Content' : mode === 'by-series' ? 'By Series' : 'Standalone'}
                        </button>
                    ))}
                </div>
            </div>

            {viewMode === 'by-series' ? (
                <div className="space-y-8">
                    {groupedBySeries.map(({ series, ideas: seriesIdeas }) => (
                        <div key={series.id}>
                            <div className="flex items-center gap-2 mb-3">
                                <Stack className="h-5 w-5 text-green-500" weight="fill" />
                                <h2 className="font-semibold">{series.name}</h2>
                                <span className="text-xs text-muted-foreground">
                                    ({seriesIdeas.length} items)
                                </span>
                            </div>
                            <div className="space-y-2">
                                {seriesIdeas.map(idea => (
                                    <PlanningItem key={idea.id} idea={idea} />
                                ))}
                            </div>
                        </div>
                    ))}

                    {standaloneIdeas.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Lightbulb className="h-5 w-5 text-amber-500" weight="duotone" />
                                <h2 className="font-semibold">Standalone Ideas</h2>
                                <span className="text-xs text-muted-foreground">
                                    ({standaloneIdeas.length} items)
                                </span>
                            </div>
                            <div className="space-y-2">
                                {standaloneIdeas.map(idea => (
                                    <PlanningItem key={idea.id} idea={idea} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    {(viewMode === 'standalone' ? standaloneIdeas : filteredIdeas).map(idea => (
                        <PlanningItem key={idea.id} idea={idea} />
                    ))}

                    {filteredIdeas.length === 0 && (
                        <div className="text-center py-12 rounded-xl border border-dashed">
                            <CalendarBlank className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="font-medium text-muted-foreground">No ideas to plan</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Start by dumping ideas in the Ideas section
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
