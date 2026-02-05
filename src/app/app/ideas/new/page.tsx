/**
 * New Idea Page
 * Simple page for creating ideas with Editor.js for rich content
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FloppyDisk, SpinnerGap } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Editor from '@/components/editor/editor';
import { createIdea } from '@/actions/ideas';
import type { EditorJSData } from '@/types/database';

export default function NewIdeaPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Form state
    const [title, setTitle] = useState('');
    const [editorData, setEditorData] = useState<EditorJSData>({ blocks: [] });

    /**
     * Handles form submission - creates the idea and navigates back to ideas list
     */
    const handleSubmit = () => {
        if (!title.trim()) return;

        startTransition(async () => {
            try {
                await createIdea({
                    title: title.trim(),
                    content: editorData,
                    raw_text: editorData.blocks?.map(b => b.data?.text || '').join('\n') || null,
                });
                router.push('/app/ideas');
            } catch (error) {
                console.error('Failed to create idea:', error);
            }
        });
    };

    const handleCancel = () => {
        router.push('/app/ideas');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCancel}
                        className="hover:bg-muted"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">New Idea</h1>
                        <p className="text-muted-foreground text-sm">
                            Capture your idea with rich content
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!title.trim() || isPending}
                        className="gap-2"
                    >
                        {isPending ? (
                            <>
                                <SpinnerGap className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <FloppyDisk className="w-4 h-4" weight="fill" />
                                Save Idea
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Title Input */}
            <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                    Title <span className="text-destructive">*</span>
                </label>
                <Input
                    id="title"
                    placeholder="What's the idea?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-lg font-medium"
                    autoFocus
                />
            </div>

            {/* Editor.js Content Editor */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <div className="min-h-[400px] rounded-xl border  py-2 px-8 flex ">
                    <Editor
                        data={editorData}
                        onChange={setEditorData}

                        placeholder="Expand on your idea... Add headers, lists, quotes, and more"
                    />
                </div>
            </div>
        </div>
    );
}
