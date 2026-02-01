import { getIdeas } from '@/actions/ideas';
import { IdeaDump } from '@/components/ideas/idea-dump';
import { IdeasList } from '@/components/ideas/idea-card';
import { Lightbulb } from '@phosphor-icons/react/dist/ssr';

export default async function IdeasPage() {
    const ideas = await getIdeas();

    // Calculate stats
    const dumpedCount = ideas.filter(i => i.status === 'dumped').length;
    const refinedCount = ideas.filter(i => i.status === 'refined').length;
    const plannedCount = ideas.filter(i => i.status === 'planned').length;
    const scriptedCount = ideas.filter(i => i.status === 'scripted').length;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="animate-fade-in-up">
                <div className="flex items-center gap-3 mb-2">
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
            </div>

            {/* Status Pipeline */}
            {ideas.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                    <div className="rounded-xl bg-gray-500/5 border border-gray-500/10 p-3 text-center">
                        <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{dumpedCount}</div>
                        <div className="text-xs text-muted-foreground">Dumped</div>
                    </div>
                    <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{refinedCount}</div>
                        <div className="text-xs text-muted-foreground">Refined</div>
                    </div>
                    <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3 text-center">
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{plannedCount}</div>
                        <div className="text-xs text-muted-foreground">Planned</div>
                    </div>
                    <div className="rounded-xl bg-green-500/5 border border-green-500/10 p-3 text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{scriptedCount}</div>
                        <div className="text-xs text-muted-foreground">Scripted</div>
                    </div>
                </div>
            )}

            {/* Idea Dump */}
            <IdeaDump />

            {/* Ideas List */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Your Ideas</h2>
                    <span className="text-sm text-muted-foreground">{ideas.length} total</span>
                </div>
                <IdeasList ideas={ideas} />
            </div>
        </div>
    );
}
