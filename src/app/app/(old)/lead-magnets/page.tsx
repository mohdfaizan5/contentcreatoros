import { getMagnets } from '@/actions/lead-magnets';
import { LeadMagnetsClient } from '@/components/lead-magnets/lead-magnets-client';

export default async function LeadMagnetsPage() {
    const magnets = await getMagnets();
    return (
        <div className="space-y-6">
            <LeadMagnetsClient magnets={magnets} />
        </div>
    );
}
