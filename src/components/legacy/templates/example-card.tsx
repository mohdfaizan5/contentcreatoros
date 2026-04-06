'use client';

import { useState, useRef, useEffect } from 'react';
import { TwitterLogo, LinkedinLogo, Link as LinkIcon, ArrowSquareOut, User, Trash, PencilSimple, Check, X, Plus } from '@phosphor-icons/react';
import type { TemplateExample, PlatformType } from '@/types/database';
import { Tweet } from 'react-tweet';
import { Button } from '@/components/ui/button';

const platformConfig: Record<PlatformType, { icon: React.ElementType; color: string; label: string }> = {
    x: { icon: TwitterLogo, color: 'text-sky-500 bg-sky-500/10', label: 'X' },
    youtube: { icon: LinkIcon, color: 'text-red-500 bg-red-500/10', label: 'YouTube' },
    linkedin: { icon: LinkedinLogo, color: 'text-blue-600 bg-blue-600/10', label: 'LinkedIn' },
    generic: { icon: LinkIcon, color: 'text-gray-500 bg-gray-500/10', label: 'Generic' },
};

interface ExampleCardProps {
    example: TemplateExample;
    templateText?: string;
    onDelete?: () => void;
    onUpdate?: (updated: TemplateExample) => void;
}

// Helper
function extractTweetId(url: string) {
    const match = url.match(/(?:twitter|x)\.com\/(?:[^/]+)\/status\/(\d+)/);
    return match ? match[1] : null;
}

/**
 * Displays a template example with edit/delete capabilities
 */
export function ExampleCard({ example, templateText, onDelete, onUpdate }: ExampleCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(example.content);
    const [editedAuthor, setEditedAuthor] = useState(example.author || '');
    const [editedUrl, setEditedUrl] = useState(example.source_url || '');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const platform = example.platform ? platformConfig[example.platform] : null;
    const Icon = platform?.icon || LinkIcon;

    // Check if it's a tweet
    const tweetId = example.source_url ? extractTweetId(example.source_url) : null;
    const isTweet = !!tweetId;

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current && isEditing) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [editedContent, isEditing]);

    const handleSave = () => {
        if (onUpdate) {
            onUpdate({
                ...example,
                content: editedContent,
                author: editedAuthor.trim() || null,
                source_url: editedUrl.trim() || null,
            });
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedContent(example.content);
        setEditedAuthor(example.author || '');
        setEditedUrl(example.source_url || '');
        setIsEditing(false);
    };

    if (isTweet && tweetId && !isEditing) {
        return (
            <div className="group relative rounded-xl border bg-card overflow-hidden hover:shadow-md transition-all break-inside-avoid mb-4">
                {/* Hover Actions */}
                <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 rounded-lg bg-background/90 backdrop-blur-sm border hover:bg-muted transition-colors"
                        title="Edit"
                    >
                        <PencilSimple className="h-3.5 w-3.5" />
                    </button>
                    {onDelete && (
                        <button
                            onClick={onDelete}
                            className="p-1.5 rounded-lg bg-background/90 backdrop-blur-sm border text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete"
                        >
                            <Trash className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
                <div className="tweet-container light border-none">
                    <Tweet id={tweetId} />
                </div>
            </div>
        );
    }

    // Editing mode
    if (isEditing) {
        return (
            <div className="rounded-xl border bg-card p-4 space-y-3 break-inside-avoid mb-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Edit Example</span>
                    <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={handleCancel}>
                            <X className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                            <Check className="h-4 w-4 mr-1" />
                            Save
                        </Button>
                    </div>
                </div>

                <textarea
                    ref={textareaRef}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    placeholder="Example content..."
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                />

                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="text"
                        value={editedAuthor}
                        onChange={(e) => setEditedAuthor(e.target.value)}
                        placeholder="Author (optional)"
                        className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                        type="url"
                        value={editedUrl}
                        onChange={(e) => setEditedUrl(e.target.value)}
                        placeholder="Source URL (optional)"
                        className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="group relative rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20 flex flex-col break-inside-avoid mb-4">
            {/* Hover Actions */}
            <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 rounded-lg bg-background/90 backdrop-blur-sm border hover:bg-muted transition-colors"
                    title="Edit"
                >
                    <PencilSimple className="h-3.5 w-3.5" />
                </button>
                {onDelete && (
                    <button
                        onClick={onDelete}
                        className="p-1.5 rounded-lg bg-background/90 backdrop-blur-sm border text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete"
                    >
                        <Trash className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    {example.author && (
                        <>
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" weight="duotone" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">{example.author}</p>
                                {platform && (
                                    <p className="text-xs text-muted-foreground">{platform.label}</p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Visit Icon on Hover */}
                {example.source_url && (
                    <a
                        href={example.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-primary/10 text-primary rounded-lg"
                        title="Visit Link"
                    >
                        <ArrowSquareOut className="h-4 w-4" weight="bold" />
                    </a>
                )}
            </div>

            {/* Content */}
            <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {example.content}
            </div>

            {/* Footer with platform icon */}
            <div className="mt-auto pt-4 flex justify-end opacity-50">
                {platform && <Icon className="h-4 w-4" />}
            </div>
        </div>
    );
}

interface AddExampleFormProps {
    onAdd: (example: Omit<TemplateExample, 'id'>) => void;
    onCancel: () => void;
    defaultPlatform?: PlatformType;
}

export function AddExampleForm({ onAdd, onCancel, defaultPlatform = 'generic' }: AddExampleFormProps) {
    const [content, setContent] = useState('');
    const [author, setAuthor] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');

    const handleSubmit = () => {
        if (!content.trim()) return;
        onAdd({
            content: content.trim(),
            author: author.trim() || null,
            source_url: sourceUrl.trim() || null,
            platform: defaultPlatform,
        });
        setContent('');
        setAuthor('');
        setSourceUrl('');
    };

    return (
        <div className="rounded-xl border bg-card p-4 space-y-3 break-inside-avoid mb-4">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Add Example</span>
                <Button size="sm" variant="ghost" onClick={onCancel}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste an example of this template in action..."
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
            />

            <div className="grid grid-cols-2 gap-2">
                <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Author (optional)"
                    className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="Source URL (optional)"
                    className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            <Button onClick={handleSubmit} disabled={!content.trim()} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Example
            </Button>
        </div>
    );
}

interface ExamplesListProps {
    examples: TemplateExample[];
    templateText?: string;
    onExamplesChange?: (examples: TemplateExample[]) => void;
    defaultPlatform?: PlatformType;
}

/**
 * Masonry grid of example cards with add/edit/delete
 */
export function ExamplesList({ examples, templateText, onExamplesChange, defaultPlatform }: ExamplesListProps) {
    const [showAddForm, setShowAddForm] = useState(false);

    const handleDelete = (id: string) => {
        if (!onExamplesChange) return;
        if (!confirm('Delete this example?')) return;
        onExamplesChange(examples.filter(e => e.id !== id));
    };

    const handleUpdate = (updated: TemplateExample) => {
        if (!onExamplesChange) return;
        onExamplesChange(examples.map(e => e.id === updated.id ? updated : e));
    };

    const handleAdd = (newExample: Omit<TemplateExample, 'id'>) => {
        if (!onExamplesChange) return;
        const example: TemplateExample = {
            ...newExample,
            id: crypto.randomUUID(),
        };
        onExamplesChange([...examples, example]);
        setShowAddForm(false);
    };

    return (
        <div className="space-y-4">
            {/* Add Example Button */}
            {onExamplesChange && !showAddForm && (
                <Button
                    variant="outline"
                    onClick={() => setShowAddForm(true)}
                    className="w-full border-dashed hover:border-primary/50 hover:text-primary"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Example
                </Button>
            )}

            {/* Masonry Layout - 2 columns */}
            <div className="columns-1 md:columns-2 gap-4">
                {/* Add Form (appears first if open) */}
                {showAddForm && onExamplesChange && (
                    <AddExampleForm
                        onAdd={handleAdd}
                        onCancel={() => setShowAddForm(false)}
                        defaultPlatform={defaultPlatform}
                    />
                )}

                {/* Example Cards */}
                {examples.map((example) => (
                    <ExampleCard
                        key={example.id}
                        example={example}
                        templateText={templateText}
                        onDelete={onExamplesChange ? () => handleDelete(example.id) : undefined}
                        onUpdate={onExamplesChange ? handleUpdate : undefined}
                    />
                ))}

                {/* Empty State */}
                {examples.length === 0 && !showAddForm && (
                    <div className="text-center py-8 rounded-xl border border-dashed col-span-full">
                        <p className="text-muted-foreground text-sm">No examples yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Add examples to show this template in action</p>
                    </div>
                )}
            </div>
        </div>
    );
}
