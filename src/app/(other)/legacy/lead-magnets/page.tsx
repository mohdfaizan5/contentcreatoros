import { getMagnets } from '@/features/(legacy)/lead-magnets/actions/lead-magnets';
import { LeadMagnetsClient } from '@/features/(legacy)/lead-magnets/components/lead-magnets-client';
import { LEGACY_APP_ROOT } from '@/features/inspiration/lib/app-shell';

export default async function LeadMagnetsPage() {
    const magnets = await getMagnets();
    return (
        <div className="space-y-6">
            <LeadMagnetsClient magnets={magnets} appRoot={LEGACY_APP_ROOT} />
        </div>
    );
}
