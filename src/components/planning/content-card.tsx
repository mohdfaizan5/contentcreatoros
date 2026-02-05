/**
 * Content Card component
 * Individual card in kanban board with drag support, checkbox, platforms, and series
 */

'use client';

import { useState, useTransition } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { CheckCircle, Circle, Trash, DotsSixVertical } from '@phosphor-icons/react';
import { toggleCardChecked, deleteContentCard } from '@/actions/planning';
import type { ContentCardWithRelations } from '@/types/planning';
import { Button } from '@/components/ui/button';

interface ContentCardProps {
    card: ContentCardWithRelations;
    onUpdate: () => void;
    onEdit: (card: ContentCardWithRelations) => void;
    isDragging?: boolean;
}

export default function ContentCard({ card, onUpdate, onEdit, isDragging }: ContentCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPending, startTransition] = useTransition();

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({ id: card.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this content card?')) {
            startTransition(async () => {
                try {
                    await deleteContentCard(card.id);
                    onUpdate();
                } catch (error) {
                    console.error('Failed to delete card:', error);
                }
            });
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`group relative p-3 rounded-xl bg-[#242528] transition-all cursor-grab active:cursor-grabbing border border-transparent hover:border-primary/20 hover:shadow-sm
                ${isSortableDragging || isDragging ? 'opacity-50 shadow-lg ring-2 ring-primary/20' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onDoubleClick={(e) => {
                e.stopPropagation();
                onEdit(card);
            }}
        >
            {/* Title */}
            <div className="flex justify-between items-start gap-2 mb-2">
                <h4 className="font-medium text-sm text-[#cecfd2] line-clamp-2 leading-tight select-none">
                    {card.title}
                </h4>

                {/* Delete button (Top Right, visible on hover) */}
                {isHovered && (
                    <button
                        onClick={handleDelete}
                        disabled={isPending}
                        className="text-muted-foreground hover:text-destructive transition-colors p-0.5 -mt-1 -mr-1"
                    >
                        <Trash className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Footer: Platforms & Series */}
            <div className="flex items-center justify-between text-[10px] mt-1">
                {/* Platforms (Left) */}
                <div className="flex flex-wrap gap-1">
                    {card.platforms.slice(0, 3).map((platform) => (
                        <span
                            key={platform}
                            className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium capitalize select-none"
                        >
                            {platform}
                        </span>
                    ))}
                    {card.platforms.length > 3 && (
                        <span className="text-muted-foreground px-1 py-0.5">+ {card.platforms.length - 3}</span>
                    )}
                </div>

                {/* Series (Right) */}
                {card.series && (
                    <div className="text-muted-foreground font-medium truncate max-w-[40%] text-right select-none" title={card.series.name}>
                        {card.series.name}
                    </div>
                )}
            </div>
        </div>
    );
}
