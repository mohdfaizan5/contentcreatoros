import { getInspirations } from '@/features/inspiration/actions/inspiration';
import { InspirationClient } from '@/features/inspiration/components/inspiration-client';
import { LEGACY_APP_ROOT } from '@/features/inspiration/lib/app-shell';

export default async function InspirationPage() {
    const inspirations = await getInspirations();
    return <InspirationClient inspirations={inspirations} appRoot={LEGACY_APP_ROOT} />;
}
