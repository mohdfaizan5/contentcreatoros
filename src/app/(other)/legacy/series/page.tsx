import { getSeries } from '@/features/(legacy)/series/actions/series';
import { SeriesClient } from '@/features/(legacy)/series/components/series-client';
import { LEGACY_APP_ROOT } from '@/features/inspiration/lib/app-shell';

export default async function SeriesPage() {
    const seriesList = await getSeries();
    return <SeriesClient seriesList={seriesList} appRoot={LEGACY_APP_ROOT} />;
}
