import type { CSSProperties } from 'react';
import { buildBrandVisualIdentity, type BrandVisualIdentity } from '@/lib/brand-visuals';

export type VisualPalette = {
  name: string;
  primary: string;
  background: string;
  foreground: string;
  secondary?: string;
  swatches?: string[];
};

export type ResolvedPalette = {
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

export type BrandVisualContrastTokens = ReturnType<typeof getContrastTokens>;

export function toVisualPalette(identity: BrandVisualIdentity): VisualPalette {
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

export function resolvePaletteFromColors(
  colors: readonly string[],
  name = 'Brand',
): ResolvedPalette {
  return resolvePalette(
    toVisualPalette(
      buildBrandVisualIdentity({
        companyName: name,
        colors: [...colors],
      }),
    ),
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeHex(hex: string) {
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
  return getContrastRatio(normalizeHex(foreground), normalizeHex(background)) >= targetRatio;
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

export function pickReadableText(background: string, preferred: string, targetRatio = 4.5) {
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

export function getContrastTokens(theme: ResolvedPalette) {
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

export function resolvePalette(palette: VisualPalette): ResolvedPalette {
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

export function getBrandVisualThemeCssVariables(
  theme: ResolvedPalette,
  contrastTokens = getContrastTokens(theme),
): CSSProperties {
  return {
    '--brand-primary': theme.primary,
    '--brand-secondary': theme.secondary,
    '--brand-background': theme.background,
    '--brand-foreground': theme.foreground,
    '--brand-surface': theme.surface,
    '--brand-surface-text': theme.surfaceText,
    '--brand-muted-surface-text': theme.mutedSurfaceText,
    '--brand-text-on-primary': theme.textOnPrimary,
    '--brand-text-on-secondary': theme.textOnSecondary,
    '--brand-swatch-0': theme.swatches[0],
    '--brand-swatch-1': theme.swatches[1],
    '--brand-swatch-2': theme.swatches[2],
    '--brand-swatch-3': theme.swatches[3],
    '--brand-swatch-4': theme.swatches[4],
    '--brand-title-text': contrastTokens.brandTitleText,
    '--brand-primary-card-text': contrastTokens.primaryCardText,
    '--brand-shipments-title-text': contrastTokens.shipmentsTitleText,
    '--brand-shipments-value-text': contrastTokens.shipmentsValueText,
    '--brand-secondary-card-text': contrastTokens.secondaryCardText,
    '--brand-font-family-title-text': contrastTokens.fontFamilyTitleText,
    '--brand-font-family-caps-line-text': contrastTokens.fontFamilyCapsLineText,
    '--brand-font-family-body-line-text': contrastTokens.fontFamilyBodyLineText,
    '--brand-hero-text': contrastTokens.heroText,
    '--brand-hero-muted-text': contrastTokens.heroMutedText,
    '--brand-stat-accent-text': contrastTokens.statAccentText,
    '--brand-surface-muted-text': contrastTokens.surfaceMutedText,
    '--brand-cta-text': pickReadableText(theme.foreground, theme.background),
    '--brand-chip-background-text': pickReadableText(theme.background, theme.surfaceText),
    '--brand-chip-secondary-text': pickReadableText(theme.secondary, theme.surfaceText),
    '--brand-chip-primary-text': pickReadableText(theme.primary, theme.surfaceText),
    '--brand-chip-foreground-text': pickReadableText(theme.foreground, theme.surfaceText),
  } as CSSProperties;
}

export function applyBrandVisualThemeCssVariables(
  element: HTMLElement,
  theme: ResolvedPalette,
  contrastTokens = getContrastTokens(theme),
) {
  const variables = getBrandVisualThemeCssVariables(theme, contrastTokens);

  for (const [property, value] of Object.entries(variables)) {
    element.style.setProperty(property, String(value));
  }
}
