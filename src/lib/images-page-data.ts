import { getBrandKitPageData } from '@/lib/brand-kit-page-data';
import { buildBrandVisualIdentity } from '@/lib/brand-visuals';

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function getImagesPageData() {
  const { answeredCount, brandIdentity, companyOverview, initialAnswers, totalQuestionCount } =
    await getBrandKitPageData();

  const normalizedBrandIdentity = buildBrandVisualIdentity(brandIdentity);
  const initialWebsiteUrl = readString(initialAnswers.website_url);

  return {
    answeredCount,
    brandIdentity: normalizedBrandIdentity,
    companyOverview: companyOverview || normalizedBrandIdentity.description || '',
    initialWebsiteUrl,
    totalQuestionCount,
  };
}
