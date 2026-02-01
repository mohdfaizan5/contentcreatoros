'use client';

import { useState, useTransition } from 'react';
import { Lightbulb, Stack, Trash, ArrowRight, SpinnerGap } from '@phosphor-icons/react';
import type { IdeaWithSeries, IdeaStatus } from '@/types/database';
import { deleteIdea, updateIdeaStatus } from '@/actions/ideas';
import { Button } from '@/components/ui/button';

const statusConfig: Record<IdeaStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
    dumped: {
        label: 'Dumped',
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-l-gray-400'
    },
    refined: {
        label: 'Refined',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-l-blue-500'
    },
    planned: {
        label: 'Planned',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-l-amber-500'
    },
    scripted: {
        label: 'Scripted',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-l-green-500'
    },
};

const statusOrder: IdeaStatus[] = ['dumped', 'refined', 'planned', 'scripted'];

interface IdeaCardProps {
    idea: IdeaWithSeries;
}

export function IdeaCard({ idea }: IdeaCardProps) {
    const [isPending, startTransition] = useTransition();
    const [isHovered, setIsHovered] = useState(false);

    const status = statusConfig[idea.status];
    const currentStatusIndex = statusOrder.indexOf(idea.status);
    const nextStatus = currentStatusIndex < statusOrder.length - 1
        ? statusOrder[currentStatusIndex + 1]
        : null;

    const handleDelete = () => {
        if (!confirm('Are you sure you want to delete this idea?')) return;
        startTransition(async () => {
            await deleteIdea(idea.id);
        });
    };

    const handleAdvanceStatus = () => {
        if (!nextStatus) return;
        startTransition(async () => {
            await updateIdeaStatus(idea.id, nextStatus);
        });
    };

    return (
        <div
            className={`group relative rounded-xl border-l-4 ${status.borderColor} bg-card p-4 transition-all duration-300 card-hover-lift hover:border-primary/30 border ${isHovered ? 'shadow-md' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${idea.idea_type === 'series_concept' ? 'bg-green-500/10' : 'bg-amber-500/10'} transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}>
                            {idea.idea_type === 'series_concept' ? (
                                <Stack className="h-4 w-4 text-green-500" weight="fill" />
                            ) : (
                                <Lightbulb className="h-4 w-4 text-amber-500" weight="duotone" />
                            )}
                        </div>
                        <h3 className="font-medium text-base truncate">{idea.title}</h3>
                    </div>

                    {idea.raw_text && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 pl-10">
                            {idea.raw_text}
                        </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap pl-10">
                        <span className={`status-badge inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${status.bgColor} ${status.color}`}>
                            {status.label}
                        </span>

                        {idea.idea_type === 'series_concept' && (
                            <span className="status-badge inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                                Series Concept
                            </span>
                        )}

                        {idea.series && (
                            <span className="status-badge inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                {idea.series.name}
                            </span>
                        )}
                    </div>
                </div>

                <div className={`flex items-center gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    {isPending ? (
                        <div className="p-2">
                            <SpinnerGap className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            {nextStatus && (
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={handleAdvanceStatus}
                                    disabled={isPending}
                                    title={`Move to ${statusConfig[nextStatus].label}`}
                                    className="hover:bg-primary/10 hover:text-primary transition-colors"
                                >
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            )}

                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={handleDelete}
                                disabled={isPending}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

interface IdeasListProps {
    ideas: IdeaWithSeries[];
}

export function IdeasList({ ideas }: IdeasListProps) {
    if (ideas.length === 0) {
        return (
            <div className="empty-state text-center py-16 rounded-2xl border border-dashed bg-card/50 transition-all hover:bg-card">
                <Lightbulb className="empty-state-icon h-16 w-16 mx-auto text-amber-500 mb-4" />
                <h3 className="font-semibold text-lg text-foreground">No ideas yet</h3>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
                    Start by dumping an idea above. No structure required — just capture the thought.
                </p>
            </div>
        );
    }

    return (
        <div
            className="columns-1 md:columns-2 lg:columns-3 gap-4"
            style={{ columnFill: 'balance' }}
        >
            {ideas.map((idea) => (
                <div key={idea.id} className="mb-4 break-inside-avoid">
                    <IdeaCard idea={idea} />
                </div>
            ))}
        </div>
    );
}
