/**
 * Main Kanban Board component
 * Renders columns based on user workflow and handles drag-and-drop
 */

'use client';

import { useEffect, useState, useTransition } from 'react';
import { Plus } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanColumn from './kanban-column';
import ContentCard from './content-card';
import CreateContentDialog from './create-content-dialog';
import AddColumnButton from './add-column-button';
import EditContentDialog from './edit-content-dialog';
import { getContentCards, moveCardToColumn } from '@/actions/planning';
import type { UserWorkflow, ContentCardWithRelations } from '@/types/planning';

interface KanbanBoardProps {
    workflow: UserWorkflow;
    onWorkflowUpdate: () => void;
}

export default function KanbanBoard({ workflow, onWorkflowUpdate }: KanbanBoardProps) {
    const [cards, setCards] = useState<ContentCardWithRelations[]>([]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // Edit Dialog State
    const [editingCard, setEditingCard] = useState<ContentCardWithRelations | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [activeCard, setActiveCard] = useState<ContentCardWithRelations | null>(null);
    const [isPending, startTransition] = useTransition();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor)
    );

    useEffect(() => {
        loadCards();
    }, []);

    const loadCards = async () => {
        try {
            const data = await getContentCards();
            setCards(data);
        } catch (error) {
            console.error('Failed to load cards:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Group cards by column
    const cardsByColumn = workflow.columns.reduce((acc, column) => {
        acc[column] = cards.filter(c => c.column_id === column).sort((a, b) => a.order - b.order);
        return acc;
    }, {} as Record<string, ContentCardWithRelations[]>);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const card = cards.find(c => c.id === active.id);
        if (card) {
            setActiveCard(card);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveCard(null);

        if (!over) return;

        const activeCardId = active.id as string;
        const overId = over.id as string;

        // Find which column the card was dropped on
        const targetColumn = workflow.columns.find(col => col === overId) ||
            cards.find(c => c.id === overId)?.column_id;

        if (!targetColumn) return;

        const sourceCard = cards.find(c => c.id === activeCardId);
        if (!sourceCard) return;

        // If dropped on same column, no need to update
        if (sourceCard.column_id === targetColumn && activeCardId === overId) return;

        // Calculate new order
        const targetColumnCards = cardsByColumn[targetColumn] || [];
        const newOrder = targetColumnCards.length;

        // Optimistically update UI
        setCards(prevCards =>
            prevCards.map(card =>
                card.id === activeCardId
                    ? { ...card, column_id: targetColumn, order: newOrder }
                    : card
            )
        );

        // Update in database
        startTransition(async () => {
            try {
                await moveCardToColumn(activeCardId, targetColumn, newOrder);
                loadCards(); // Refresh to get correct order
            } catch (error) {
                console.error('Failed to move card:', error);
                loadCards(); // Revert on error
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6  max-w-312">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Content Planning</h1>
                    <p className="text-muted-foreground mt-1">
                        Track your content through the workflow
                    </p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
                    <Plus className="w-5 h-5 mr-2" weight="bold" />
                    Create Content
                </Button>
            </div>

            {/* Kanban Columns - Horizontal scroll */}
            <div className="h-[75vh] min-h-[500px]">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="overflow-x-auto h-full pb-4 -mx-6 px-6">
                        <div className="flex gap-3 min-w-max h-full">
                            {workflow.columns.map((column) => (
                                <KanbanColumn
                                    key={column}
                                    column={column}
                                    cards={cardsByColumn[column] || []}
                                    onCardUpdate={loadCards}
                                    onEdit={(card) => {
                                        setEditingCard(card);
                                        setIsEditDialogOpen(true);
                                    }}
                                />
                            ))}

                            {/* Add Column Button */}
                            <AddColumnButton
                                workflow={workflow}
                                onColumnAdded={onWorkflowUpdate}
                            />
                        </div>
                    </div>

                    {/* Drag Overlay */}
                    <DragOverlay className=''>
                        {activeCard ? (
                            <div className="opacity-90 rotate-2">
                                <ContentCard
                                    card={activeCard}
                                    onUpdate={() => { }}
                                    onEdit={() => { }} // No-op for drag overlay
                                    isDragging
                                />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Create Content Dialog */}
            <CreateContentDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSuccess={loadCards}
                initialColumn={workflow.columns[0]}
            />

            {/* Edit Content Dialog */}
            {editingCard && (
                <EditContentDialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    card={editingCard}
                    onSuccess={loadCards}
                />
            )}
        </div>
    );
}
