import { notFound } from 'next/navigation';
import { LeadMagnetForm } from '@/features/(legacy)/lead-magnets/components/lead-magnet-form';
import { getPublicMagnet } from '@/features/(legacy)/lead-magnets/actions/lead-magnets';

interface MagnetPageProps {
    params: Promise<{ slug: string }>;
}

export default async function MagnetPage({ params }: MagnetPageProps) {
    const { slug } = await params;
    const magnet = await getPublicMagnet(slug);

    if (!magnet) {
        notFound();
    }

    return <LeadMagnetForm magnet={magnet} />;
}
