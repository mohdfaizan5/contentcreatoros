/**
 * Workflow preset card for onboarding
 * Displays a clickable preset workflow option with columns preview
 */

'use client';

import { motion } from 'motion/react';
import { Check, Plus } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

interface WorkflowCardProps {
    name: string;
    description: string;
    columns: string[];
    isSelected: boolean;
    onClick: () => void;
    className?: string;
}

export default function WorkflowCard({ name, description, columns, isSelected, onClick, className }: WorkflowCardProps) {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            className={cn(`relative bg-card p-6 rounded-2xl border-2 transition-all text-left w-full ${isSelected
                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }`, className)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Selected indicator */}
            {isSelected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                >
                    <Check weight="bold" className="w-4 h-4" />
                </motion.div>
            )}
            {name === "Basic Creator" && (
                <Badge className='absolute -top-2 -right-2 z-50 rotate-3 animate-pulse' variant="default">Recommended</Badge>
            )}
            {/* Name & Description */}
            <div className="mb-4">
                <h3 className="text-lg font-semibold mb-1">{name}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            {/* Columns preview */}
            <div className="flex gap-2 flex-wrap">
                {columns.map((column, index) => (
                    <Badge
                        key={index}
                        className="text-xs  font-medium flex items-center gap-1"
                        variant={"secondary"}
                    >
                        {index > 0 && <span className="text-muted-foreground">→</span>}
                        {column}
                    </Badge>
                ))}
            </div>
        </motion.button>
    );
}
