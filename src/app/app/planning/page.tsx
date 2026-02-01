import { getIdeas } from '@/actions/ideas';
import { getSeries } from '@/actions/series';
import { PlanningBoard } from '@/components/planning/planning-board';

export default async function PlanningPage() {
    const [ideas, seriesList] = await Promise.all([
        getIdeas(),
        getSeries(),
    ]);

    return <PlanningBoard ideas={ideas} seriesList={seriesList} />;
}
