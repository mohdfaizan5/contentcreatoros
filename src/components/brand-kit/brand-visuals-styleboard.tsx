'use client';

import { useEffect, useMemo, useState, useTransition, type CSSProperties, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { SiLeaflet } from 'react-icons/si';
import { saveBrandVisualThemeColors } from '@/actions/brand-visuals';
import { BrandVisualRegenerateMenu } from '@/components/brand-kit/brand-visual-regenerate-menu';
import { Button } from '@/components/ui/button';
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerEyeDropper,
  ColorPickerHueSlider,
  ColorPickerInput,
  ColorPickerTrigger,
} from '@/components/ui/color-picker';
import {
  getContrastTokens,
  normalizeHex,
  pickReadableText,
  resolvePaletteFromColors,
} from '@/lib/brand-visual-theme';
import { hexToRgba, type BrandVisualIdentity } from '@/lib/brand-visuals';
import { cn } from '@/lib/utils';

const LAUREL_LEAVES = [
  { inward: 30, rotate: -30, top: 14 },
  { inward: 36, rotate: -16, top: 32 },
  { inward: 43, rotate: -2, top: 50 },
  { inward: 52, rotate: 12, top: 68 },
] as const;

const COLOR_ROLE_LABELS = ['Link', 'Accent', 'Primary', 'Background', 'Text Primary'] as const;

type BrandVisualsStyleboardProps = {
  identity: BrandVisualIdentity;
  defaultWebsiteUrl: string;
};

function areColorSetsEqual(left: readonly string[], right: readonly string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => normalizeHex(value) === normalizeHex(right[index] ?? ''));
}

export function BrandVisualsStyleboard({
  identity,
  defaultWebsiteUrl,
}: BrandVisualsStyleboardProps) {
  const displayName = identity.companyName || identity.sourceDomain || 'Brand';
  const logoUrl = identity.logoUrl || null;

  const initialSwatches = useMemo(
    () => [...resolvePaletteFromColors(identity.colors, displayName).swatches],
    [displayName, identity.colors],
  );

  const [editableColors, setEditableColors] = useState<string[]>(initialSwatches);
  const [savedColors, setSavedColors] = useState<string[]>(initialSwatches);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setEditableColors(initialSwatches);
    setSavedColors(initialSwatches);
    setSaveError(null);
  }, [initialSwatches]);

  const theme = useMemo(
    () => resolvePaletteFromColors(editableColors, displayName),
    [displayName, editableColors],
  );

  const contrastTokens = useMemo(() => getContrastTokens(theme), [theme]);

  const hasUnsavedThemeChanges = useMemo(
    () => !areColorSetsEqual(editableColors, savedColors),
    [editableColors, savedColors],
  );

  const handleColorChange = (index: number, nextColor: string) => {
    setSaveError(null);

    setEditableColors((current) =>
      current.map((color, currentIndex) =>
        currentIndex === index ? normalizeHex(nextColor) : color,
      ),
    );
  };

  const handleResetTheme = () => {
    setSaveError(null);
    setEditableColors(savedColors);
  };

  const handleSaveTheme = () => {
    const colorsToSave = [...editableColors].map((color) => normalizeHex(color));
    setSaveError(null);

    startTransition(async () => {
      const result = await saveBrandVisualThemeColors({
        colors: colorsToSave,
      });

      if (!result.success) {
        setSaveError(result.error ?? 'Unable to save your theme right now.');
        return;
      }

      const nextSavedColors = [...resolvePaletteFromColors(result.colors ?? colorsToSave, displayName).swatches];
      setEditableColors(nextSavedColors);
      setSavedColors(nextSavedColors);
    });
  };

  return (
    <div className="mx-auto max-w-310 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground/80">
            Active theme from onboarding profile:{' '}
            <span className="text-foreground">{theme.name}</span>
          </p>
          {saveError ? (
            <p className="mt-1 text-xs font-medium text-destructive">{saveError}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {hasUnsavedThemeChanges ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleResetTheme}
                disabled={isPending}
              >
                Reset
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveTheme}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Save theme
              </Button>
            </>
          ) : null}

          <BrandVisualRegenerateMenu
            defaultWebsiteUrl={defaultWebsiteUrl}
            currentColors={theme.swatches}
          />
        </div>
      </div>

      <div
        className="relative isolate overflow-hidden rounded-[28px] border p-3 sm:p-4 lg:p-6"
        style={{
          backgroundColor: theme.background,
          borderColor: hexToRgba(theme.foreground, 0.2),
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(1200px 480px at 50% -10%, ${hexToRgba(theme.secondary, 0.4)}, transparent 70%)`,
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-[80%] -translate-x-1/2 rounded-full blur-3xl"
          style={{ backgroundColor: hexToRgba(theme.primary, 0.18) }}
        />

        <div className="relative  z-20 mb-10 grid gap-3 lg:grid-cols-12 lg:gap-4">
          <Panel
            className="animate-fade-in-up  lg:col-span-3"
            style={{
              backgroundColor: theme.surface,
              color: theme.surfaceText,
              borderColor: hexToRgba(theme.foreground, 0.2),
            }}
          >
            <div className="space-y-3 p-3 sm:p-3.5 grid grid-rows-3">
              <div
                className="rounded-[14px] px-4 py-3 text-xl font-medium sm:text-2xl row-span-1"
                style={{
                  backgroundColor: theme.swatches[3],
                  color: contrastTokens.brandTitleText,
                }}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={`${displayName} logo`}
                      className="h-9 w-9 rounded-full bg-white/70 object-contain p-1 sm:h-12 sm:w-12"
                      loading="lazy"
                    />
                  ) : (
                    <span
                      className="inline-block h-5 w-5 rounded-full align-middle sm:h-6 sm:w-6"
                      style={{ backgroundColor: theme.primary }}
                    />
                  )}
                  <span className="truncate text-">
                    {displayName.includes('-')
                      ? displayName.split('-')[0].trim()
                      : displayName.includes('—')
                        ? displayName.split('—')[0].trim()
                        : displayName}
                  </span>
                </div>
              </div>

              <div
                className="rounded-[14px] p-3 h-full max-h-32  row-span-2"
                style={{
                  color: contrastTokens.primaryCardText,
                  backgroundColor: theme.primary,
                }}
              >
                <p
                  className="text-xs uppercase tracking-wide"
                  style={{ color: contrastTokens.shipmentsTitleText }}
                >
                  Shipments Delivered
                </p>
                <p
                  className="mt-2 text-4xl font-semibold leading-none"
                  style={{ color: contrastTokens.shipmentsValueText }}
                >
                  20k+
                </p>
              </div>
            </div>
          </Panel>

          <Panel
            className="animate-fade-in-up animation-delay-200 lg:col-span-4"
            style={{
              backgroundColor: theme.surface,
              color: theme.surfaceText,
              borderColor: hexToRgba(theme.foreground, 0.2),
            }}
          >
            <div className="space-y-3 p-3 sm:p-3.5">
              <div
                className="rounded-2xl p-4"
                style={{ backgroundColor: theme.secondary, color: contrastTokens.secondaryCardText }}
              >
                <div className="flex items-start justify-between gap-3">
                  <p
                    className="mt-1 text-[10px] uppercase tracking-[0.14em]"
                    style={{ color: contrastTokens.fontFamilyTitleText }}
                  >
                    Font Family
                  </p>
                </div>
                <p
                  className="mt-4 text-[11px] uppercase tracking-[0.12em]"
                  style={{ color: contrastTokens.fontFamilyCapsLineText }}
                >
                  The brown fox jumps over the lazy dog cursive
                </p>
                <p
                  className="mt-1 text-sm"
                  style={{ color: contrastTokens.fontFamilyBodyLineText }}
                >
                  The brown fox jumps over the lazy dog cursive
                </p>
              </div>

              <div
                className="grid grid-cols-5 gap-1 rounded-2xl p-2"
                style={{ backgroundColor: theme.primary }}
              >
                {theme.swatches.map((color, index) => (
                  <ColorPicker
                    key={`swatch-${index}-${color}`}
                    value={editableColors[index] ?? color}
                    onValueChange={(value) => handleColorChange(index, value)}
                  >
                    <ColorPickerTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Edit ${COLOR_ROLE_LABELS[index] ?? `Color ${index + 1}`} color`}
                        className="h-16 w-full rounded-xl border border-white/20 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] transition hover:scale-[1.01]"
                        style={{ backgroundColor: editableColors[index] ?? color }}
                      />
                    </ColorPickerTrigger>
                    <ColorPickerContent side="top" align="center" sideOffset={10} className="w-72">
                      <ColorPickerArea />
                      <div className="flex items-center gap-2">
                        <ColorPickerEyeDropper size="icon" />
                        <ColorPickerInput withoutAlpha className="flex-1" />
                      </div>
                      <ColorPickerHueSlider />
                    </ColorPickerContent>
                  </ColorPicker>
                ))}
              </div>
            </div>
          </Panel>

          <Panel
            className="animate-fade-in-up animation-delay-400 lg:col-span-5"
            style={{
              backgroundColor: theme.surface,
              color: theme.surfaceText,
              borderColor: hexToRgba(theme.foreground, 0.2),
            }}
          >
            <div className="grid gap-2 p-3  sm:p-3.5">
              <div
                className="relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 sm:min-h-55"
                style={{
                  background: `linear-gradient(135deg, ${theme.secondary}, ${theme.swatches[4]})`,
                  color: contrastTokens.heroText,
                }}
              >
                <p
                  className="max-w-70 text-3xl leading-[1.1]"
                  style={{ color: contrastTokens.heroMutedText }}
                >
                  <span className="font-semibold " style={{ color: contrastTokens.heroText }}>
                    {displayName ? (
                      <span>
                        {displayName.split('—')[0]}{' '}
                        <span className="block  font-normal opacity-90 text-xl">
                          {displayName.split('—')[1]}
                        </span>
                      </span>
                    ) : (
                      'Visual identity in a collage board style preview.'
                    )}
                  </span>{' '}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className="rounded-full px-3 py-1.5 font-medium"
                    style={{
                      backgroundColor: theme.foreground,
                      color: pickReadableText(theme.foreground, theme.background),
                    }}
                  >
                    Download Now
                  </span>
                  <span
                    className="rounded-full border px-2.5 py-1.5"
                    style={{ borderColor: hexToRgba(theme.textOnSecondary, 0.35) }}
                  >
                    Play
                  </span>
                  <span
                    className="rounded-full border px-2.5 py-1.5"
                    style={{ borderColor: hexToRgba(theme.textOnSecondary, 0.35) }}
                  >
                    App
                  </span>
                </div>
                <div
                  className="absolute -bottom-12 right-0 h-36 w-56 rounded-full blur-2xl"
                  style={{ backgroundColor: hexToRgba(theme.swatches[3], 0.5) }}
                />
                <div
                  className="absolute bottom-0 right-2 h-32 w-44 rounded-t-[100px]"
                  style={{ background: `linear-gradient(170deg, ${theme.swatches[3]}, ${theme.secondary})` }}
                />
              </div>
            </div>
          </Panel>
        </div>

        <div
          className="relative z-10 mt-6 rounded-[26px] border p-3 shadow-[0_35px_90px_-60px_rgba(0,0,0,0.9)] sm:p-4 lg:-mt-6 lg:p-5"
          style={{
            backgroundColor: hexToRgba(theme.background, 0.95),
            borderColor: hexToRgba(theme.foreground, 0.12),
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Panel
              className="animate-fade-in-up animation-delay-600 text-white"
              style={{
                borderColor: hexToRgba(theme.foreground, 0.08),
                backgroundColor: theme.surface,
                color: theme.surfaceText,
              }}
            >
              <div className="p-5">
                <p
                  className="text-6xl font-semibold leading-none"
                  style={{ color: contrastTokens.statAccentText }}
                >
                  140
                </p>
                <p className="mt-3 max-w-55 text-3xl leading-[1.05]" style={{ color: theme.surfaceText }}>
                  Finely-crafted app icons
                </p>
              </div>
            </Panel>

            <Panel
              className="animate-fade-in-up animation-delay-1000 text-white"
              style={{
                borderColor: hexToRgba(theme.foreground, 0.08),
                backgroundColor: theme.surface,
                color: theme.surfaceText,
              }}
            >
              <div className="p-5">
                <div className="mb-5 flex gap-1.5">
                  {[theme.background, theme.secondary, theme.primary, theme.foreground].map((color, index) => (
                    <div
                      key={`theme-chip-${index}-${color}`}
                      className="flex h-9 w-10 items-center justify-center rounded-[10px]"
                      style={{ backgroundColor: color }}
                    >
                      <span
                        className="text-xs"
                        style={{ color: pickReadableText(color, theme.surfaceText) }}
                      >
                        &#9825;
                      </span>
                    </div>
                  ))}
                </div>
                <p className="max-w-62.5 text-4xl leading-[1.05]" style={{ color: theme.surfaceText }}>
                  4 aesthetic color themes
                </p>
              </div>
            </Panel>

            <Panel
              className="animate-fade-in-up animation-delay-2000 text-white sm:col-span-2"
              style={{
                borderColor: hexToRgba(theme.foreground, 0.08),
                backgroundColor: theme.surface,
                color: theme.surfaceText,
              }}
            >
              <div className="relative overflow-hidden p-6 text-center sm:p-7">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(560px_180px_at_50%_110%,rgba(255,255,255,0.08),transparent_80%)]" />
                <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 sm:block" aria-hidden="true">
                  {LAUREL_LEAVES.map((leaf) => (
                    <span
                      key={`left-${leaf.top}-${leaf.inward}`}
                      className="absolute opacity-50"
                      style={{
                        color: hexToRgba(theme.foreground, 0.45),
                        left: `${leaf.inward}%`,
                        top: `${leaf.top}%`,
                        transform: `translate(-50%, -50%) rotate(${leaf.rotate}deg)`,
                      }}
                    >
                      <SiLeaflet className="h-10 w-10" />
                    </span>
                  ))}
                </div>

                <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-24 sm:block" aria-hidden="true">
                  {LAUREL_LEAVES.map((leaf) => (
                    <span
                      key={`right-${leaf.top}-${leaf.inward}`}
                      className="absolute opacity-50"
                      style={{
                        color: hexToRgba(theme.foreground, 0.45),
                        left: `${100 - leaf.inward}%`,
                        top: `${leaf.top}%`,
                        transform: `translate(-50%, -50%) rotate(${-leaf.rotate}deg)`,
                      }}
                    >
                      <SiLeaflet className="h-10 w-10" />
                    </span>
                  ))}
                </div>

                <div className="relative z-10">
                  <p className="text-lg tracking-[0.4em]" style={{ color: contrastTokens.statAccentText }}>
                    *****
                  </p>
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={`${displayName} logo`}
                      className="mx-auto mt-2 h-14 w-auto max-w-48 rounded-xl bg-white/90 object-contain px-2 py-1"
                      loading="lazy"
                    />
                  ) : (
                    <p className="mt-2 text-5xl font-semibold tracking-tight">{displayName}</p>
                  )}
                  <p className="mt-2 text-3xl" style={{ color: contrastTokens.surfaceMutedText }}>
                    400+ 5 star reviews
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-[22px] border shadow-[0_20px_55px_-30px_rgba(0,0,0,0.55)]',
        className,
      )}
      style={style}
    >
      {children}
    </section>
  );
}
