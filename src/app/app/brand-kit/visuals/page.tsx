import type { CSSProperties, ReactNode } from 'react';
import type { Metadata } from 'next';
import ColorContrastChecker from 'color-contrast-checker';
import BrandKitShell from '@/components/settings/brand-kit-shell';
import { getBrandKitPageData } from '@/lib/brand-kit-page-data';
import { buildBrandVisualIdentity, type BrandVisualIdentity } from '@/lib/brand-visuals';
import { cn } from '@/lib/utils';
import { SiLeaflet } from 'react-icons/si';

export const metadata: Metadata = {
  title: 'Brand Visuals | ContentOSX',
  description: 'Visual styleboard for icon, palette, and promo directions.',
};

type VisualPalette = {
  name: string;
  primary: string;
  background: string;
  foreground: string;
  secondary?: string;
  swatches?: string[];
};

type ResolvedPalette = {
  name: string;
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  swatches: [string, string, string, string, string];
  surface: string;
  surfaceText: string;
  mutedSurfaceText: string;
  textOnPrimary: string;
  textOnSecondary: string;
};

const LAUREL_LEAVES = [
  { inward: 30, rotate: -30, top: 14 },
  { inward: 36, rotate: -16, top: 32 },
  { inward: 43, rotate: -2, top: 50 },
  { inward: 52, rotate: 12, top: 68 },
] as const;

const contrastChecker = new ColorContrastChecker();

function toVisualPalette(identity: BrandVisualIdentity): VisualPalette {
  const [link, accent, primary, background, textPrimary] = identity.colors;

  const resolvedPrimary = primary ?? link ?? '#2722CE';
  const resolvedSecondary = accent ?? link ?? resolvedPrimary;
  const resolvedBackground = background ?? '#F2F2F0';
  const resolvedForeground = textPrimary ?? '#131211';

  return {
    name: identity.companyName || identity.sourceDomain || 'Brand',
    primary: resolvedPrimary,
    secondary: resolvedSecondary,
    background: resolvedBackground,
    foreground: resolvedForeground,
    swatches: [
      link ?? resolvedPrimary,
      accent ?? resolvedSecondary,
      resolvedPrimary,
      resolvedBackground,
      resolvedForeground,
    ],
  };
}

export default async function BrandVisualsPage() {
  const { answeredCount, brandIdentity, totalQuestionCount } = await getBrandKitPageData();
  const identity = buildBrandVisualIdentity(brandIdentity);
  const theme = resolvePalette(toVisualPalette(identity));
  const contrastTokens = getContrastTokens(theme);
  const displayName = identity.companyName || identity.sourceDomain || theme.name;
  const logoUrl = identity.logoUrl || null;
  const fallbackImageUrl = identity.ogImageUrl || identity.logoUrl || null;

  return (
    <BrandKitShell answeredCount={answeredCount} totalQuestionCount={totalQuestionCount}>
      <div className="mx-auto max-w-310 space-y-5">
        {/* <header className="animate-fade-in-up space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Brand Kit
          </p>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Visual Direction Board</h1>
            <p className="max-w-140 text-sm leading-6 text-muted-foreground sm:text-base">
              A collage-inspired preview that mirrors your reference layout: product snapshots, palette
              studies, app icon language, and dark premium proof cards.
            </p>
          </div>
          <p className="text-xs font-medium text-muted-foreground/80">
            Active theme from onboarding profile:{' '}
            <span className="text-foreground">{theme.name}</span>
          </p>
        </header> */}

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
                    <span className="truncate text-">{displayName.split('—')[0].trim()}</span>
                  </div>
                </div>

                {/* <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-[12px] bg-[#12161f] p-2 text-[10px] text-slate-300 sm:text-[11px]">
                    <div className="mb-2 text-slate-100">Tracking History</div>
                    <div className="rounded-lg bg-[#1e2432] p-2">
                      <div className="h-8 w-full rounded bg-[linear-gradient(120deg,#1f2937,#334155)]" />
                      <div className="mt-2 h-1.5 w-4/5 rounded-full bg-orange-500/80" />
                    </div>
                  </div>
                  <div
                    className="rounded-[12px] p-2"
                    style={{
                      background: `linear-gradient(145deg, ${theme.swatches[1]}, ${theme.primary})`,
                    }}
                  >
                    {fallbackImageUrl ? (
                      <img
                        src={fallbackImageUrl}
                        alt={`${displayName} preview`}
                        className="h-full w-full rounded-[10px] border border-white/50 bg-white/25 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full rounded-[10px] border border-white/50 bg-white/25" />
                    )}
                  </div>
                </div> */}

                <div
                  className="rounded-[14px] p-3 h-full max-h-32  row-span-2"
                  style={{
                    // background: ` ${theme.swatches[0]}, ${theme.swatches[2]})`,
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
                    {/* <p className="text-4xl font-semibold leading-none">Geist</p> */}
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
                  {theme.swatches.map((color) => (
                    <div key={color} className="h-16 rounded-xl" style={{ backgroundColor: color }} />
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
                  className="relative overflow-hidden rounded-2xl p-4 sm:min-h-55"
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
                      {displayName ? <span>{displayName.split('—')[0]} <span className='block  font-normal opacity-75'>{displayName.split('—')[1]}</span></span> : 'Visual identity in a collage board style preview.'}
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

                {/* <div className="space-y-2">
                  <div
                    className="flex h-24 items-center justify-center overflow-hidden rounded-2xl text-3xl font-semibold"
                    style={{ backgroundColor: theme.primary, color: theme.textOnPrimary }}
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={`${displayName} logo`}
                        className="h-16 w-16 rounded-2xl bg-white/80 object-contain p-1"
                        loading="lazy"
                      />
                    ) : (
                      <span className="truncate px-3 lowercase">{displayName}</span>
                    )}
                  </div>
                  <div
                    className="relative flex h-34.5 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: blendHex(theme.background, '#0B131F', 0.75) }}
                  >
                    <div className="h-30.5 w-17.5 rounded-[20px] border border-slate-500/60 bg-slate-900 shadow-inner" />
                    <div className="absolute top-8 grid grid-cols-3 gap-1.5">
                      {Array.from({ length: 9 }).map((_, index) => (
                        <span
                          key={index}
                          className="h-2.5 w-2.5 rounded-lg"
                          style={{ backgroundColor: hexToRgba(theme.foreground, 0.65) }}
                        />
                      ))}
                    </div>
                  </div>
                </div> */}
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
                    {[theme.background, theme.secondary, theme.primary, theme.foreground].map((color) => (
                      <div
                        key={color}
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
    </BrandKitShell>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHex(hex: string) {
  const trimmed = hex.trim();

  if (!trimmed.startsWith('#')) {
    return '#000000';
  }

  const raw = trimmed.slice(1);

  if (raw.length === 3) {
    return `#${raw
      .split('')
      .map((char) => `${char}${char}`)
      .join('')}`.toUpperCase();
  }

  if (raw.length !== 6) {
    return '#000000';
  }

  return `#${raw}`.toUpperCase();
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex).slice(1);

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase();
}

function blendHex(from: string, to: string, amount: number) {
  const ratio = clamp(amount, 0, 1);
  const start = hexToRgb(from);
  const end = hexToRgb(to);

  return rgbToHex(
    start.r + (end.r - start.r) * ratio,
    start.g + (end.g - start.g) * ratio,
    start.b + (end.b - start.b) * ratio,
  );
}

function channelToLinear(channel: number) {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);

  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

function getContrastRatio(foreground: string, background: string) {
  const fgLuminance = getRelativeLuminance(foreground);
  const bgLuminance = getRelativeLuminance(background);
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function hasContrast(foreground: string, background: string, targetRatio = 4.5) {
  try {
    return contrastChecker.isLevelCustom(
      normalizeHex(foreground),
      normalizeHex(background),
      targetRatio,
    );
  } catch {
    return false;
  }
}

function ensureContrast(foreground: string, background: string, targetRatio = 4.5) {
  const bg = normalizeHex(background);
  let current = normalizeHex(foreground);

  if (hasContrast(current, bg, targetRatio)) {
    return current;
  }

  const darkTarget = '#0B0D12';
  const lightTarget = '#FFFFFF';
  const moveToward =
    getContrastRatio(darkTarget, bg) > getContrastRatio(lightTarget, bg)
      ? darkTarget
      : lightTarget;

  let bestColor = current;
  let bestRatio = getContrastRatio(current, bg);

  for (let step = 1; step <= 18; step += 1) {
    current = blendHex(current, moveToward, 0.14);
    const ratio = getContrastRatio(current, bg);

    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestColor = current;
    }

    if (hasContrast(current, bg, targetRatio)) {
      return current;
    }
  }

  return bestColor;
}

function pickReadableText(background: string, preferred: string, targetRatio = 4.5) {
  const bg = normalizeHex(background);
  const candidates = [
    ensureContrast(preferred, bg, targetRatio),
    ensureContrast('#0B0D12', bg, targetRatio),
    ensureContrast('#FFFFFF', bg, targetRatio),
  ];

  const passingCandidates = candidates.filter((candidate) =>
    hasContrast(candidate, bg, targetRatio),
  );
  const pool = passingCandidates.length > 0 ? passingCandidates : candidates;

  return pool.reduce((best, candidate) =>
    getContrastRatio(candidate, bg) > getContrastRatio(best, bg) ? candidate : best,
  );
}

function uniqueHexColors(colors: string[]) {
  return [...new Set(colors.map((color) => normalizeHex(color)))];
}

function getSaturation(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;

  if (max === 0) {
    return 0;
  }

  return (max - min) / max;
}

function isDarkNeutral(hex: string) {
  const color = normalizeHex(hex);
  return getSaturation(color) <= 0.12 && getRelativeLuminance(color) <= 0.2;
}

function isHardFallbackColor(hex: string) {
  const color = normalizeHex(hex);
  return color === '#FFFFFF' || color === '#000000' || color === '#0B0D12';
}

function isBlendFriendlyText(foreground: string, background: string) {
  const fg = normalizeHex(foreground);
  const bg = normalizeHex(background);
  const backgroundIsVivid = getSaturation(bg) >= 0.38;

  if (backgroundIsVivid && isDarkNeutral(fg)) {
    return false;
  }

  return true;
}

function getBestByContrast(background: string, colors: string[]) {
  const bg = normalizeHex(background);
  const candidates = uniqueHexColors(colors);

  return candidates.reduce((best, candidate) =>
    getContrastRatio(candidate, bg) > getContrastRatio(best, bg) ? candidate : best,
  );
}

function getBestByWorstContrast(backgrounds: string[], colors: string[]) {
  const normalizedBackgrounds = backgrounds.map((background) => normalizeHex(background));
  const candidates = uniqueHexColors(colors);

  return candidates.reduce((best, candidate) =>
    getWorstContrastRatio(candidate, normalizedBackgrounds) >
    getWorstContrastRatio(best, normalizedBackgrounds)
      ? candidate
      : best,
  );
}

function pickTextFromPalette(params: {
  background: string;
  preferred: string;
  paletteCandidates: string[];
  targetRatio?: number;
}) {
  const targetRatio = params.targetRatio ?? 4.5;
  const background = normalizeHex(params.background);
  const preferred = normalizeHex(params.preferred);
  const preferredPasses = hasContrast(preferred, background, targetRatio);

  if (preferredPasses && isBlendFriendlyText(preferred, background)) {
    return preferred;
  }

  const paletteOnlyCandidates = uniqueHexColors(params.paletteCandidates).filter(
    (candidate) => !isHardFallbackColor(candidate),
  );
  const passingPaletteCandidates = paletteOnlyCandidates.filter((candidate) =>
    hasContrast(candidate, background, targetRatio),
  );
  const blendFriendlyPaletteCandidates = passingPaletteCandidates.filter((candidate) =>
    isBlendFriendlyText(candidate, background),
  );

  if (blendFriendlyPaletteCandidates.length > 0) {
    return getBestByContrast(background, blendFriendlyPaletteCandidates);
  }

  if (passingPaletteCandidates.length > 0) {
    return getBestByContrast(background, passingPaletteCandidates);
  }

  if (preferredPasses) {
    return preferred;
  }

  const fallbackCandidates = ['#FFFFFF', '#0B0D12'];
  const passingFallback = fallbackCandidates.filter((candidate) =>
    hasContrast(candidate, background, targetRatio),
  );

  if (passingFallback.length > 0) {
    return passingFallback[0];
  }

  return getBestByContrast(background, fallbackCandidates);
}

function pickTextFromPaletteForBackgrounds(params: {
  backgrounds: string[];
  preferred: string;
  paletteCandidates: string[];
  targetRatio?: number;
}) {
  const targetRatio = params.targetRatio ?? 4.5;
  const backgrounds = params.backgrounds.map((background) => normalizeHex(background));

  if (!backgrounds.length) {
    return normalizeHex(params.preferred);
  }

  const preferred = normalizeHex(params.preferred);
  const preferredPasses = backgrounds.every((background) =>
    hasContrast(preferred, background, targetRatio),
  );

  if (
    preferredPasses &&
    backgrounds.every((background) => isBlendFriendlyText(preferred, background))
  ) {
    return preferred;
  }

  const paletteOnlyCandidates = uniqueHexColors(params.paletteCandidates).filter(
    (candidate) => !isHardFallbackColor(candidate),
  );
  const passingPaletteCandidates = paletteOnlyCandidates.filter((candidate) =>
    backgrounds.every((background) => hasContrast(candidate, background, targetRatio)),
  );
  const blendFriendlyPaletteCandidates = passingPaletteCandidates.filter((candidate) =>
    backgrounds.every((background) => isBlendFriendlyText(candidate, background)),
  );

  if (blendFriendlyPaletteCandidates.length > 0) {
    return getBestByWorstContrast(backgrounds, blendFriendlyPaletteCandidates);
  }

  if (passingPaletteCandidates.length > 0) {
    return getBestByWorstContrast(backgrounds, passingPaletteCandidates);
  }

  if (preferredPasses) {
    return preferred;
  }

  const fallbackCandidates = ['#FFFFFF', '#0B0D12'];
  const passingFallback = fallbackCandidates.filter((candidate) =>
    backgrounds.every((background) => hasContrast(candidate, background, targetRatio)),
  );

  if (passingFallback.length > 0) {
    return passingFallback[0];
  }

  return getBestByWorstContrast(backgrounds, fallbackCandidates);
}

function getWorstContrastRatio(foreground: string, backgrounds: string[]) {
  return backgrounds.reduce(
    (lowestRatio, background) => Math.min(lowestRatio, getContrastRatio(foreground, background)),
    Number.POSITIVE_INFINITY,
  );
}

function pickReadableTextForBackgrounds(
  backgrounds: string[],
  preferred: string,
  targetRatio = 4.5,
) {
  if (!backgrounds.length) {
    return normalizeHex(preferred);
  }

  const normalizedBackgrounds = backgrounds.map((background) => normalizeHex(background));
  const fallback = normalizedBackgrounds[0];
  const candidatePool = [
    normalizeHex(preferred),
    ensureContrast(preferred, fallback, targetRatio),
    ensureContrast('#0B0D12', fallback, targetRatio),
    ensureContrast('#FFFFFF', fallback, targetRatio),
  ];

  const candidates = [...new Set(candidatePool)];
  const passingCandidates = candidates.filter((candidate) =>
    normalizedBackgrounds.every((background) => hasContrast(candidate, background, targetRatio)),
  );
  const pool = passingCandidates.length > 0 ? passingCandidates : candidates;

  return pool.reduce((best, candidate) =>
    getWorstContrastRatio(candidate, normalizedBackgrounds) >
    getWorstContrastRatio(best, normalizedBackgrounds)
      ? candidate
      : best,
  );
}

function getContrastTokens(theme: ResolvedPalette) {
  const paletteCandidates = uniqueHexColors([
    ...theme.swatches,
    theme.primary,
    theme.secondary,
    theme.background,
    theme.foreground,
    theme.surface,
    theme.surfaceText,
    theme.textOnPrimary,
    theme.textOnSecondary,
  ]);

  const primaryCardText = pickTextFromPalette({
    background: theme.primary,
    preferred: theme.textOnPrimary,
    paletteCandidates,
    targetRatio: 4.5,
  });

  const secondaryCardText = pickTextFromPalette({
    background: theme.secondary,
    preferred: theme.textOnSecondary,
    paletteCandidates,
    targetRatio: 4.5,
  });

  const shipmentsValueText = pickTextFromPalette({
    background: theme.primary,
    preferred: primaryCardText,
    paletteCandidates,
    targetRatio: 4.5,
  });

  const shipmentsTitleText = pickTextFromPalette({
    background: theme.primary,
    preferred: blendHex(shipmentsValueText, theme.primary, 0.24),
    paletteCandidates,
    targetRatio: 4.5,
  });

  const fontFamilyBodyLineText = pickTextFromPalette({
    background: theme.secondary,
    preferred: secondaryCardText,
    paletteCandidates,
    targetRatio: 4.5,
  });

  const fontFamilyTitleText = pickTextFromPalette({
    background: theme.secondary,
    preferred: blendHex(fontFamilyBodyLineText, theme.secondary, 0.2),
    paletteCandidates,
    targetRatio: 4.5,
  });

  const fontFamilyCapsLineText = pickTextFromPalette({
    background: theme.secondary,
    preferred: blendHex(fontFamilyBodyLineText, theme.secondary, 0.16),
    paletteCandidates,
    targetRatio: 4.5,
  });

  const heroText = pickTextFromPaletteForBackgrounds({
    backgrounds: [theme.secondary, theme.swatches[4]],
    preferred: secondaryCardText,
    paletteCandidates,
    targetRatio: 4.5,
  });

  return {
    brandTitleText: pickTextFromPalette({
      background: theme.swatches[3],
      preferred: theme.surfaceText,
      paletteCandidates,
      targetRatio: 4.5,
    }),
    primaryCardText: shipmentsValueText,
    primaryCardLabelText: shipmentsTitleText,
    secondaryCardText: fontFamilyBodyLineText,
    secondaryCardLabelText: fontFamilyTitleText,
    shipmentsTitleText,
    shipmentsValueText,
    fontFamilyTitleText,
    fontFamilyCapsLineText,
    fontFamilyBodyLineText,
    heroText,
    heroMutedText: pickTextFromPaletteForBackgrounds({
      backgrounds: [theme.secondary, theme.swatches[4]],
      preferred: blendHex(heroText, theme.secondary, 0.2),
      paletteCandidates,
      targetRatio: 4.5,
    }),
    statAccentText: pickTextFromPalette({
      background: theme.surface,
      preferred: theme.primary,
      paletteCandidates,
      targetRatio: 4.5,
    }),
    surfaceMutedText: pickTextFromPalette({
      background: theme.surface,
      preferred: blendHex(theme.surfaceText, theme.surface, 0.35),
      paletteCandidates,
      targetRatio: 4.5,
    }),
  };
}

function buildSwatches(
  palette: VisualPalette,
  primary: string,
  secondary: string,
  background: string,
  foreground: string,
): [string, string, string, string, string] {
  const provided = (palette.swatches ?? []).map((color) => normalizeHex(color)).slice(0, 5);
  const generated = [
    primary,
    secondary,
    blendHex(primary, foreground, 0.24),
    blendHex(background, foreground, 0.32),
    blendHex(secondary, background, 0.38),
  ];

  const merged = [...provided];

  for (const color of generated) {
    if (merged.length >= 5) {
      break;
    }

    merged.push(color);
  }

  while (merged.length < 5) {
    merged.push(blendHex(merged[merged.length - 1] ?? primary, foreground, 0.3));
  }

  return [merged[0], merged[1], merged[2], merged[3], merged[4]];
}

function resolvePalette(palette: VisualPalette): ResolvedPalette {
  const background = normalizeHex(palette.background);
  const foreground = ensureContrast(palette.foreground, background, 4.5);
  const primary = normalizeHex(palette.primary);
  const secondarySeed = palette.secondary
    ? normalizeHex(palette.secondary)
    : blendHex(primary, foreground, 0.35);
  const secondary = ensureContrast(secondarySeed, background, 2.6);
  const swatches = buildSwatches(palette, primary, secondary, background, foreground);
  const surface =
    getRelativeLuminance(background) < 0.35
      ? blendHex(background, '#FFFFFF', 0.08)
      : blendHex(background, '#0B0D12', 0.08);
  const surfaceText = pickReadableText(surface, foreground, 4.5);

  return {
    name: palette.name,
    primary,
    secondary,
    background,
    foreground,
    swatches,
    surface,
    surfaceText,
    mutedSurfaceText: ensureContrast(blendHex(surfaceText, surface, 0.45), surface, 3),
    textOnPrimary: pickReadableText(primary, foreground, 4.5),
    textOnSecondary: pickReadableText(secondary, foreground, 4.5),
  };
}

function hexToRgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
