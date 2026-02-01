'use client';

import { useState, useTransition } from 'react';
import { FileText, X, Plus, Trash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { createTemplate } from '@/actions/templates';
import { MadLibsEditor } from './mad-libs-editor';
import { PlaceholderRenderer } from './placeholder-renderer';
import { detectEmbedType, generateId } from '@/lib/template-utils';
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

            {/* Step 3: Template Text (Mad Libs) */}
            {step === 3 && (
                <div className="space-y-4 animate-fade-in-up">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Template Text</label>
                        <p className="text-xs text-muted-foreground mb-3">
                            Write your template with fill-in-the-blank placeholders
                        </p>
                        <MadLibsEditor
                            value={templateText}
                            onChange={setTemplateText}
                            placeholder={`I spent [time period] with [notable individuals] in [location]\n\nX [content types] (that every [target audience] needs to hear):`}
                            rows={6}
                        />
                    </div>

                    {templateText && (
                        <div>
                            <label className="text-sm font-medium mb-2 block">Preview</label>
                            <div className="p-4 rounded-xl bg-muted/50 border">
                                <PlaceholderRenderer templateText={templateText} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Step 4: Examples */}
            {step === 4 && (
                <div className="space-y-4 animate-fade-in-up">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Add Examples</label>
                        <p className="text-xs text-muted-foreground mb-3">
                            Show this template in action with real examples
                        </p>
                    </div>

                    {/* Existing examples */}
                    {examples.length > 0 && (
                        <div className="space-y-2">
                            {examples.map((example) => (
                                <div key={example.id} className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm line-clamp-2">{example.content}</p>
                                        {example.author && (
                                            <p className="text-xs text-muted-foreground mt-1">— {example.author}</p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => removeExample(example.id)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add new example form */}
                    <div className="space-y-3 p-4 rounded-xl border border-dashed">
                        <textarea
                            placeholder="Paste an example that uses this template style..."
                            value={newExampleContent}
                            onChange={(e) => setNewExampleContent(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                placeholder="Author name (optional)"
                                value={newExampleAuthor}
                                onChange={(e) => setNewExampleAuthor(e.target.value)}
                                className="px-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                            />
                            <input
                                type="url"
                                placeholder="Source URL (optional)"
                                value={newExampleUrl}
                                onChange={(e) => setNewExampleUrl(e.target.value)}
                                className="px-4 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={addExample}
                            disabled={!newExampleContent.trim()}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Example
                        </Button>
                    </div>
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
