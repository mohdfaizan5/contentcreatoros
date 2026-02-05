/**
 * Simplified Idea Card Component
 * Displays idea title with click to open detail page
 */

'use client';

import Link from 'next/link';
import { Lightbulb } from '@phosphor-icons/react';
import type { Idea } from '@/types/database';
import { Coolshape } from "coolshapes-react"

interface IdeaCardProps {
    idea: Idea;
}

export function IdeaCard({ idea }: IdeaCardProps) {
    return (
        <Link href={`/app/ideas/${idea.id}`}>
            <div className="group relative rounded-xl overflow-hidden  bg-card p-4 transition-all duration-300 hover:shadow-md hover:border-primary/30 border cursor-pointer">
                <Coolshape type={"flower"} random index={1} className='absolute opacity-20 -bottom-5 -right-5 size-20' />
                <div className="flex items-start gap-3 relative ">
                    {/* <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 transition-transform duration-300 group-hover:scale-110 shrink-0">
                        <Lightbulb className="h-4 w-4 text-amber-500" weight="duotone" />
                    </div> */}

                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-base truncate">{idea.title}</h3>
                        {idea.raw_text && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {idea.raw_text}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

interface IdeasListProps {
    ideas: Idea[];
}

export function IdeasList({ ideas }: IdeasListProps) {
    if (ideas.length === 0) {
        return (
            <div className="empty-state text-center py-16 rounded-2xl border border-dashed bg-card/50 transition-all hover:bg-card">
                <Lightbulb className="empty-state-icon h-16 w-16 mx-auto text-amber-500 mb-4" />
                <h3 className="font-semibold text-lg text-foreground">No ideas yet</h3>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
                    Start by creating your first idea using the button above.
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
