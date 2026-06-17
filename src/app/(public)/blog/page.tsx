import Link from 'next/link';
import { ChevronRight, CircleArrowRight } from 'lucide-react';

import { ReadCvLogoIcon } from '@phosphor-icons/react/dist/ssr';
import { source } from '@/shared/lib/source';

export const metadata = {
    title: 'Blog | ContentOSX',
    description: 'Playbooks and field notes for solo founders shipping faster.',
};

export default async function BlogIndexPage() {
    const allPages = source.getPages();
    const sortedPages = [...allPages].sort((a, b) => {
        const left = new Date((b.data as { date?: string }).date || '').getTime();
        const right = new Date((a.data as { date?: string }).date || '').getTime();
        return left - right;
    });

    const listPosts = sortedPages;

    return (
        <div className="min-h-screen bg-background text-foreground max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-10 space-y-6">
            <div className="mt-20 ">
                <h2 className="text-3xl font-bold inline-flex space-x-1"><ReadCvLogoIcon size={32} weight="duotone" />Blog</h2>
                <p className="text-sm text-muted-foreground mt-1">Actionable essays and shipping notes.</p>
            </div>
            <section className="rounded-2xl border border-border bg-card">

                <div className="divide-y divide-border">
                    {listPosts.filter((post) => !(post.data as { isUnlisted?: boolean }).isUnlisted).map((post) => {
                        const postSlug = post.slugs?.join('/') || '';
                        const postData = post.data as { date?: string; readTime?: string };
                        return (
                            <Link key={postSlug} href={`/blog/${postSlug}`} className="group px-6 md:px-8 py-4 flex items-center justify-between gap-4 hover:bg-muted/60 transition-colors">
                                <div className="flex items-center gap-6 min-w-0">
                                    <span className="hidden md:block w-28 text-xs text-muted-foreground shrink-0">{postData.date || 'Recent'}</span>
                                    <h3 className="font-semibold text-sm md:text-base line-clamp-1">{post.data.title || 'Untitled'}</h3>
                                </div>
                                <span className="text-xs text-muted-foreground group-hover:text-primary inline-flex items-center gap-1 shrink-0">
                                    Read more <ChevronRight className="h-3.5 w-3.5" />
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </section>

            <section className="rounded-2xl border border-border bg-card text-card-foreground px-6 md:px-8 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <p className="text-2xl font-bold">Start tracking your SaaS execution today</p>
                    <p className="text-muted-foreground mt-1">Join teams using ContentOSX to ship faster with clarity.</p>
                </div>
                <Link href="/projects" className="inline-flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 text-sm font-semibold transition-colors">
                    Try ContentOSX
                    <CircleArrowRight className="h-4 w-4" />
                </Link>
            </section>
        </div>
    );
}
