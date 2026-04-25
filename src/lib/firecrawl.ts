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

type DirectWebsiteFallbackResult = {
  markdown: string;
  metadata: Record<string, unknown>;
  brandIdentity: BrandVisualIdentity;
  raw: Record<string, unknown>;
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

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function stripHtml(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function firstRegexMatch(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    const value = match?.[1];

    if (value) {
      return decodeHtmlEntities(value.trim());
    }
  }

  return '';
}

function toAbsoluteUrl(value: string, baseUrl: string) {
  if (!value) {
    return '';
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return '';
  }
}

function extractDirectMetadata(html: string, url: string) {
  const title = firstRegexMatch(html, [
    /<title[^>]*>([\s\S]*?)<\/title>/i,
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["'][^>]*>/i,
  ]);
  const description = firstRegexMatch(html, [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["'][^>]*>/i,
  ]);
  const ogImage = firstRegexMatch(html, [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i,
  ]);
  const logo = firstRegexMatch(html, [
    /<link[^>]+rel=["'][^"']*(?:icon|apple-touch-icon)[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*(?:icon|apple-touch-icon)[^"']*["'][^>]*>/i,
    /<img[^>]+(?:alt|aria-label)=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["'][^>]*>/i,
    /<img[^>]+src=["']([^"']+)["'][^>]+(?:alt|aria-label)=["'][^"']*logo[^"']*["'][^>]*>/i,
  ]);

  return {
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogImage: toAbsoluteUrl(ogImage, url),
    favicon: toAbsoluteUrl(logo, url),
    sourceURL: url,
  };
}

function extractDirectColors(html: string) {
  const candidates = new Set<string>();

  const metaThemeColor = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  const metaThemeColorReverse = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']theme-color["'][^>]*>/i);
  const themeColor = normalizeColorCandidate(metaThemeColor?.[1] ?? metaThemeColorReverse?.[1]);

  if (themeColor) {
    candidates.add(themeColor);
  }

  for (const match of html.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)) {
    const normalized = normalizeColorCandidate(match[0]);

    if (normalized) {
      candidates.add(normalized);
    }

    if (candidates.size >= 5) {
      break;
    }
  }

  return [...candidates].slice(0, 5);
}

async function fetchHtmlWithTimeout(url: string, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent':
          'Mozilla/5.0 (compatible; ContentOSXOnboarding/1.0; +https://contentosx.com)',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Direct website fetch returned HTTP ${response.status}.`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType && !contentType.toLowerCase().includes('text/html')) {
      throw new Error(`Direct website fetch returned ${contentType}.`);
    }

    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function scrapeWebsiteDirectly(params: {
  normalizedUrl: string;
  domain: string;
}): Promise<DirectWebsiteFallbackResult> {
  const html = await fetchHtmlWithTimeout(params.normalizedUrl);
  const metadata = extractDirectMetadata(html, params.normalizedUrl);
  const bodyText = stripHtml(html).slice(0, 12000);
  const markdown = [
    metadata.title ? `# ${metadata.title}` : '',
    metadata.description ? String(metadata.description) : '',
    bodyText,
  ]
    .filter(Boolean)
    .join('\n\n');
  const colors = extractDirectColors(html);

  return {
    markdown,
    metadata,
    brandIdentity: buildBrandVisualIdentity({
      companyName: readString(metadata.title),
      description: readString(metadata.description) || markdownSummary(markdown),
      logoUrl: readString(metadata.favicon),
      ogImageUrl: readString(metadata.ogImage),
      sourceDomain: params.domain,
      colors,
    }),
    raw: {
      source: 'direct-fetch-fallback',
      metadata,
      htmlLength: html.length,
    },
  };
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

  return scrapeClient.scrape(url, {
    formats,
    proxy: 'auto',
    removeBase64Images: true,
    timeout: 120000,
  });
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

  try {
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

    return {
      normalizedUrl,
      domain,
      markdown,
      metadata: parsed.metadata,
      brandIdentity,
      raw: parsed.envelope,
    };
  } catch (error) {
    console.warn('[Firecrawl][scrape:fallback]', {
      requestId: params.requestId ?? null,
      domain,
      message: error instanceof Error ? error.message : 'Unknown Firecrawl failure',
    });

    const fallback = await scrapeWebsiteDirectly({
      normalizedUrl,
      domain,
    });

    console.log('[Firecrawl][scrape:fallback:done]', {
      requestId: params.requestId ?? null,
      domain,
      markdownLength: fallback.markdown.length,
      detectedColorCount: fallback.brandIdentity.colors.length,
      hasLogo: Boolean(fallback.brandIdentity.logoUrl),
      hasOgImage: Boolean(fallback.brandIdentity.ogImageUrl),
      hasCompanyName: Boolean(fallback.brandIdentity.companyName),
    });

    return {
      normalizedUrl,
      domain,
      markdown: fallback.markdown,
      metadata: fallback.metadata,
      brandIdentity: fallback.brandIdentity,
      raw: fallback.raw,
    };
  }
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

  try {
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

    console.log('[Firecrawl][branding:done]', {
      requestId: params.requestId ?? null,
      domain,
      markdownLength: markdown.length,
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
  } catch (error) {
    console.warn('[Firecrawl][branding:fallback]', {
      requestId: params.requestId ?? null,
      domain,
      message: error instanceof Error ? error.message : 'Unknown Firecrawl failure',
    });

    const fallback = await scrapeWebsiteDirectly({
      normalizedUrl,
      domain,
    });

    console.log('[Firecrawl][branding:fallback:done]', {
      requestId: params.requestId ?? null,
      domain,
      markdownLength: fallback.markdown.length,
      detectedColorCount: fallback.brandIdentity.colors.length,
      hasLogo: Boolean(fallback.brandIdentity.logoUrl),
      hasOgImage: Boolean(fallback.brandIdentity.ogImageUrl),
      hasCompanyName: Boolean(fallback.brandIdentity.companyName),
    });

    return {
      normalizedUrl,
      domain,
      metadata: fallback.metadata,
      brandIdentity: fallback.brandIdentity,
      raw: fallback.raw,
    };
  }
}
