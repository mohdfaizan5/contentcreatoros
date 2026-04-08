import { getSeries } from '@/actions/series';
import { SeriesClient } from '@/components/series/series-client';
import { LEGACY_APP_ROOT } from '@/lib/app-shell';

export default async function SeriesPage() {
    const seriesList = await getSeries();
    return <SeriesClient seriesList={seriesList} appRoot={LEGACY_APP_ROOT} />;
}
