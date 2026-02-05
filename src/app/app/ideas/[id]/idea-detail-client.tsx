/**
 * Idea Detail Client Component
 * Handles viewing and editing idea content with Editor.js
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash, FloppyDisk, SpinnerGap, ArrowRight } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Editor from '@/components/editor/editor';
import { updateIdea, deleteIdea } from '@/actions/ideas';
import { createContentFromIdea } from '@/actions/planning';
import type { Idea, EditorJSData } from '@/types/database';

interface IdeaDetailClientProps {
    idea: Idea;
}

export default function IdeaDetailClient({ idea }: IdeaDetailClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Form state
    const [title, setTitle] = useState(idea.title);
    const [editorData, setEditorData] = useState<EditorJSData>(
        idea.content as EditorJSData || { blocks: [] }
    );
    const [hasChanges, setHasChanges] = useState(false);

    /**
     * Save changes to the idea
     */
    const handleSave = () => {
        startTransition(async () => {
            try {
                await updateIdea(idea.id, {
                    title: title.trim(),
                    content: editorData,
                    raw_text: editorData.blocks?.map(b => b.data?.text || '').join('\n') || null,
                });
                setHasChanges(false);
            } catch (error) {
                console.error('Failed to save idea:', error);
            }
        });
    };

    /**
     * Delete the idea and navigate back
     */
    const handleDelete = () => {
        if (!confirm('Are you sure you want to delete this idea?')) return;
        startTransition(async () => {
            await deleteIdea(idea.id);
            router.push('/app/ideas');
        });
    };

    /**
     * Move idea to planning board
     */
    const handleMoveToPlan = () => {
        startTransition(async () => {
            try {
                await createContentFromIdea(idea.id, 'Starting Point');
                router.push('/app/planning');
            } catch (error) {
                console.error('Failed to move to planning:', error);
                alert('Failed to move to planning. Make sure you have set up your workflow first.');
            }
        });
    };

    const handleBack = () => {
        router.push('/app/ideas');
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
        setHasChanges(true);
    };

    const handleEditorChange = (data: EditorJSData) => {
        setEditorData(data);
        setHasChanges(true);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-8">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="hover:bg-muted"
                >
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </Button>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        onClick={handleMoveToPlan}
                        disabled={isPending}
                        className="gap-2 text-muted-foreground hover:text-primary"
                    >
                        <ArrowRight className="w-4 h-4" />
                        Move to Planning
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDelete}
                        disabled={isPending}
                        className="text-muted-foreground hover:text-destructive"
                    >
                        <Trash className="w-4 h-4" />
                    </Button>

                    {hasChanges && (
                        <Button
                            onClick={handleSave}
                            disabled={isPending}
                            className="gap-2 select-none"
                            variant="ghost"
                        >
                            {isPending ? (
                                <SpinnerGap className="w-4 h-4 animate-spin" />
                            ) : (
                                <FloppyDisk className="w-4 h-4 text-primary" weight="fill" />
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Title Input as seamless textarea */}
            <div className="px-4 md:px-0">
                <textarea
                    id="title"
                    value={title}
                    onChange={(e) => {
                        handleTitleChange(e as any);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    placeholder="Untitled Idea"
                    rows={1}
                    className="w-full bg-transparent text-4xl md:text-5xl font-bold border-none outline-none resize-none placeholder:text-muted-foreground/30 focus:ring-0 p-0 overflow-hidden leading-tight"
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                    }}
                />
            </div>

            {/* Editor.js Content */}
            <div className="min-h-[500px] px-4 md:px-0">
                <Editor
                    data={editorData}
                    onChange={handleEditorChange}
                    placeholder="Start typing your thoughts..."
                />
            </div>
        </div>
    );
}
