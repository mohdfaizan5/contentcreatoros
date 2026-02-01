import { getInspirations } from '@/actions/inspiration';
import { InspirationClient } from '@/components/inspiration/inspiration-client';

export default async function InspirationPage() {
    const inspirations = await getInspirations();
    return <InspirationClient inspirations={inspirations} />;
}
