/**
 * Ideas Page
 * Clean, simplified view for capturing and organizing content ideas
 */

import { getIdeas } from '@/actions/ideas';
import IdeasClient from '@/components/ideas/ideas-client-wrapper';
import { Lightbulb } from '@phosphor-icons/react/dist/ssr';
import { DynamicCreateButton } from '@/components/ideas/dynamic-create-button';
import { LEGACY_APP_ROOT } from '@/lib/app-shell';

export default async function IdeasPage() {
    const ideas = await getIdeas();

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header with Create Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <Lightbulb className="h-5 w-5 text-amber-500" weight="duotone" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Ideas</h1>
                        <p className="text-muted-foreground text-sm">
                            Capture raw thoughts before they escape
                        </p>
                    </div>
                </div>

                <DynamicCreateButton appRoot={LEGACY_APP_ROOT} />
            </div>

            {/* Ideas List */}
            <IdeasClient initialIdeas={ideas} appRoot={LEGACY_APP_ROOT} />
        </div>
    );
}
