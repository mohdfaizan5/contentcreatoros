import { notFound } from 'next/navigation';
import { getInspiration } from '@/actions/inspiration';
import { InspirationDetail } from '@/components/inspiration/inspiration-detail';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function InspirationDetailPage({ params }: PageProps) {
    const { id } = await params;
    const inspiration = await getInspiration(id);

    if (!inspiration) {
        notFound();
    }

    return <InspirationDetail inspiration={inspiration} />;
}
