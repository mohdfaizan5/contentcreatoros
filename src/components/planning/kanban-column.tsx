/**
 * Kanban Column component
 * Represents a single workflow stage with droppable area
 */

'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'motion/react';
import ContentCard from './content-card';
import type { ContentCardWithRelations } from '@/types/planning';

import {
    Lightbulb,
    Scroll,
    VideoCamera,
    Microphone,
    Scissors,
    CalendarCheck,
    RocketLaunch,
    CheckCircle,
    PencilSimple,
    FilmStrip,
    Eye
} from '@phosphor-icons/react';

interface KanbanColumnProps {
    column: string;
    cards: ContentCardWithRelations[];
    onCardUpdate: () => void;
    onEdit: (card: ContentCardWithRelations) => void;
}

const getColumnIcon = (name: string) => {
    const lowerName = name.toLowerCase();

    // Idea / Brainstorming
    if (lowerName.includes('idea') || lowerName.includes('brainstorm') || lowerName.includes('concept')) {
        return <Lightbulb className="w-5 h-5 text-muted mt-1" weight="duotone" />;
    }

    // Scripting / Writing
    if (lowerName.includes('script') || lowerName.includes('writ') || lowerName.includes('draft')) {
        return <Scroll className="w-5 h-5 text-muted" weight="duotone" />;
    }

    // Filming / Recording
    if (lowerName.includes('record') || lowerName.includes('film') || lowerName.includes('shoot')) {
        return <VideoCamera className="w-5 h-5 text-muted" weight="duotone" />;
    }

    // Audio Editing
    if (lowerName.includes('audio') || lowerName.includes('sound') || lowerName.includes('voice')) {
        return <Microphone className="w-5 h-5 text-muted" weight="duotone" />;
    }

    // Video Editing / Post Production
    if (lowerName.includes('edit') || lowerName.includes('cut') || lowerName.includes('production')) {
        return <Scissors className="w-5 h-5 text-muted" weight="duotone" />;
    }

    // Review
    if (lowerName.includes('review') || lowerName.includes('check') || lowerName.includes('approval')) {
        return <Eye className="w-5 h-5 text-muted" weight="duotone" />;
    }

    // Scheduling
    if (lowerName.includes('schedule') || lowerName.includes('plan')) {
        return <CalendarCheck className="w-5 h-5 text-muted" weight="duotone" />;
    }

    // Published / Done
    if (lowerName.includes('post') || lowerName.includes('publish') || lowerName.includes('live')) {
        return <RocketLaunch className="w-5 h-5 text-green-500" weight="duotone" />;
    }

    if (lowerName.includes('done') || lowerName.includes('complete')) {
        return <CheckCircle className="w-5 h-5 text-emerald-500" weight="duotone" />;
    }

    return null;
};

export default function KanbanColumn({ column, cards, onCardUpdate, onEdit }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: column,
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`!text-[#cecfd2] w-72  h-full rounded-2xl p-3 flex flex-col transition-colors ${isOver ? 'bg-primary/5 ring-2 ring-primary/20' : 'bg-[#101204] border'
                }`}
        >
            {/* Column Header */}
            <div className="mb-3 px-1 flex items- gap-2">
                {getColumnIcon(column)}
                <div>
                    <h3 className="font-semibold text-base">{column}</h3>
                    <p className="text-xs text-muted-foreground">
                        {cards.length} {cards.length === 1 ? 'item' : 'items'}
                    </p>
                </div>
            </div>

            {/* Cards - Droppable area */}
            <div
                ref={setNodeRef}
                className="min-h-[80px] space-y-2"
            >
                <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {cards.length === 0 ? (
                        <div className={`text-center text-muted-foreground text-sm py-8 rounded-xl border-2 border-dashed transition-colors ${isOver ? 'border-primary/30 bg-primary/5' : 'border-transparent'
                            }`}>
                            Drop cards here
                        </div>
                    ) : (
                        cards.map((card) => (
                            <ContentCard
                                key={card.id}
                                card={card}
                                onUpdate={onCardUpdate}
                                onEdit={onEdit}
                            />
                        ))
                    )}
                </SortableContext>
            </div>
        </motion.div>
    );
}
