import BrandSettingsForm from '@/features/brand-kit/components/brand-settings-form';
import BrandKitShell from '@/features/brand-kit/components/brand-kit-shell';
import { getBrandKitPageData } from '@/features/brand-kit/lib/brand-kit-page-data';

export const metadata = {
  title: 'Brand Voice | ContentOSX',
  description: 'Manage brand voice and onboarding question inputs for your X profile',
};

export default async function BrandVoicePage() {
  const { answeredCount, initialAnswers, totalQuestionCount } = await getBrandKitPageData();

  return (
    <BrandKitShell answeredCount={answeredCount} totalQuestionCount={totalQuestionCount}>
      <BrandSettingsForm initialAnswers={initialAnswers} view="brand-voice" showShell={false} />
    </BrandKitShell>
  );
}

