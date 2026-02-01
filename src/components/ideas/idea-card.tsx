'use client';

import { useState, useTransition } from 'react';
import { Lightbulb, Stack, Trash, DotsThree, PencilSimple, ArrowRight } from '@phosphor-icons/react';
import type { IdeaWithSeries, IdeaStatus } from '@/types/database';
import { deleteIdea, updateIdeaStatus } from '@/actions/ideas';
import { Button } from '@/components/ui/button';

const statusConfig: Record<IdeaStatus, { label: string; color: string }> = {
    dumped: { label: 'Dumped', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },
    refined: { label: 'Refined', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    planned: { label: 'Planned', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    scripted: { label: 'Scripted', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
};

const statusOrder: IdeaStatus[] = ['dumped', 'refined', 'planned', 'scripted'];

interface IdeaCardProps {
    idea: IdeaWithSeries;
}

export function IdeaCard({ idea }: IdeaCardProps) {
    const [isPending, startTransition] = useTransition();
    const [showActions, setShowActions] = useState(false);

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
        <div className="group relative rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        {idea.idea_type === 'series_concept' ? (
                            <Stack className="h-4 w-4 text-green-500 flex-shrink-0" weight="fill" />
                        ) : (
                            <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0" weight="duotone" />
                        )}
                        <h3 className="font-medium truncate">{idea.title}</h3>
                    </div>

                    {idea.raw_text && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {idea.raw_text}
                        </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${status.color}`}>
                            {status.label}
                        </span>

                        {idea.idea_type === 'series_concept' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                                Series Concept
                            </span>
                        )}

                        {idea.series && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                {idea.series.name}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {nextStatus && (
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={handleAdvanceStatus}
                            disabled={isPending}
                            title={`Move to ${statusConfig[nextStatus].label}`}
                        >
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleDelete}
                        disabled={isPending}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
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
            <div className="text-center py-12 rounded-xl border border-dashed">
                <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">No ideas yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Start by dumping an idea above
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-3">
            {ideas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
            ))}
        </div>
    );
}
