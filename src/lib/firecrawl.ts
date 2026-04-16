/**
 * Firecrawl helpers for onboarding prefill.
 * Provides normalized scrape output with markdown and lightweight brand identity fields.
 */

import Firecrawl from '@mendable/firecrawl-js';
import { buildBrandVisualIdentity, normalizeHexColor, type BrandVisualIdentity } from '@/lib/brand-visuals';

export type FirecrawlScrapeResult = {
  normalizedUrl: string;
  domain: string;
  markdown: string;
  metadata: Record<string, unknown>;
  brandIdentity: BrandVisualIdentity;
  raw: Record<string, unknown>;
};

export type FirecrawlBrandingResult = {
  normalizedUrl: string;
  domain: string;
  metadata: Record<string, unknown>;
  brandIdentity: BrandVisualIdentity;
  raw: Record<string, unknown>;
};

type ParsedScrapePayload = {
  envelope: Record<string, unknown>;
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
  branding: Record<string, unknown>;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function firstString(values: unknown[]) {
  for (const value of values) {
    const next = readString(value);
    if (next) {
      return next;
    }
  }

  return '';
}

function rgbChannelToHex(channel: number) {
  return Math.max(0, Math.min(255, Math.round(channel)))
    .toString(16)
    .padStart(2, '0');
}

function normalizeColorCandidate(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const hexMatch = trimmed.match(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/);
  if (hexMatch?.[0]) {
    return normalizeHexColor(hexMatch[0]);
  }

  const rgbMatch = trimmed.match(
    /rgba?\(\s*(\d{1,3})\s*[,\s]+(\d{1,3})\s*[,\s]+(\d{1,3})/i,
  );
  if (rgbMatch) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    return normalizeHexColor(`#${rgbChannelToHex(r)}${rgbChannelToHex(g)}${rgbChannelToHex(b)}`);
  }

  return normalizeHexColor(trimmed);
}

function extractColors(branding: Record<string, unknown>) {
  const colors = asRecord(branding.colors);
  const orderedCandidates = [
    colors.link,
    colors.accent,
    colors.primary,
    colors.background,
    colors.textPrimary,
    colors.text_primary,
  ];

  return orderedCandidates
    .map((candidate) => normalizeColorCandidate(candidate))
    .filter((candidate): candidate is string => Boolean(candidate))
    .slice(0, 5);
}

function extractBrandingImages(branding: Record<string, unknown>) {
  const images = asRecord(branding.images);

  return {
    logoUrl: firstString([
      images.logo,
      images.logoUrl,
      images.logo_url,
      branding.logoUrl,
      branding.logo_url,
      branding.logo,
    ]),
    ogImageUrl: firstString([
      images.ogImage,
      images.og_image,
      branding.ogImage,
      branding.og_image,
    ]),
  };
}

function parseScrapePayload(rawResult: unknown): ParsedScrapePayload {
  const envelope = asRecord(rawResult);
  const data = asRecord(envelope.data && typeof envelope.data === 'object' ? envelope.data : envelope);

  return {
    envelope,
    data,
    metadata: asRecord(data.metadata),
    branding: asRecord(data.branding),
  };
}

function buildBrandIdentityFromPayload(params: {
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
  branding: Record<string, unknown>;
  domain: string;
  markdown?: string;
}) {
  const brandingImages = extractBrandingImages(params.branding);

  return buildBrandVisualIdentity({
    companyName: firstString([
      params.branding.companyName,
      params.branding.company_name,
      params.metadata.ogTitle,
      params.metadata.title,
      params.data.title,
    ]),
    description:
      firstString([
        params.branding.description,
        params.metadata.description,
        params.metadata.ogDescription,
        params.data.description,
      ]) || markdownSummary(params.markdown ?? ''),
    logoUrl: firstString([
      brandingImages.logoUrl,
      params.metadata.logo,
      params.data.favicon,
      params.metadata.favicon,
    ]),
    ogImageUrl: firstString([
      brandingImages.ogImageUrl,
      params.metadata.ogImage,
      params.metadata['og:image'],
      params.data.ogImage,
    ]),
    sourceDomain: params.domain,
    colors: extractColors(params.branding),
  });
}

function markdownSummary(markdown: string) {
  const compact = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/[#>*_~\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!compact) {
    return '';
  }

  return compact.slice(0, 220).trim();
}

export function normalizeWebsiteUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const candidate = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
    const parsed = new URL(candidate);

    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return null;
    }

    parsed.hash = '';
    parsed.search = '';

    return parsed.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

export function extractDomain(url: string) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function createFirecrawlClient() {
  const apiKey = process.env.FIRECRAWL_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('Missing FIRECRAWL_API_KEY.');
  }

  return new Firecrawl({ apiKey });
}

async function scrapeWithFormats(client: Firecrawl, url: string, formats: string[]) {
  const scrapeClient = client as unknown as {
    scrape: (targetUrl: string, options?: unknown) => Promise<unknown>;
  };

  try {
    return await scrapeClient.scrape(url, {
      formats,
    });
  } catch {
    return scrapeClient.scrape(url);
  }
}

export async function scrapeWebsiteForOnboarding(params: {
  url: string;
  requestId?: string;
}) {
  const normalizedUrl = normalizeWebsiteUrl(params.url);

  if (!normalizedUrl) {
    throw new Error('Please enter a valid website URL.');
  }

  const firecrawl = createFirecrawlClient();
  const domain = extractDomain(normalizedUrl);

  console.log('[Firecrawl][scrape:start]', {
    requestId: params.requestId ?? null,
    domain,
    normalizedUrl,
  });

  const rawResult = await scrapeWithFormats(firecrawl, normalizedUrl, ['markdown', 'branding']);
  const parsed = parseScrapePayload(rawResult);

  const markdown = firstString([parsed.data.markdown, parsed.data.content]);

  const brandIdentity = buildBrandIdentityFromPayload({
    data: parsed.data,
    metadata: parsed.metadata,
    branding: parsed.branding,
    domain,
    markdown,
  });

  console.log('[Firecrawl][scrape:done]', {
    requestId: params.requestId ?? null,
    domain,
    markdownLength: markdown.length,
    detectedColorCount: brandIdentity.colors.length,
    hasLogo: Boolean(brandIdentity.logoUrl),
    hasOgImage: Boolean(brandIdentity.ogImageUrl),
    hasCompanyName: Boolean(brandIdentity.companyName),
  });

  const result: FirecrawlScrapeResult = {
    normalizedUrl,
    domain,
    markdown,
    metadata: parsed.metadata,
    brandIdentity,
    raw: parsed.envelope,
  };

  return result;
}

export async function scrapeWebsiteForBranding(params: {
  url: string;
  requestId?: string;
}) {
  const normalizedUrl = normalizeWebsiteUrl(params.url);

  if (!normalizedUrl) {
    throw new Error('Please enter a valid website URL.');
  }

  const firecrawl = createFirecrawlClient();
  const domain = extractDomain(normalizedUrl);

  console.log('[Firecrawl][branding:start]', {
    requestId: params.requestId ?? null,
    domain,
    normalizedUrl,
  });

  const rawResult = await scrapeWithFormats(firecrawl, normalizedUrl, ['branding']);
  const parsed = parseScrapePayload(rawResult);
  const brandIdentity = buildBrandIdentityFromPayload({
    data: parsed.data,
    metadata: parsed.metadata,
    branding: parsed.branding,
    domain,
  });

  console.log('[Firecrawl][branding:done]', {
    requestId: params.requestId ?? null,
    domain,
    detectedColorCount: brandIdentity.colors.length,
    hasLogo: Boolean(brandIdentity.logoUrl),
    hasOgImage: Boolean(brandIdentity.ogImageUrl),
    hasCompanyName: Boolean(brandIdentity.companyName),
  });

  const result: FirecrawlBrandingResult = {
    normalizedUrl,
    domain,
    metadata: parsed.metadata,
    brandIdentity,
    raw: parsed.envelope,
  };

  return result;
}
