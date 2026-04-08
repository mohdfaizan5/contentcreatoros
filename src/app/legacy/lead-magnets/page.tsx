import { getMagnets } from '@/actions/lead-magnets';
import { LeadMagnetsClient } from '@/components/lead-magnets/lead-magnets-client';
import { LEGACY_APP_ROOT } from '@/lib/app-shell';

export default async function LeadMagnetsPage() {
    const magnets = await getMagnets();
    return (
        <div className="space-y-6">
            <LeadMagnetsClient magnets={magnets} appRoot={LEGACY_APP_ROOT} />
        </div>
    );
}
