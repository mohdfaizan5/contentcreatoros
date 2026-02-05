/**
 * Onboarding Dialog for Content Planning
 * First-time users select their workflow columns or create custom ones
 */

'use client';

import { useState, useTransition } from 'react';
import { X, Plus, Trash } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import WorkflowCard from './workflow-card';
import { PRESET_WORKFLOWS, type PresetWorkflowKey } from '@/types/planning';
import { createUserWorkflow } from '@/actions/planning';

interface OnboardingDialogProps {
    open: boolean;
    onComplete: () => void;
}

export default function OnboardingDialog({ open, onComplete }: OnboardingDialogProps) {
    const [step, setStep] = useState<'welcome' | 'select'>('welcome');
    const [selectedPreset, setSelectedPreset] = useState<PresetWorkflowKey | 'custom' | null>(null);
    const [customColumns, setCustomColumns] = useState<string[]>(['', '', '']);
    const [isPending, startTransition] = useTransition();

    const handlePresetSelect = (preset: PresetWorkflowKey | 'custom') => {
        setSelectedPreset(preset);
    };

    const handleAddCustomColumn = () => {
        if (customColumns.length < 7) {
            setCustomColumns([...customColumns, '']);
        }
    };

    const handleRemoveCustomColumn = (index: number) => {
        if (customColumns.length > 2) {
            setCustomColumns(customColumns.filter((_, i) => i !== index));
        }
    };

    const handleCustomColumnChange = (index: number, value: string) => {
        const newColumns = [...customColumns];
        newColumns[index] = value;
        setCustomColumns(newColumns);
    };

    const handleSubmit = () => {
        let columns: string[];

        if (selectedPreset === 'custom') {
            // Filter out empty columns
            columns = customColumns.filter(col => col.trim() !== '');
            if (columns.length < 2) {
                alert('Please add at least 2 columns');
                return;
            }
        } else if (selectedPreset) {
            columns = PRESET_WORKFLOWS[selectedPreset].columns;
        } else {
            alert('Please select a workflow');
            return;
        }

        startTransition(async () => {
            try {
                await createUserWorkflow({ columns });
                onComplete();
            } catch (error) {
                console.error('Failed to create workflow:', error);
                alert('Failed to save workflow. Please try again.');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="!max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        {step === 'welcome' ? 'Welcome to Content Planning' : 'Choose Your Workflow'}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'welcome'
                            ? 'Organize your content creation with a customizable kanban board'
                            : 'Select a preset workflow or create your own custom columns'}
                    </DialogDescription>
                </DialogHeader>

                <AnimatePresence mode="wait">
                    {step === 'welcome' ? (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6 max-w-3xl"
                        >
                            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                                <h3 className="font-semibold text-lg">How it works:</h3>
                                <ul className="space-y-3 text-sm">
                                    <li className="flex items-start gap-3">
                                        <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                            1
                                        </span>
                                        <span>
                                            <strong>Capture ideas</strong> in the Ideas section and dump them quickly
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                            2
                                        </span>
                                        <span>
                                            <strong>Move to Planning</strong> and track content through your workflow stages
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                            3
                                        </span>
                                        <span>
                                            <strong>Drag & drop</strong> cards between columns as you progress
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            <Button onClick={() => setStep('select')} className="w-full" size="lg">
                                Get Started
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="select"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Preset workflows */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {Object.entries(PRESET_WORKFLOWS).map(([key, workflow]) => (
                                    <WorkflowCard
                                        key={key}
                                        className="w-full"
                                        name={workflow.name}
                                        description={workflow.description}
                                        columns={workflow.columns}
                                        isSelected={selectedPreset === key}
                                        onClick={() => handlePresetSelect(key as PresetWorkflowKey)}
                                    />
                                ))}
                            </div>

                            {/* Custom workflow option */}
                            <div className="border-t pt-6">
                                <div
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${selectedPreset === 'custom'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50'
                                        }`}
                                    onClick={() => handlePresetSelect('custom')}
                                >
                                    <h3 className="font-semibold mb-2">Custom Workflow</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Create your own column names
                                    </p>

                                    {selectedPreset === 'custom' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-3"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {customColumns.map((column, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <Input
                                                        placeholder={
                                                            index === 0 ? 'e.g., Idea / Script' :
                                                                index === 1 ? 'e.g., Recording / In Progress' :
                                                                    index === 2 ? 'e.g., Editing / Done' :
                                                                        `Column ${index + 1}`
                                                        }
                                                        value={column}
                                                        onChange={(e) => handleCustomColumnChange(index, e.target.value)}
                                                        className="flex-1"
                                                    />
                                                    {customColumns.length > 2 && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => handleRemoveCustomColumn(index)}
                                                        >
                                                            <Trash className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                            {customColumns.length < 7 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleAddCustomColumn}
                                                    className="w-full"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Add Column
                                                </Button>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Submit button */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep('welcome')}
                                    className="flex-1"
                                    disabled={isPending}
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    className="flex-1"
                                    disabled={!selectedPreset || isPending}
                                >
                                    {isPending ? 'Setting up...' : 'Continue'}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
