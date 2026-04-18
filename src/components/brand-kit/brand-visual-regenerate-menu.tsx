'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Globe,
  Loader2,
  MoreHorizontal,
  Palette,
  Sparkles,
  WandSparkles,
} from 'lucide-react';

import { regenerateBrandVisualIdentity } from '@/actions/brand-visuals';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type BrandVisualRegenerateMenuProps = {
  defaultWebsiteUrl?: string;
  currentColors?: string[];
};

function MagicalRegenerationSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-200/70 bg-linear-to-br from-sky-50 via-violet-50 to-pink-50 p-4">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-fuchsia-300/30 blur-2xl" />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-sky-300/30 blur-2xl" />

      <div className="relative space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-2xl bg-linear-to-br from-violet-200/70 via-sky-200/70 to-pink-200/70" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40 rounded-full bg-white/80" />
            <Skeleton className="h-3 w-56 rounded-full bg-white/70" />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-12 rounded-xl bg-linear-to-br from-violet-200/70 via-blue-200/70 to-rose-200/70"
            />
          ))}
        </div>

        <div className="space-y-2">
          <Skeleton className="h-3 w-full rounded-full bg-white/75" />
          <Skeleton className="h-3 w-4/5 rounded-full bg-white/70" />
        </div>
      </div>
    </div>
  );
}

export function BrandVisualRegenerateMenu({
  defaultWebsiteUrl,
  currentColors,
}: BrandVisualRegenerateMenuProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState(defaultWebsiteUrl ?? '');
  const [detectedColors, setDetectedColors] = useState<string[]>(currentColors ?? []);
  const [lastDomain, setLastDomain] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSuccess, setHasSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleRegenerate = () => {
    const nextUrl = websiteUrl.trim();

    if (!nextUrl) {
      setError('Please enter a website URL first.');
      return;
    }

    setError(null);
    setHasSuccess(false);

    startTransition(async () => {
      const result = await regenerateBrandVisualIdentity({
        websiteUrl: nextUrl,
      });

      if (!result.success) {
        setError(result.error ?? 'Unable to regenerate brand visuals right now.');
        return;
      }

      setDetectedColors(result.brandIdentity?.colors ?? []);
      setLastDomain(result.source?.domain ?? null);
      setHasSuccess(true);
      router.refresh();
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="Brand visual options"
            className="rounded-full"
            size="icon"
            type="button"
            variant="outline"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setDialogOpen(true);
            }}
          >
            <WandSparkles className="size-4" />
            Regenerate brand visuals
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-violet-500" />
              Regenerate Brand Identity
            </DialogTitle>
            <DialogDescription>
              Paste a website URL and we will crawl branding signals only (logo, palette, metadata),
              then save the refreshed visual identity.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 pb-2">
            <div className="space-y-2">
              <Label htmlFor="brand-visual-url">Website URL</Label>
              <Input
                id="brand-visual-url"
                onChange={(event) => setWebsiteUrl(event.target.value)}
                placeholder="https://yourbrand.com"
                type="url"
                value={websiteUrl}
              />
              <p className="text-xs text-muted-foreground">
                Content body is skipped in this flow. We only pull branding identity fields.
              </p>
            </div>

            {isPending ? <MagicalRegenerationSkeleton /> : null}

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {hasSuccess && !isPending ? (
              <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                <p className="text-sm font-medium text-emerald-800">
                  Brand visuals regenerated{lastDomain ? ` for ${lastDomain}` : ''}.
                </p>
                <div className="flex flex-wrap gap-2">
                  {detectedColors.length > 0 ? (
                    detectedColors.map((color) => (
                      <div
                        key={color}
                        className="inline-flex items-center gap-2 rounded-full border bg-white px-2 py-1"
                      >
                        <span
                          className={cn('size-3 rounded-full border border-black/10')}
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-medium text-slate-700">{color}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-emerald-700">No strong palette detected from that URL.</p>
                  )}
                </div>
              </div>
            ) : null}

            {!hasSuccess && !isPending && detectedColors.length > 0 ? (
              <div className="space-y-2 rounded-xl border border-border/40 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Current detected colors
                </p>
                <div className="flex flex-wrap gap-2">
                  {detectedColors.map((color) => (
                    <div
                      key={color}
                      className="inline-flex items-center gap-2 rounded-full border bg-white px-2 py-1"
                    >
                      <span
                        className={cn('size-3 rounded-full border border-black/10')}
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-medium text-slate-700">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
            <Button type="button" disabled={isPending} onClick={handleRegenerate}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Globe className="size-4" />}
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
