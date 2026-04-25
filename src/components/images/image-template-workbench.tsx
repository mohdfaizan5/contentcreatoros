'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { toPng } from 'html-to-image';
import {
  ArrowClockwise,
  DownloadSimple,
  ImageSquare,
  LinkSimple,
  MagicWand,
  WarningCircle,
} from '@phosphor-icons/react';

import { generateImageTemplateCopy } from '@/actions/image-generation';
import {
  ImageTemplateOnePreview,
  ImageTemplateTwoPreview,
} from '@/components/images/image-template-previews';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/ui/frame';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  IMAGE_TEMPLATE_DEFINITIONS,
  IMAGE_TEMPLATE_IDS,
  type ImageTemplateCopy,
  type ImageTemplateFieldKey,
  type ImageTemplateId,
  getSeedImageTemplateCopy,
  isImageTemplateId,
  limitImageCopyFieldValue,
} from '@/lib/image-templates';
import { toBrandPreviewTheme, remixBrandColors, type BrandVisualIdentity } from '@/lib/brand-visuals';
import { cn } from '@/lib/utils';
import { SwatchesIcon } from '@phosphor-icons/react/dist/ssr';

type ImageTemplateWorkbenchProps = {
  brandIdentity: BrandVisualIdentity;
  companyOverview: string;
  initialWebsiteUrl: string;
  sourceTweet?: string;
  initialDirection?: string;
  autoGenerateNonce?: number;
  embedded?: boolean;
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

function renderFieldDescription(maxChars: number, optional?: boolean) {
  return `${optional ? 'Optional' : 'Required'} - max ${maxChars} chars`;
}

export function ImageTemplateWorkbench({
  brandIdentity,
  companyOverview,
  initialWebsiteUrl,
  sourceTweet = '',
  initialDirection = '',
  autoGenerateNonce,
  embedded = false,
}: ImageTemplateWorkbenchProps) {
  const [templateId, setTemplateId] = useState<ImageTemplateId>('template-1');
  const [copyByTemplate, setCopyByTemplate] = useState<Record<ImageTemplateId, ImageTemplateCopy>>(
    () => getSeedImageTemplateCopy(brandIdentity, companyOverview),
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerationTransition] = useTransition();
  const [remixVariant, setRemixVariant] = useState<number | null>(null);
  const [isRemixing, startRemixTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);
  const lastAutoGenerateNonceRef = useRef<number | undefined>(undefined);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const direction = initialDirection || sourceTweet;

  const companyName =
    brandIdentity.companyName || brandIdentity.sourceDomain || 'Your Brand';
  const previewTheme = useMemo(() => {
    if (remixVariant === null) {
      return toBrandPreviewTheme(brandIdentity);
    }
    const remixedColors = remixBrandColors(brandIdentity.colors, remixVariant);
    return toBrandPreviewTheme({ ...brandIdentity, colors: remixedColors });
  }, [brandIdentity, remixVariant]);
  const activeTemplate = IMAGE_TEMPLATE_DEFINITIONS[templateId];
  const activeCopy = copyByTemplate[templateId];

  const exportFileName = useMemo(
    () => `${toSlug(companyName || 'brand')}-${templateId}-16x9`,
    [companyName, templateId],
  );

  const updateField = (key: ImageTemplateFieldKey, nextValue: string) => {
    setCopyByTemplate((current) => ({
      ...current,
      [templateId]: {
        ...current[templateId],
        [key]: limitImageCopyFieldValue(templateId, key, nextValue),
      },
    }));
  };

  const runGenerate = useCallback(() => {
    setError(null);
    setFeedback(null);

    startGenerationTransition(async () => {
      const result = await generateImageTemplateCopy({
        templateId,
        direction,
        sourceTweet,
        existingCopy: activeCopy,
      });

      if (!result.success || !result.data) {
        setError(result.error ?? 'Unable to generate copy right now.');
        return;
      }

      setCopyByTemplate((current) => ({
        ...current,
        [result.data!.templateId]: result.data!.copy,
      }));
      setFeedback('Generated fresh tweet and image copy from your current brand context.');
    });
  }, [activeCopy, direction, sourceTweet, startGenerationTransition, templateId]);

  const handleGenerate = () => {
    runGenerate();
  };

  useEffect(() => {
    if (autoGenerateNonce === undefined || autoGenerateNonce === lastAutoGenerateNonceRef.current) {
      return;
    }

    lastAutoGenerateNonceRef.current = autoGenerateNonce;
    const timeout = window.setTimeout(() => {
      runGenerate();
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [autoGenerateNonce, runGenerate]);

  const handleExport = async () => {
    setError(null);
    setFeedback(null);
    const node = exportRef.current;

    if (!node) {
      setError('Unable to find the template preview to export.');
      return;
    }

    setIsExporting(true);

    try {
      const dataUrl = await toPng(node, {
        backgroundColor: previewTheme.background,
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `${exportFileName}.png`;
      link.href = dataUrl;
      link.click();
      setFeedback('Exported 16:9 PNG from the current template preview.');
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : 'Unable to export the current template preview.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleRemixColors = () => {
    startRemixTransition(() => {
      setRemixVariant((current) => {
        if (current === null) {
          return 1;
        }
        if (current >= 5) {
          return null;
        }
        return current + 1;
      });
    });
  };

  return (
    <div
      className={cn(
        'mx-auto space-y-6',
        embedded ? 'max-w-none px-0 pb-0 pt-0' : 'max-w-355 px-4 pb-10 pt-4 sm:px-6 lg:px-8',
      )}
    >
      <header className="space-y-3">
        <h1
          className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-4xl"
        // style={{ fontFamily: '"DM Serif Display", "Georgia", serif' }}
        >
          Image Studio

        </h1>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Generate post-ready visuals with your brand voice and palette
        </p>
        {sourceTweet ? (
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Source Post
            </p>
            <p className="mt-2 whitespace-pre-line text-sm text-foreground">{sourceTweet}</p>
          </div>
        ) : null}
      </header>

      <Frame>
        <FrameHeader className="gap-4 flex-row justify-between border-b border-border/60 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <FrameTitle className="text-base">Template Workbench</FrameTitle>
              {/* <FrameDescription>
                Brand source: {companyName}
                {sourceDomain ? ` (${sourceDomain})` : ''}
              </FrameDescription> */}
              <div className="flex flex-wrap items-center gap-2">
                {brandIdentity.colors.length > 0 ? (
                  brandIdentity.colors.slice(0, 5).map((color) => (
                    <Badge key={color} variant="outline" className="rounded-full px-2.5 py-1">
                      <span
                        className="mr-1.5 inline-block size-2.5 rounded-full border border-black/15"
                        style={{ backgroundColor: color }}
                      />
                      {color}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline">No brand colors detected yet</Badge>
                )}
              </div>
            </div>


          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <ArrowClockwise className="size-4 animate-spin" />
                  Generating
                </>
              ) : (
                <>
                  <MagicWand className="size-4" />
                  Generate Tweet + Image Copy
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleRemixColors}
              disabled={isRemixing}
            >
              {isRemixing ? (
                <>
                  <ArrowClockwise className="size-4 animate-spin" />
                  remixing colors 
                </>
              ) : (
                <>
                  <SwatchesIcon  className="size-4" />
                  Remix Colors
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <ArrowClockwise className="size-4 animate-spin" />
                  {/* Exporting PNG */}
                </>
              ) : (
                <>
                  <DownloadSimple className="size-4" />
                  {/* Export 16:9 PNG */}
                </>
              )}
            </Button>
          </div>
        </FrameHeader>

        <FramePanel className="p-4 sm:p-5">
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-4">
              <Tabs
                value={templateId}
                onValueChange={(value) => {
                  if (isImageTemplateId(value)) {
                    setTemplateId(value);
                    setFeedback(null);
                    setError(null);
                  }
                }}
              >
                <TabsList>
                  {IMAGE_TEMPLATE_IDS.map((id) => (
                    <TabsTrigger key={id} value={id} className="gap-2">
                      <ImageSquare className="size-4" />
                      {IMAGE_TEMPLATE_DEFINITIONS[id].name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="overflow-hidden rounded-[26px] border border-border/60 bg-muted/40 p-2.5">
                <AspectRatio ratio={16 / 9}>
                  <div ref={exportRef} className="h-full w-full">
                    {templateId === 'template-1' ? (
                      <ImageTemplateOnePreview
                        copy={activeCopy}
                        companyName={companyName}
                        theme={previewTheme}
                      />
                    ) : (
                      <ImageTemplateTwoPreview
                        copy={activeCopy}
                        companyName={companyName}
                        theme={previewTheme}
                      />
                    )}
                  </div>
                </AspectRatio>
              </div>

              {feedback ? (
                <p className="rounded-lg border border-emerald-300/70 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {feedback}
                </p>
              ) : null}

              {error ? (
                <p className="inline-flex items-center gap-2 rounded-lg border border-rose-300/80 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  <WarningCircle className="size-4" weight="fill" />
                  {error}
                </p>
              ) : null}
            </section>

            <section className="space-y-5">
              {/* <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="template-direction">
                  Creative Direction (Optional)
                </label>
                <Textarea
                  id="template-direction"
                  value={direction}
                  onChange={(event) => setDirection(event.target.value)}
                  placeholder="Example: Make this feel more premium and data-backed for founders."
                  textareaClassName="min-h-20"
                />
                <p className="text-xs text-muted-foreground">
                  Add style or angle constraints before generation.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-semibold text-foreground" htmlFor="tweet-output">
                    Tweet Copy
                  </label>
                  <span
                    className={cn(
                      'text-xs font-medium text-muted-foreground',
                      tweet.length > IMAGE_TWEET_CHARACTER_LIMIT - 25 ? 'text-amber-600' : '',
                    )}
                  >
                    {tweet.length}/{IMAGE_TWEET_CHARACTER_LIMIT}
                  </span>
                </div>
                <Textarea
                  id="tweet-output"
                  value={tweet}
                  onChange={(event) => setTweet(trimTweetToLimit(event.target.value))}
                  placeholder="Generated tweet will appear here."
                  textareaClassName="min-h-28 whitespace-pre-line"
                />
              </div> */}

              <div className="space-y-4 rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">Template Text Layers</h3>
                  <p className="text-xs text-muted-foreground">{activeTemplate.description}</p>
                </div>

                <div className="space-y-3">
                  {activeTemplate.fields.map((field) => {
                    const value = activeCopy[field.key] ?? '';

                    return (
                      <label key={field.key} className="block space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            {field.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {value.length}/{field.maxChars}
                          </span>
                        </div>

                        {field.multiline ? (
                          <Textarea
                            value={value}
                            onChange={(event) => updateField(field.key, event.target.value)}
                            textareaClassName="min-h-18 whitespace-pre-line"
                            placeholder={field.helper}
                          />
                        ) : (
                          <Input
                            value={value}
                            onChange={(event) => updateField(field.key, event.target.value)}
                            placeholder={field.helper}
                            nativeInput
                          />
                        )}

                        <p className="text-[11px] text-muted-foreground">
                          {renderFieldDescription(field.maxChars, field.optional)}. {field.helper}
                        </p>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className=" flex  items-center  gap-2">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <LinkSimple className="size-3.5" />
                  Source URL
                </p>
                <p className="mt-1 text-xs text-foreground">
                  {initialWebsiteUrl || 'No website connected yet.'}
                </p>
              </div>
            </section>
          </div>
        </FramePanel>
      </Frame>
    </div>
  );
}
