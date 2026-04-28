import BrandSettingsForm from '@/features/brand-kit/components/brand-settings-form';
import BrandKitShell from '@/features/brand-kit/components/brand-kit-shell';
import { getBrandKitPageData } from '@/features/brand-kit/lib/brand-kit-page-data';

export const metadata = {
  title: 'Brand Kit Overview | ContentOSX',
  description: 'Overview for company X profile voice and visual setup',
};

export default async function BrandSettingsPage() {
  const {
    answeredCount,
    brandIdentity,
    companyOverview,
    initialAnswers,
    totalQuestionCount,
  } = await getBrandKitPageData();

  return (
    <BrandKitShell answeredCount={answeredCount} totalQuestionCount={totalQuestionCount}>
      <BrandSettingsForm
        brandIdentity={brandIdentity}
        companyOverview={companyOverview}
        initialAnswers={initialAnswers}
        showShell={false}
        view="overview"
      />
    </BrandKitShell>
  );
}
