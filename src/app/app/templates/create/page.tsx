'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    TwitterLogo,
    YoutubeLogo,
    LinkedinLogo,
    Article,
    Plus,
    SpinnerGap,
    Eye,
    EyeSlash,
    type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import { createTemplate } from '@/actions/templates';
import { PlaceholderList } from '@/components/templates/placeholder-renderer';
import { PlatformPreview } from '@/components/templates/platform-preview';
import { generateId } from '@/lib/template-utils';
import type { PlatformType, TemplateExample } from '@/types/database';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const platforms: { value: PlatformType; icon: PhosphorIcon; label: string; color: string }[] = [
    { value: 'x', icon: TwitterLogo, label: 'X', color: 'hover:bg-sky-500/10 hover:text-sky-500 data-[active=true]:bg-sky-500/10 data-[active=true]:text-sky-500 data-[active=true]:border-sky-500/30' },
    // { value: 'linkedin', icon: LinkedinLogo, label: 'LinkedIn', color: 'hover:bg-blue-600/10 hover:text-blue-600 data-[active=true]:bg-blue-600/10 data-[active=true]:text-blue-600 data-[active=true]:border-blue-600/30' },
    // { value: 'youtube', icon: YoutubeLogo, label: 'YouTube Title', color: 'hover:bg-red-500/10 hover:text-red-500 data-[active=true]:bg-red-500/10 data-[active=true]:text-red-500 data-[active=true]:border-red-500/30' },
    // { value: 'generic', icon: Article, label: 'Other', color: 'hover:bg-gray-500/10 hover:text-gray-500 data-[active=true]:bg-gray-500/10 data-[active=true]:text-gray-500 data-[active=true]:border-border/30' },
];

export default function CreateTemplatePage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Form state
    const [platform, setPlatform] = useState<PlatformType>('x');
    const [templateText, setTemplateText] = useState('');
    const [name, setName] = useState('');
    const [notes, setNotes] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [tagsInput, setTagsInput] = useState('');

    // Examples (merged with references)
    const [examples, setExamples] = useState<TemplateExample[]>([]);
    const [newExampleContent, setNewExampleContent] = useState('');
    const [newExampleUrl, setNewExampleUrl] = useState('');

    const addExample = () => {
        if (!newExampleContent.trim() && !newExampleUrl.trim()) return;

        setExamples([...examples, {
            id: generateId(),
            content: newExampleContent.trim(),
            author: null,
            platform: platform,
            source_url: newExampleUrl.trim() || null,
        }]);

        setNewExampleContent('');
        setNewExampleUrl('');
    };

    const removeExample = (id: string) => {
        setExamples(examples.filter(e => e.id !== id));
    };

    const handleSubmit = () => {
        if (!templateText.trim()) return;

        const tags = Array.from(
            new Set(
                tagsInput
                    .split(',')
                    .map((tag) => tag.trim().toLowerCase())
                    .filter(Boolean),
            ),
        );

        startTransition(async () => {
            try {
                await createTemplate({
                    name: name.trim() || `${platform.toUpperCase()} Template`,
                    platform_type: platform,
                    template_text: templateText.trim(),
                    instructions: notes.trim() || null,
                    examples: examples.length > 0 ? examples : undefined,
                    is_public: isPublic,
                    tags,
                });
                router.push('/app/templates');
            } catch (error) {
                console.error('Failed to create template:', error);
            }
        });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
            {/* Back navigation */}
            <Link
                href="/app/templates"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Templates
            </Link>

            {/* Platform selector - horizontal icons */}
            {/* <div className="flex items-center gap-2">
                {platforms.map((p) => {
                    const Icon = p.icon;
                    return (
                        <button
                            key={p.value}
                            type="button"
                            onClick={() => setPlatform(p.value)}
                            data-active={platform === p.value}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${p.color}`}
                        >
                            <Icon className="h-5 w-5" weight={platform === p.value ? 'fill' : 'regular'} />
                            <span>{p.label}</span>
                        </button>
                    );
                })}
            </div> */}

            {/* Live Preview - platform specific */}
            {templateText && (
                <PlatformPreview
                    platform={platform}
                    content={templateText}
                />
            )}

            {/* Template Text Input */}
            <div className="space-y-2">
                <AutoResizeTextarea
                    value={templateText}
                    onChange={(e) => setTemplateText(e.target.value)}
                    placeholder={platform === 'youtube'
                        ? "Enter your title template...\n\nExample: How [famous person] uses [technique] to [achieve result]"
                        : "Paste or write your template here...\n\nUse [placeholder] for fill-in-the-blank sections.\n\nExample:\nI spent [time period] with [notable individuals] in [location]\n\nX [content types] (that every [target audience] needs to hear):"
                    }
                    minRows={3}
                    maxRows={15}
                    className="w-full px-4 py-4 rounded-2xl border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary font-mono text-sm leading-relaxed transition-all"
                />

                {/* Placeholders detected - subtle */}
                {templateText && (
                    <PlaceholderList templateText={templateText} className="opacity-60" />
                )}
            </div>

            {/* Optional fields - collapsed by default */}
            <div className="space-y-4">
                {/* Name - optional */}
                <div>
                    <input
                        type="text"
                        placeholder="Template name (optional) — auto-generated if empty"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-border/40 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        variant={isPublic ? 'secondary' : 'outline'}
                        className="gap-2"
                        onClick={() => setIsPublic((value) => !value)}
                    >
                        {isPublic ? <Eye className="h-4 w-4" /> : <EyeSlash className="h-4 w-4" />}
                        {isPublic ? 'Public' : 'Private'}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        Public templates can be discovered and liked.
                    </span>
                </div>

                <div>
                    <input
                        type="text"
                        placeholder="Tags (comma-separated), e.g. hooks, x-growth, storytelling"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-border/40 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                </div>

                {/* Notes */}
                <div>
                    <textarea
                        placeholder="Notes — Hook style, tone, length, any reminders for yourself..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-3 rounded-lg border border-border/40 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
                    />
                </div>
            </div>

            {/* Examples Section */}
            <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Examples (optional)</p>

                {/* Existing examples */}
                {examples.length > 0 && (
                    <div className="space-y-2">
                        {examples.map((example) => (
                            <div key={example.id} className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border">
                                <div className="flex-1 min-w-0">
                                    {example.content && (
                                        <p className="text-sm line-clamp-2">{example.content}</p>
                                    )}
                                    {example.source_url && (
                                        <p className="text-xs text-muted-foreground truncate mt-1">{example.source_url}</p>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => removeExample(example.id)}
                                    className="text-destructive hover:text-destructive shrink-0"
                                >
                                    ×
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add example */}
                 <div className="*:not-first:mt-2">
                        <Label htmlFor={"example-input"}>Autogrowing textarea</Label>
                        <Textarea
                            className="field-sizing-content max-h-29.5 min-h-0 resize-none py-1.75"
                            id={"example-input"}
                            placeholder="Leave a comment"
                        />
                    </div>
                <div className="flex gap-2">
                   
                    <input
                        type="text"
                        placeholder="Paste example content or URL..."
                        value={newExampleContent || newExampleUrl}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val.startsWith('http')) {
                                setNewExampleUrl(val);
                                setNewExampleContent('');
                            } else {
                                setNewExampleContent(val);
                                setNewExampleUrl('');
                            }
                        }}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-border/40 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={addExample}
                        disabled={!newExampleContent.trim() && !newExampleUrl.trim()}
                        className="gap-1.5"
                    >
                        <Plus className="h-4 w-4" />
                        Add
                    </Button>
                </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleSubmit}
                    disabled={isPending || !templateText.trim()}
                    className="gap-2 px-6"
                >
                    {isPending ? (
                        <>
                            <SpinnerGap className="h-4 w-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        'Create Template'
                    )}
                </Button>
            </div>
        </div>
    );
}

