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
                        <Stack className="h-4 w-4 text-green-500 flex-shrink-0" weight="fill" />
                    ) : (
                        <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0" weight="duotone" />
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Content Planning</h1>
                    <p className="text-muted-foreground">
                        Move ideas through your pipeline: Dumped → Refined → Planned → Scripted
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Funnel className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                    {(['all', 'by-series', 'standalone'] as ViewMode[]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === mode
                                    ? 'bg-background shadow-sm'
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
