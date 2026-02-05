'use client';

import { useState, useTransition } from 'react';
import { FileText, X, Plus, Trash, TwitterLogo, LinkedinLogo, YoutubeLogo, Heart, ChatCircle, ArrowsClockwise, Share, ThumbsUp, ChatTeardropText, Repeat } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { createTemplate } from '@/actions/templates';
import { detectEmbedType, generateId } from '@/lib/template-utils';
import { SocialEmbed } from './social-embed';
import type { PlatformType, TemplateExample, TemplateReference } from '@/types/database';

const platforms: { value: PlatformType; label: string }[] = [
    { value: 'x', label: 'X (Twitter)' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'generic', label: 'Generic' },
];

interface TemplateFormProps {
    onClose?: () => void;
}

export function TemplateForm({ onClose }: TemplateFormProps) {
    const [step, setStep] = useState(1);
    const totalSteps = 5;

    // Step 1: Basic info
    const [name, setName] = useState('');
    const [platform, setPlatform] = useState<PlatformType>('generic');

    // Step 2: Template questions (legacy fields)
    const [hookStyle, setHookStyle] = useState('');
    const [length, setLength] = useState('');
    const [tone, setTone] = useState('');
    const [ctaStyle, setCtaStyle] = useState('');
    const [instructions, setInstructions] = useState('');

    // Step 3: Template text (Mad Libs)
    const [templateText, setTemplateText] = useState('');

    // Step 4: Examples
    const [examples, setExamples] = useState<TemplateExample[]>([]);
    const [newExampleContent, setNewExampleContent] = useState('');
    const [newExampleAuthor, setNewExampleAuthor] = useState('');
    const [newExampleUrl, setNewExampleUrl] = useState('');

    // Step 5: References
    const [references, setReferences] = useState<TemplateReference[]>([]);
    const [newReferenceUrl, setNewReferenceUrl] = useState('');
    const [newReferenceTitle, setNewReferenceTitle] = useState('');

    const [isPending, startTransition] = useTransition();

    const addExample = () => {
        if (!newExampleContent.trim()) return;

        setExamples([...examples, {
            id: generateId(),
            content: newExampleContent.trim(),
            author: newExampleAuthor.trim() || null,
            platform: platform,
            source_url: newExampleUrl.trim() || null,
        }]);

        setNewExampleContent('');
        setNewExampleAuthor('');
        setNewExampleUrl('');
    };

    const removeExample = (id: string) => {
        setExamples(examples.filter(e => e.id !== id));
    };

    const addReference = () => {
        if (!newReferenceUrl.trim()) return;

        setReferences([...references, {
            id: generateId(),
            url: newReferenceUrl.trim(),
            title: newReferenceTitle.trim() || null,
            embed_type: detectEmbedType(newReferenceUrl),
        }]);

        setNewReferenceUrl('');
        setNewReferenceTitle('');
    };

    const removeReference = (id: string) => {
        setReferences(references.filter(r => r.id !== id));
    };

    const handleSubmit = () => {
        if (!name.trim()) return;

        startTransition(async () => {
            try {
                await createTemplate({
                    name: name.trim(),
                    platform_type: platform,
                    hook_style: hookStyle.trim() || null,
                    length: length.trim() || null,
                    tone: tone.trim() || null,
                    cta_style: ctaStyle.trim() || null,
                    instructions: instructions.trim() || null,
                    template_text: templateText.trim() || null,
                    examples: examples.length > 0 ? examples : undefined,
                    reference_links: references.length > 0 ? references : undefined,
                });
                onClose?.();
            } catch (error) {
                console.error('Failed to create template:', error);
            }
        });
    };

    const canProceed = () => {
        switch (step) {
            case 1: return name.trim().length > 0;
            case 2: return true; // Optional step
            case 3: return true; // Optional step
            case 4: return true; // Optional step
            case 5: return true; // Optional step
            default: return true;
        }
    };

    return (
        <div className="rounded-2xl border bg-card p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-500" weight="duotone" />
                    </div>
                    <div>
                        <h2 className="font-semibold">Create Template</h2>
                        <p className="text-xs text-muted-foreground">Step {step} of {totalSteps}</p>
                    </div>
                </div>
                {onClose && (
                    <Button variant="ghost" size="icon-sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(step / totalSteps) * 100}%` }}
                />
            </div>

            {/* Step 1: Basic Info */}
            {step === 1 && (
                <div className="space-y-4 animate-fade-in-up">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Template Name</label>
                        <input
                            type="text"
                            placeholder="e.g., Viral Tweet Thread"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Platform</label>
                        <div className="grid grid-cols-2 gap-2">
                            {platforms.map((p) => (
                                <button
                                    key={p.value}
                                    type="button"
                                    onClick={() => setPlatform(p.value)}
                                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${platform === p.value
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'hover:bg-muted hover:border-muted-foreground/20'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Template Questions */}
            {step === 2 && (
                <div className="space-y-4 animate-fade-in-up">
                    <p className="text-sm text-muted-foreground">
                        Define the style of your template. These are optional.
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Hook Style</label>
                            <input
                                type="text"
                                placeholder="e.g., Bold statement"
                                value={hookStyle}
                                onChange={(e) => setHookStyle(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Length</label>
                            <input
                                type="text"
                                placeholder="e.g., Short (280 chars)"
                                value={length}
                                onChange={(e) => setLength(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Tone</label>
                            <input
                                type="text"
                                placeholder="e.g., Professional"
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">CTA Style</label>
                            <input
                                type="text"
                                placeholder="e.g., Follow for more"
                                value={ctaStyle}
                                onChange={(e) => setCtaStyle(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Additional Notes</label>
                        <textarea
                            placeholder="Any other notes for using this template..."
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
                        />
                    </div>
                </div>
            )}

            {/* Step 3: Template Text with Inline Preview */}
            {step === 3 && (
                <div className="space-y-4 animate-fade-in-up">
                    <p className="text-xs text-muted-foreground">
                        Type your template with [placeholders] in brackets
                    </p>

                    {/* Platform-specific inline editor */}
                    {platform === 'x' && (
                        <TwitterFormEditor value={templateText} onChange={setTemplateText} />
                    )}
                    {platform === 'linkedin' && (
                        <LinkedInFormEditor value={templateText} onChange={setTemplateText} />
                    )}
                    {platform === 'youtube' && (
                        <YouTubeFormEditor value={templateText} onChange={setTemplateText} />
                    )}
                    {platform === 'generic' && (
                        <GenericFormEditor value={templateText} onChange={setTemplateText} />
                    )}
                </div>
            )}

            {/* Step 4: Examples */}
            {step === 4 && (
                <div className="space-y-4 animate-fade-in-up">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Add Examples</label>
                        <p className="text-xs text-muted-foreground mb-3">
                            Paste a URL to embed or write content directly
                        </p>
                    </div>

                    {/* Existing examples */}
                    {examples.length > 0 && (
                        <div className="space-y-3">
                            {examples.map((example) => (
                                <SmartExampleDisplay
                                    key={example.id}
                                    example={example}
                                    onDelete={() => removeExample(example.id)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Smart input */}
                    <SmartExampleInput
                        onAdd={(content, author, url) => {
                            setExamples([...examples, {
                                id: generateId(),
                                content: content.trim(),
                                author: author?.trim() || null,
                                platform: platform,
                                source_url: url?.trim() || null,
                            }]);
                        }}
                    />
                </div>
            )}

            {/* Step 5: Reference Links */}
            {step === 5 && (
                <div className="space-y-4 animate-fade-in-up">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Reference Links</label>
                        <p className="text-xs text-muted-foreground mb-3">
                            Add links to posts that use this template style (X posts will be embedded)
                        </p>
                    </div>

                    {/* Existing references */}
                    {references.length > 0 && (
                        <div className="space-y-2">
                            {references.map((ref) => (
                                <div key={ref.id} className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{ref.title || ref.url}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{ref.embed_type}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => removeReference(ref.id)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add new reference form */}
                    <div className="space-y-3 p-4 rounded-xl border border-dashed">
                        <input
                            type="url"
                            placeholder="Paste a link (X, LinkedIn, Instagram, etc.)"
                            value={newReferenceUrl}
                            onChange={(e) => setNewReferenceUrl(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                        <input
                            type="text"
                            placeholder="Title (optional)"
                            value={newReferenceTitle}
                            onChange={(e) => setNewReferenceTitle(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                        />
                        <Button
                            variant="outline"
                            onClick={addReference}
                            disabled={!newReferenceUrl.trim()}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Reference
                        </Button>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex gap-2 pt-2">
                {step > 1 && (
                    <Button variant="outline" onClick={() => setStep(step - 1)}>
                        Back
                    </Button>
                )}

                {step < totalSteps ? (
                    <Button
                        className="flex-1"
                        onClick={() => setStep(step + 1)}
                        disabled={!canProceed()}
                    >
                        Continue
                    </Button>
                ) : (
                    <Button
                        className="flex-1"
                        onClick={handleSubmit}
                        disabled={isPending || !name.trim()}
                    >
                        {isPending ? 'Creating...' : 'Create Template'}
                    </Button>
                )}
            </div>
        </div>
    );
}

// ============================================
// INLINE FORM EDITORS
// ============================================

interface FormEditorProps {
    value: string;
    onChange: (value: string) => void;
}

function TwitterFormEditor({ value, onChange }: FormEditorProps) {
    return (
        <div className="rounded-2xl border bg-card overflow-hidden">
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
            <div className="px-4 pb-3">
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="I spent [time period] with [notable individuals]..."
                    className="w-full bg-transparent text-[15px] leading-relaxed focus:outline-none resize-none min-h-[100px] placeholder:text-muted-foreground/50"
                    rows={4}
                />
            </div>
            <div className="px-4 py-2 border-t flex items-center justify-between text-muted-foreground">
                <button className="flex items-center gap-1.5"><ChatCircle className="h-4 w-4" /><span className="text-xs">123</span></button>
                <button className="flex items-center gap-1.5"><ArrowsClockwise className="h-4 w-4" /><span className="text-xs">456</span></button>
                <button className="flex items-center gap-1.5"><Heart className="h-4 w-4" /><span className="text-xs">789</span></button>
                <button className="flex items-center gap-1.5"><Share className="h-4 w-4" /></button>
            </div>
        </div>
    );
}

function LinkedInFormEditor({ value, onChange }: FormEditorProps) {
    return (
        <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-4 py-3 flex items-start gap-3">
                <div className="h-12 w-12 rounded-full bg-linear-to-br from-blue-500 to-blue-700" />
                <div className="flex-1">
                    <p className="font-semibold text-sm">Your Name</p>
                    <p className="text-xs text-muted-foreground">Your headline • 1h</p>
                </div>
                <LinkedinLogo className="h-5 w-5 text-blue-600" weight="fill" />
            </div>
            <div className="px-4 pb-3">
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="What do you want to talk about?"
                    className="w-full bg-transparent text-sm leading-relaxed focus:outline-none resize-none min-h-[120px] placeholder:text-muted-foreground/50"
                    rows={5}
                />
            </div>
            <div className="px-4 py-2 border-t border-b text-xs text-muted-foreground">👍 ❤️ 💡 1,234</div>
            <div className="px-4 py-2 flex items-center justify-around text-muted-foreground">
                <button className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-blue-600/10"><ThumbsUp className="h-4 w-4" /><span className="text-xs font-medium">Like</span></button>
                <button className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-blue-600/10"><ChatTeardropText className="h-4 w-4" /><span className="text-xs font-medium">Comment</span></button>
                <button className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-blue-600/10"><Repeat className="h-4 w-4" /><span className="text-xs font-medium">Repost</span></button>
            </div>
        </div>
    );
}

function YouTubeFormEditor({ value, onChange }: FormEditorProps) {
    return (
        <div className="rounded-xl border bg-card p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                <YoutubeLogo className="h-5 w-5 text-red-500" weight="fill" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">YouTube Title</p>
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Enter your video title template..."
                    className="w-full bg-transparent font-medium text-sm focus:outline-none resize-none min-h-[60px] placeholder:text-muted-foreground/50"
                    rows={2}
                />
            </div>
        </div>
    );
}

function GenericFormEditor({ value, onChange }: FormEditorProps) {
    return (
        <div className="rounded-xl border bg-card p-4">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter your template content with [placeholders]..."
                className="w-full bg-transparent text-sm leading-relaxed focus:outline-none resize-none min-h-[120px] placeholder:text-muted-foreground/50"
                rows={5}
            />
        </div>
    );
}

// ============================================
// SMART EXAMPLE COMPONENTS
// ============================================

/**
 * Checks if a string is a single URL (no other content)
 */
function isSingleUrl(text: string): boolean {
    const trimmed = text.trim();
    try {
        new URL(trimmed);
        return !trimmed.includes(' ') && !trimmed.includes('\n');
    } catch {
        return false;
    }
}

interface SmartExampleInputProps {
    onAdd: (content: string, author?: string, url?: string) => void;
}

function SmartExampleInput({ onAdd }: SmartExampleInputProps) {
    const [input, setInput] = useState('');
    const [author, setAuthor] = useState('');

    const isUrl = isSingleUrl(input);

    const handleAdd = () => {
        if (!input.trim()) return;
        if (isUrl) {
            onAdd(input.trim(), undefined, input.trim());
        } else {
            onAdd(input.trim(), author || undefined, undefined);
        }
        setInput('');
        setAuthor('');
    };

    return (
        <div className="space-y-3 p-4 rounded-xl border border-dashed">
            {isUrl ? (
                <input
                    type="url"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste a URL to embed (X, LinkedIn, etc.)"
                    className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
            ) : (
                <>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste content or a URL..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
                    />
                    {input.trim() && (
                        <input
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="Author name (optional)"
                            className="w-full px-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                        />
                    )}
                </>
            )}
            <Button
                variant="outline"
                onClick={handleAdd}
                disabled={!input.trim()}
                className="gap-2"
            >
                <Plus className="h-4 w-4" />
                {isUrl ? 'Add Embed' : 'Add Example'}
            </Button>
        </div>
    );
}

interface SmartExampleDisplayProps {
    example: TemplateExample;
    onDelete: () => void;
}

function SmartExampleDisplay({ example, onDelete }: SmartExampleDisplayProps) {
    const isUrl = example.source_url && isSingleUrl(example.content);

    if (isUrl && example.source_url) {
        // Render as embed
        const embedType = detectEmbedType(example.source_url);
        return (
            <div className="relative group">
                <SocialEmbed reference={{ id: example.id, url: example.source_url, title: null, embed_type: embedType }} />
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onDelete}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive bg-background/80"
                >
                    <Trash className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    // Render as content card
    return (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border">
            <div className="flex-1 min-w-0">
                <p className="text-sm whitespace-pre-wrap">{example.content}</p>
                {example.author && (
                    <p className="text-xs text-muted-foreground mt-1">— {example.author}</p>
                )}
            </div>
            <Button
                variant="ghost"
                size="icon-sm"
                onClick={onDelete}
                className="text-destructive hover:text-destructive"
            >
                <Trash className="h-4 w-4" />
            </Button>
        </div>
    );
}
