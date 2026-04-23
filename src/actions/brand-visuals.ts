'use server';

import { ONBOARDING_FLOW_KEY } from '@/lib/onboarding';
import { revalidateAppPaths } from '@/lib/revalidate-app-paths';
import { buildBrandVisualIdentity, type BrandVisualIdentity } from '@/lib/brand-visuals';
import { scrapeWebsiteForBranding } from '@/lib/firecrawl';
import { createClient } from '@/lib/server';

type RegenerateBrandVisualErrorCode =
  | 'INVALID_URL'
  | 'SCRAPE_FAILED'
  | 'UNAUTHENTICATED'
  | 'DB_WRITE_FAILED';

export type RegenerateBrandVisualIdentityInput = {
  websiteUrl: string;
};

export type RegenerateBrandVisualIdentityResult = {
  success: boolean;
  error?: string;
  errorCode?: RegenerateBrandVisualErrorCode;
  brandIdentity?: BrandVisualIdentity;
  source?: {
    normalizedUrl: string;
    domain: string;
  };
};

type SaveBrandVisualThemeErrorCode =
  | 'INVALID_COLORS'
  | 'UNAUTHENTICATED'
  | 'DB_READ_FAILED'
  | 'DB_WRITE_FAILED';

export type SaveBrandVisualThemeInput = {
  colors: string[];
};

export type SaveBrandVisualThemeResult = {
  success: boolean;
  error?: string;
  errorCode?: SaveBrandVisualThemeErrorCode;
  colors?: string[];
};

function createRequestId() {
  return `brand_visuals_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function regenerateBrandVisualIdentity(
  input: RegenerateBrandVisualIdentityInput,
): Promise<RegenerateBrandVisualIdentityResult> {
  const requestId = createRequestId();
  const startedAt = Date.now();
  const websiteUrl = input.websiteUrl.trim();

  if (!websiteUrl) {
    return {
      success: false,
      errorCode: 'INVALID_URL',
      error: 'Add a valid website URL to regenerate your brand visuals.',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      errorCode: 'UNAUTHENTICATED',
      error: 'Please sign in and try again.',
    };
  }

  let scrapeResult: Awaited<ReturnType<typeof scrapeWebsiteForBranding>>;

  try {
    scrapeResult = await scrapeWebsiteForBranding({
      url: websiteUrl,
      requestId,
    });
  } catch (error) {
    return {
      success: false,
      errorCode: 'SCRAPE_FAILED',
      error:
        error instanceof Error
          ? error.message
          : 'Unable to scan that website for branding right now.',
    };
  }

  const brandIdentity = buildBrandVisualIdentity(scrapeResult.brandIdentity);

  const { data: existingProfile } = await supabase
    .from('onboarding_autofill_profiles')
    .select('inferred_answers, x_handle')
    .eq('user_id', user.id)
    .eq('flow_key', ONBOARDING_FLOW_KEY)
    .maybeSingle();

  const { error: upsertError } = await supabase.from('onboarding_autofill_profiles').upsert(
    {
      user_id: user.id,
      flow_key: ONBOARDING_FLOW_KEY,
      source_url: scrapeResult.normalizedUrl,
      source_domain: scrapeResult.domain,
      x_handle: existingProfile?.x_handle ?? null,
      scrape_payload: {
        mode: 'branding_only',
        metadata: scrapeResult.metadata,
        raw: scrapeResult.raw,
      },
      brand_identity: brandIdentity,
      inferred_answers: existingProfile?.inferred_answers ?? {},
      model: 'firecrawl-branding-only',
      prompt_version: 'brand-visuals-regenerate-v1',
      run_metadata: {
        mode: 'branding_only',
        requestId,
        durationMs: Date.now() - startedAt,
        colorCount: brandIdentity.colors.length,
        savedAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (upsertError) {
    return {
      success: false,
      errorCode: 'DB_WRITE_FAILED',
      error: 'Brand visuals were detected but could not be saved. Please try again.',
    };
  }

  revalidateAppPaths(['/app/brand-kit/visuals']);

  return {
    success: true,
    brandIdentity,
    source: {
      normalizedUrl: scrapeResult.normalizedUrl,
      domain: scrapeResult.domain,
    },
  };
}

function normalizeMetadata(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function saveBrandVisualThemeColors(
  input: SaveBrandVisualThemeInput,
): Promise<SaveBrandVisualThemeResult> {
  const colors = buildBrandVisualIdentity({ colors: input.colors }).colors;

  if (colors.length === 0) {
    return {
      success: false,
      errorCode: 'INVALID_COLORS',
      error: 'Please choose at least one valid hex color before saving.',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      errorCode: 'UNAUTHENTICATED',
      error: 'Please sign in and try again.',
    };
  }

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from('onboarding_autofill_profiles')
    .select(
      'brand_identity, source_url, source_domain, x_handle, inferred_answers, scrape_payload, model, prompt_version, run_metadata',
    )
    .eq('user_id', user.id)
    .eq('flow_key', ONBOARDING_FLOW_KEY)
    .maybeSingle();

  if (existingProfileError) {
    return {
      success: false,
      errorCode: 'DB_READ_FAILED',
      error: 'Unable to load your current brand profile. Please try again.',
    };
  }

  const existingIdentity = buildBrandVisualIdentity(
    (existingProfile?.brand_identity as Partial<BrandVisualIdentity>) ?? {},
  );

  const nextIdentity = buildBrandVisualIdentity({
    ...existingIdentity,
    colors,
  });

  const now = new Date().toISOString();
  const { error: upsertError } = await supabase.from('onboarding_autofill_profiles').upsert(
    {
      user_id: user.id,
      flow_key: ONBOARDING_FLOW_KEY,
      source_url: existingProfile?.source_url ?? null,
      source_domain: existingProfile?.source_domain ?? nextIdentity.sourceDomain ?? null,
      x_handle: existingProfile?.x_handle ?? null,
      scrape_payload: existingProfile?.scrape_payload ?? {},
      brand_identity: nextIdentity,
      inferred_answers: existingProfile?.inferred_answers ?? {},
      model: existingProfile?.model ?? 'manual-brand-theme-v1',
      prompt_version: existingProfile?.prompt_version ?? 'brand-visual-theme-save-v1',
      run_metadata: {
        ...normalizeMetadata(existingProfile?.run_metadata),
        manualThemeUpdatedAt: now,
        manualThemeColorCount: nextIdentity.colors.length,
      },
      updated_at: now,
    },
    { onConflict: 'user_id' },
  );

  if (upsertError) {
    return {
      success: false,
      errorCode: 'DB_WRITE_FAILED',
      error: 'Unable to save your theme colors right now. Please try again.',
    };
  }

  revalidateAppPaths(['/app/brand-kit', '/app/brand-kit/visuals']);

  return {
    success: true,
    colors: nextIdentity.colors,
  };
}
