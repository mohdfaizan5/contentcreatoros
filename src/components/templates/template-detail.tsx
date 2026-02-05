'use client';

import React, { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash, Copy, Check, SpinnerGap, FloppyDisk, TwitterLogo, YoutubeLogo, LinkedinLogo, Article, Heart, ChatCircle, ArrowsClockwise, Share, ThumbsUp, ChatTeardropText, Repeat } from '@phosphor-icons/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { deleteTemplate, updateTemplate } from '@/actions/templates';
import { PlaceholderList } from './placeholder-renderer';
import { ExamplesList } from './example-card';
import { SocialEmbed } from './social-embed';
import type { Template, PlatformType } from '@/types/database';
import { cn } from '@/lib/utils';

const platformConfig: Record<PlatformType, { icon: React.ElementType; color: string; label: string }> = {
    x: { icon: TwitterLogo, color: 'bg-sky-500/10 text-sky-600 border-sky-500/20', label: 'X (Twitter)' },
    youtube: { icon: YoutubeLogo, color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'YouTube' },
    linkedin: { icon: LinkedinLogo, color: 'bg-blue-600/10 text-blue-600 border-blue-600/20', label: 'LinkedIn' },
    generic: { icon: Article, color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', label: 'Generic' },
};

interface TemplateDetailProps {
    template: Template;
}

// Helper for auto-growing textarea
const useAutoResize = (value: string) => {
    const ref = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.style.height = 'auto';
            ref.current.style.height = ref.current.scrollHeight + 'px';
        }
    }, [value]);
    return ref;
};

// Helper component for highlighting placeholders [text]
const HighlightedTextarea = ({ value, onChange, placeholder, minHeight = '100px', className }: { value: string, onChange: (v: string) => void, placeholder?: string, minHeight?: string, className?: string }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);

    // Shared styles for perfect alignment between backdrop and textarea
    const sharedStyles: React.CSSProperties = {
        fontFamily: 'inherit',
        fontSize: '0.875rem', // text-sm equivalent
        lineHeight: '1.625', // leading-relaxed equivalent
        padding: '0.75rem', // p-3 equivalent
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        boxSizing: 'border-box',
        letterSpacing: 'normal',
    };

    return (
        <div className="relative w-full group" style={{ minHeight }}>
            {/* Backdrop for highlighting - only shows background, text is invisible */}
            <div
                aria-hidden="true"
                className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
                style={sharedStyles}
            >
                {/* Render invisible text with visible background highlights on brackets */}
                {value.split(/(\[[^\[\]]+\])/g).map((part, i) => {
                    if (part.match(/^\[[^\[\]]+\]$/)) {
                        // Bracketed text: invisible text with visible background
                        return (
                            <span
                                key={i}
                                className="bg-red-500/15 rounded-sm"
                                style={{ color: 'transparent' }}
                            >
                                {part}
                            </span>
                        );
                    }
                    // Non-bracketed text: completely invisible (just for spacing)
                    return <span key={i} style={{ color: 'transparent' }}>{part}</span>;
                })}
                {/* Trailing space to prevent height collapse */}
                <span style={{ color: 'transparent' }}>{'\u00A0'}</span>
            </div>

            {/* Actual Textarea - must match backdrop styles exactly */}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    "relative block w-full h-full bg-transparent resize-none focus:outline-none text-foreground/90 overflow-hidden border-0",
                    className
                )}
                style={{ ...sharedStyles, minHeight, background: 'transparent' }}
                spellCheck={false}
            />
        </div>
    );
};

export function TemplateDetail({ template }: TemplateDetailProps) {
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [editedText, setEditedText] = useState(template.template_text || '');
    const [editedNotes, setEditedNotes] = useState(template.instructions || '');
    const [editedExamples, setEditedExamples] = useState(template.examples || []);
    const [hasChanges, setHasChanges] = useState(false);
    const [isPending, startTransition] = useTransition();

    const platform = platformConfig[template.platform_type];
    const Icon = platform.icon;
    const examplesCount = template.examples?.length || 0;
    const referencesCount = template.reference_links?.length || 0;

    const notesRef = useAutoResize(editedNotes);

    const handleCopyTemplate = async () => {
        if (!editedText) return;
        await navigator.clipboard.writeText(editedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDelete = () => {
        if (!confirm('Delete this template?')) return;
        startTransition(async () => {
            await deleteTemplate(template.id);
            router.push('/app/templates');
        });
    };

    const handleSave = () => {
        startTransition(async () => {
            await updateTemplate(template.id, {
                template_text: editedText.trim() || null,
                instructions: editedNotes.trim() || null,
                examples: editedExamples,
            });
            setHasChanges(false);
        });
    };

    const handleExamplesChange = (newExamples: typeof editedExamples) => {
        setEditedExamples(newExamples);
        setHasChanges(true);
    };

    const handleTextChange = (value: string) => {
        setEditedText(value);
        setHasChanges(true);
    };

    const handleNotesChange = (value: string) => {
        setEditedNotes(value);
        setHasChanges(true);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up pb-20">
            {/* Back navigation + Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/app/templates"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>

                    {/* Platform badge + Template name */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${platform.color}`}>
                        <Icon className="h-4 w-4" weight="fill" />
                        <span className="text-sm font-medium">{template.name || platform.label}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyTemplate}
                        disabled={!editedText}
                        className="gap-2"
                    >
                        {copied ? (
                            <>
                                <Check className="h-4 w-4 text-green-500" />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4" />
                                Copy
                            </>
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        disabled={isPending}
                        className="gap-2 text-destructive hover:text-destructive"
                    >
                        {isPending ? (
                            <SpinnerGap className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash className="h-4 w-4" />
                        )}
                        Delete
                    </Button>

                    {hasChanges && (
                        <Button onClick={handleSave} disabled={isPending} className="gap-2">
                            {isPending ? (
                                <SpinnerGap className="h-4 w-4 animate-spin" />
                            ) : (
                                <FloppyDisk className="h-4 w-4" weight="fill" />
                            )}
                            Save
                        </Button>
                    )}
                </div>
            </div>

            {/* Inline Edit Preview - platform specific */}
            {template.platform_type === 'x' && (
                <TwitterInlineEditor
                    content={editedText}
                    onChange={handleTextChange}
                />
            )}

            {template.platform_type === 'linkedin' && (
                <LinkedInInlineEditor
                    content={editedText}
                    onChange={handleTextChange}
                />
            )}

            {template.platform_type === 'youtube' && (
                <YouTubeInlineEditor
                    content={editedText}
                    onChange={handleTextChange}
                />
            )}

            {template.platform_type === 'generic' && (
                <GenericInlineEditor
                    content={editedText}
                    onChange={handleTextChange}
                />
            )}

            {/* Placeholders */}
            {editedText && (
                <PlaceholderList templateText={editedText} />
            )}
            {/* References (Embeds) */}
            {referencesCount > 0 && (
                <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">References</p>
                    <div className="space-y-3">
                        {template.reference_links!.map((ref) => (
                            <SocialEmbed key={ref.id} reference={ref} />
                        ))}
                    </div>
                </div>
            )}

            {/* Examples - Masonry Layout */}
            <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Examples</p>
                <ExamplesList
                    examples={editedExamples}
                    templateText={editedText || undefined}
                    onExamplesChange={handleExamplesChange}
                    defaultPlatform={template.platform_type}
                />
            </div>
            {/* Notes */}
            <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground ml-1">Notes</p>
                <div className="p-4 rounded-xl bg-muted/30 border border-muted min-h-[100px]">
                    <textarea
                        ref={notesRef}
                        value={editedNotes}
                        onChange={(e) => handleNotesChange(e.target.value)}
                        placeholder="Add notes about using this template..."
                        className="w-full bg-transparent text-sm text-foreground/90 focus:outline-none resize-none placeholder:text-muted-foreground/50 overflow-hidden"
                        style={{ minHeight: '80px' }}
                    />
                </div>
            </div>


        </div>
    );
}

// ============================================
// INLINE EDITORS
// ============================================

interface InlineEditorProps {
    content: string;
    onChange: (value: string) => void;
}

function TwitterInlineEditor({ content, onChange }: InlineEditorProps) {
    return (
        <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-4 py-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-linear-to-br from-sky-400 to-sky-600" />
                <div className="flex-1">
                    <div className="flex items-center gap-1">
                        <span className="font-semibold text-sm">Your Name</span>
                        <svg className="h-4 w-4 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z" />
                        </svg>
                    </div>
                    <span className="text-xs text-muted-foreground">@yourhandle</span>
                </div>
                <TwitterLogo className="h-5 w-5 text-sky-500" weight="fill" />
            </div>

            {/* Editable Content */}
            <div className="px-4 pb-4">
                <HighlightedTextarea
                    value={content}
                    onChange={onChange}
                    placeholder="What's happening?"
                    minHeight="120px"
                    className="text-[17px] leading-relaxed p-0"
                />
            </div>

            {/* Actions */}
            <div className="px-4 py-2 border-t flex items-center justify-between text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-sky-500 transition-colors">
                    <ChatCircle className="h-4 w-4" />
                    <span className="text-xs">123</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-green-500 transition-colors">
                    <ArrowsClockwise className="h-4 w-4" />
                    <span className="text-xs">456</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                    <Heart className="h-4 w-4" />
                    <span className="text-xs">789</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-sky-500 transition-colors">
                    <Share className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

function LinkedInInlineEditor({ content, onChange }: InlineEditorProps) {
    return (
        <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-4 py-3 flex items-start gap-3">
                <div className="h-12 w-12 rounded-full bg-linear-to-br from-blue-500 to-blue-700" />
                <div className="flex-1">
                    <p className="font-semibold text-sm">Your Name</p>
                    <p className="text-xs text-muted-foreground">Your headline • 1h</p>
                </div>
                <LinkedinLogo className="h-5 w-5 text-blue-600" weight="fill" />
            </div>

            {/* Editable Content */}
            <div className="px-4 pb-4">
                <HighlightedTextarea
                    value={content}
                    onChange={onChange}
                    placeholder="What do you want to talk about?"
                    minHeight="150px"
                    className="text-[15px] leading-relaxed p-0"
                />
            </div>

            {/* Engagement */}
            <div className="px-4 py-2 border-t border-b text-xs text-muted-foreground">
                <span>👍 ❤️ 💡 1,234</span>
            </div>

            {/* Actions */}
            <div className="px-4 py-2 flex items-center justify-around text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-blue-600/10">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-xs font-medium">Like</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-blue-600/10">
                    <ChatTeardropText className="h-4 w-4" />
                    <span className="text-xs font-medium">Comment</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-blue-600/10">
                    <Repeat className="h-4 w-4" />
                    <span className="text-xs font-medium">Repost</span>
                </button>
            </div>
        </div>
    );
}

function YouTubeInlineEditor({ content, onChange }: InlineEditorProps) {
    return (
        <div className="rounded-xl border bg-card p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                <YoutubeLogo className="h-5 w-5 text-red-500" weight="fill" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">YouTube Title</p>
                <HighlightedTextarea
                    value={content}
                    onChange={onChange}
                    placeholder="Enter your video title..."
                    minHeight="80px"
                    className="font-medium text-sm p-0"
                />
            </div>
        </div>
    );
}

function GenericInlineEditor({ content, onChange }: InlineEditorProps) {
    return (
        <div className="rounded-xl border bg-card p-4">
            <HighlightedTextarea
                value={content}
                onChange={onChange}
                placeholder="Enter your template content..."
                minHeight="150px"
                className="text-sm leading-relaxed p-0"
            />
        </div>
    );
}
