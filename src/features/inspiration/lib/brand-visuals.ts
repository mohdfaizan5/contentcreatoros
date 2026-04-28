/**
 * Shared brand visual utilities used by onboarding prefill and brand preview surfaces.
 */

export type BrandVisualIdentity = {
  companyName: string | null;
  description: string | null;
  logoUrl: string | null;
  ogImageUrl: string | null;
  sourceDomain: string | null;
  colors: string[];
};

export type BrandPreviewTheme = {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  surface: string;
  surfaceText: string;
  mutedSurfaceText: string;
  textOnPrimary: string;
  textOnSecondary: string;
  swatches: [string, string, string, string, string];
};

export type BrandKeyColorSet = {
  link: string;
  accent: string;
  primary: string;
  background: string;
  textPrimary: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeHexColor(hex: string) {
  const trimmed = hex.trim();

  if (!trimmed.startsWith('#')) {
    return null;
  }

  const raw = trimmed.slice(1);

  if (raw.length === 3) {
    return `#${raw
      .split('')
      .map((char) => `${char}${char}`)
      .join('')}`.toUpperCase();
  }

  if (raw.length !== 6) {
    return null;
  }

  return `#${raw}`.toUpperCase();
}

function hexToRgb(hex: string) {
  const normalized = (normalizeHexColor(hex) ?? '#000000').slice(1);

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

export function blendHex(from: string, to: string, amount: number) {
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

function ensureContrast(foreground: string, background: string, targetRatio = 4.5) {
  const bg = normalizeHexColor(background) ?? '#000000';
  let current = normalizeHexColor(foreground) ?? '#000000';

  if (getContrastRatio(current, bg) >= targetRatio) {
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

    if (ratio >= targetRatio) {
      return current;
    }
  }

  return bestColor;
}

function toBrandKeyColorSet(colors: string[]): BrandKeyColorSet {
  const normalized = colors
    .map((color) => normalizeHexColor(color))
    .filter((color): color is string => Boolean(color));

  const link = normalized[0] ?? '#1F6FFF';
  const accent = normalized[1] ?? link;
  const primary = normalized[2] ?? accent;
  const background = normalized[3] ?? '#0A111A';
  const textPrimary = normalized[4] ?? '#EAF1FF';

  return {
    link,
    accent,
    primary,
    background,
    textPrimary,
  };
}

export function pickReadableText(background: string, preferred: string, targetRatio = 4.5) {
  const bg = normalizeHexColor(background) ?? '#000000';
  const candidates = [
    ensureContrast(preferred, bg, targetRatio),
    ensureContrast('#0B0D12', bg, targetRatio),
    ensureContrast('#FFFFFF', bg, targetRatio),
  ];

  return candidates.reduce((best, candidate) =>
    getContrastRatio(candidate, bg) > getContrastRatio(best, bg) ? candidate : best,
  );
}

export function hexToRgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex);
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
        break;
      case gNorm:
        h = ((bNorm - rNorm) / d + 2) / 6;
        break;
      case bNorm:
        h = ((rNorm - gNorm) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;

  let r: number, g: number, b: number;

  if (sNorm === 0) {
    r = g = b = lNorm;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    r = hue2rgb(p, q, hNorm + 1 / 3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1 / 3);
  }

  return rgbToHex(r * 255, g * 255, b * 255);
}

function shiftHue(hex: string, degrees: number): string {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex((h + degrees + 360) % 360, s, l);
}

function adjustSaturation(hex: string, factor: number): string {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, clamp(s * factor, 0, 100), l);
}

function adjustLightness(hex: string, factor: number): string {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, s, clamp(l * factor, 0, 100));
}

function getComplementary(hex: string): string {
  return shiftHue(hex, 180);
}

function getAnalogous(hex: string, index: number): string {
  return shiftHue(hex, index * 30);
}

export function remixBrandColors(colors: string[], seed?: number): string[] {
  if (colors.length === 0) {
    return ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B'];
  }

  const hash = seed ?? Date.now();
  const random = (n: number) => {
    const x = Math.sin(hash + n) * 10000;
    return x - Math.floor(x);
  };

  const strategy = Math.floor(random(0) * 5);

  const normalizedColors = colors
    .map((c) => normalizeHexColor(c))
    .filter((c): c is string => Boolean(c));

  if (normalizedColors.length === 0) {
    return ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B'];
  }

  const baseColor = normalizedColors[0];

  switch (strategy) {
    case 0: {
      const hueShift = (random(1) - 0.5) * 120;
      return normalizedColors.map((c, i) => shiftHue(c, hueShift + i * 15));
    }
    case 1: {
      return [
        baseColor,
        getComplementary(baseColor),
        getAnalogous(baseColor, 1),
        getAnalogous(baseColor, -1),
        adjustLightness(baseColor, random(2) > 0.5 ? 1.3 : 0.7),
      ];
    }
    case 2: {
      const satFactor = 0.5 + random(1);
      return normalizedColors.map((c) => adjustSaturation(c, satFactor));
    }
    case 3: {
      const base = hexToHsl(baseColor);
      return [
        hslToHex(base.h, base.s, clamp(base.l * 0.6, 10, 90)),
        hslToHex(base.h, clamp(base.s * 1.2, 20, 100), clamp(base.l * 0.8, 15, 85)),
        hslToHex((base.h + 30) % 360, base.s, base.l),
        hslToHex((base.h + 180) % 360, base.s, base.l),
        hslToHex(base.h, base.s, clamp(base.l * 1.4, 20, 95)),
      ];
    }
    case 4:
    default: {
      const lighter = adjustLightness(baseColor, 1.4);
      const darker = adjustLightness(baseColor, 0.6);
      const shifted = shiftHue(baseColor, 60);
      const comp = getComplementary(baseColor);
      return [baseColor, lighter, darker, shifted, comp].slice(0, 5);
    }
  }
}

function buildSwatches(colors: string[]): [string, string, string, string, string] {
  const keyColors = toBrandKeyColorSet(colors);
  return [
    keyColors.link,
    keyColors.accent,
    keyColors.primary,
    keyColors.background,
    keyColors.textPrimary,
  ];
}

export function buildBrandVisualIdentity(input: Partial<BrandVisualIdentity>): BrandVisualIdentity {
  const colors = (input.colors ?? [])
    .map((color) => normalizeHexColor(color))
    .filter((color): color is string => Boolean(color))
    .slice(0, 5);

  return {
    companyName: input.companyName?.trim() || null,
    description: input.description?.trim() || null,
    logoUrl: input.logoUrl?.trim() || null,
    ogImageUrl: input.ogImageUrl?.trim() || null,
    sourceDomain: input.sourceDomain?.trim() || null,
    colors,
  };
}

export function toBrandPreviewTheme(identity: Partial<BrandVisualIdentity>): BrandPreviewTheme {
  const fallback = buildBrandVisualIdentity(identity);
  const keyColors = toBrandKeyColorSet(fallback.colors);
  const background = keyColors.background;
  const foreground = keyColors.textPrimary;
  const primary = keyColors.primary;
  const secondary = keyColors.accent;
  const swatches = buildSwatches(fallback.colors);
  const surface = blendHex(background, '#FFFFFF', 0.08);
  const surfaceText = pickReadableText(surface, foreground, 4.5);

  return {
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
