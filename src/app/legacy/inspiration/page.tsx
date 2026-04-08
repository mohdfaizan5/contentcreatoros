import { getInspirations } from '@/actions/inspiration';
import { InspirationClient } from '@/components/inspiration/inspiration-client';
import { LEGACY_APP_ROOT } from '@/lib/app-shell';

export default async function InspirationPage() {
    const inspirations = await getInspirations();
    return <InspirationClient inspirations={inspirations} appRoot={LEGACY_APP_ROOT} />;
}
