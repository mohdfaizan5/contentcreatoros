import { redirect } from 'next/navigation';
import { buildAppPath, LEGACY_APP_ROOT } from '@/lib/app-shell';

interface LegacyRouteRedirectPageProps {
    params: Promise<{ slug?: string[] }>;
}

export default async function LegacyRouteRedirectPage({
    params,
}: LegacyRouteRedirectPageProps) {
    const { slug = [] } = await params;
    const nextPath = slug.length > 0 ? `/${slug.join('/')}` : '';

    redirect(buildAppPath(LEGACY_APP_ROOT, nextPath));
}
