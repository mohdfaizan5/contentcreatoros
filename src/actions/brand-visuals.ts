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
