import { getIdeas } from '@/actions/ideas';
import { IdeaDump } from '@/components/ideas/idea-dump';
import { IdeasList } from '@/components/ideas/idea-card';

export default async function IdeasPage() {
    const ideas = await getIdeas();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Ideas</h1>
                <p className="text-muted-foreground">
                    Capture raw thoughts before they escape. No structure required.
                </p>
            </div>

            <IdeaDump />

            <div>
                <h2 className="text-lg font-semibold mb-4">Your Ideas ({ideas.length})</h2>
                <IdeasList ideas={ideas} />
            </div>
        </div>
    );
}
