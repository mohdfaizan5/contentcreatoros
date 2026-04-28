import { notFound } from 'next/navigation';
import { getInspiration } from '@/features/inspiration/actions/inspiration';
import { InspirationDetail } from '@/features/inspiration/components/inspiration-detail';
import { LEGACY_APP_ROOT } from '@/features/inspiration/lib/app-shell';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function InspirationDetailPage({ params }: PageProps) {
    const { id } = await params;
    const inspiration = await getInspiration(id);

    if (!inspiration) {
        notFound();
    }

    return <InspirationDetail inspiration={inspiration} appRoot={LEGACY_APP_ROOT} />;
}
