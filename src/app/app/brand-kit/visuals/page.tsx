import type { Metadata } from 'next';
import { BrandVisualsStyleboard } from '@/features/brand-kit/components/brand-visuals-styleboard';
import BrandKitShell from '@/features/brand-kit/components/brand-kit-shell';
import { getBrandKitPageData } from '@/features/brand-kit/lib/brand-kit-page-data';
import { buildBrandVisualIdentity } from '@/features/inspiration/lib/brand-visuals';

export const metadata: Metadata = {
  title: 'Brand Visuals | ContentOSX',
  description: 'Visual styleboard for icon, palette, and promo directions.',
};

export default async function BrandVisualsPage() {
  const { answeredCount, brandIdentity, initialAnswers, totalQuestionCount } =
    await getBrandKitPageData();

  const identity = buildBrandVisualIdentity(brandIdentity);

  const defaultWebsiteUrl =
    typeof initialAnswers.website_url === 'string' && initialAnswers.website_url.trim().length > 0
      ? initialAnswers.website_url
      : identity.sourceDomain
        ? `https://${identity.sourceDomain}`
        : '';

  return (
    <BrandKitShell answeredCount={answeredCount} totalQuestionCount={totalQuestionCount}>
      <BrandVisualsStyleboard
        identity={identity}
        defaultWebsiteUrl={defaultWebsiteUrl}
      />
    </BrandKitShell>
  );
}

