/**
 * Add Column Button component
 * Allows users to create new workflow columns
 */

'use client';

import { useState, useTransition } from 'react';
import { Plus, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { updateUserWorkflow } from '@/actions/planning';
import type { UserWorkflow } from '@/types/planning';

interface AddColumnButtonProps {
    workflow: UserWorkflow;
    onColumnAdded: () => void;
}

export default function AddColumnButton({ workflow, onColumnAdded }: AddColumnButtonProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [columnName, setColumnName] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!columnName.trim()) return;

        startTransition(async () => {
            try {
                await updateUserWorkflow({
                    columns: [...workflow.columns, columnName.trim()],
                });
                setColumnName('');
                setIsAdding(false);
                onColumnAdded();
            } catch (error) {
                console.error('Failed to add column:', error);
            }
        });
    };

    if (isAdding) {
        return (
            <div className="flex-shrink-0 w-72 rounded-2xl p-3 bg-muted/30 border-2 border-double border-primary/20">
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                        type="text"
                        value={columnName}
                        onChange={(e) => setColumnName(e.target.value)}
                        placeholder="Column name..."
                        autoFocus
                        className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <div className="flex gap-2">
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!columnName.trim() || isPending}
                            className="flex-1"
                        >
                            {isPending ? 'Adding...' : 'Add Column'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setIsAdding(false);
                                setColumnName('');
                            }}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <button
            onClick={() => setIsAdding(true)}
            className="flex-shrink-0 w-72 min-h-[200px] rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
        >
            <Plus className="w-6 h-6" weight="bold" />
            <span className="text-sm font-medium">Create Column</span>
        </button>
    );
}
