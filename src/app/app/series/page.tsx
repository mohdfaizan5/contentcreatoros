import { getSeries } from '@/actions/series';
import { SeriesClient } from '@/components/series/series-client';

export default async function SeriesPage() {
    const seriesList = await getSeries();
    return <SeriesClient seriesList={seriesList} />;
}
