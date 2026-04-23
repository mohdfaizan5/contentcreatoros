import type { Metadata } from 'next';

import { ImageTemplateWorkbench } from '@/components/images/image-template-workbench';
import { getImagesPageData } from '@/lib/images-page-data';

export const metadata: Metadata = {
    title: 'Image Templates | ContentOSX',
    description:
        'Generate tweet and image copy from brand context, then export polished 16:9 PNG templates.',
};

export default async function ImagesPage() {
    const { brandIdentity, companyOverview, initialWebsiteUrl } = await getImagesPageData();

    return (
        <div className="min-h-full bg-[radial-gradient(120%_120%_at_50%_-10%,rgba(56,189,248,0.14),transparent_60%),linear-gradient(180deg,rgba(2,6,23,0.03)_0%,transparent_40%)]">
            <ImageTemplateWorkbench
                brandIdentity={brandIdentity}
                companyOverview={companyOverview}
                initialWebsiteUrl={initialWebsiteUrl}
            />
        </div>
    );
}