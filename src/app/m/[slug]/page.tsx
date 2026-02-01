import { notFound } from 'next/navigation';
import { getPublicMagnet } from '@/actions/lead-magnets';
import { LeadMagnetForm } from '@/components/lead-magnets/lead-magnet-form';

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
