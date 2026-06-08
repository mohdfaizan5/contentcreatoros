import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, User, ArrowLeft, Clock, BookOpen, ChevronRight } from 'lucide-react';
// import { source } from '@/lib/source';
import type { Metadata } from 'next';
// import { getMDXComponents } from '@/mdx-components';
import { DocsPage } from 'fumadocs-ui/layouts/docs/page';
import { source } from '@/shared/lib/source';
import { getMDXComponents } from '@/shared/components/mdx-components';

interface BlogPostProps {
    params: Promise<{ slug?: string | string[] }>;
}

export default async function BlogPost({ params }: BlogPostProps) {
    const { slug } = await params;
    const slugPath = Array.isArray(slug) ? slug : slug ? [slug] : undefined;
    console.log('Fetched page for slug:', slugPath);

    const allPages = source.getPages();

    const page = source.getPage(slugPath);
    console.log('Fetched page for slug:', slugPath, page);
    if (!page) notFound();
    const MDXContent = page.data.body as React.ComponentType<any>;

    return (
        <DocsPage className="min-h-screen mx-auto bg-background text-foreground">
            {/* Header */}
            <div className=" py-10 md:py-16 px-4 border-b border-border">
                <div className="max-w-4xl mx-auto">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 md:mb-8"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to all posts
                    </Link>

                    <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 md:mb-4">
                        {page.data.title || 'Untitled'}
                    </h1>

                    {page.data.description && (
                        <p className="text-base md:text-xl text-muted-foreground mb-4 md:mb-6">
                            {page.data.description}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{(page.data as { author?: string }).author || 'SaaSFollo Team'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{(page.data as { date?: string }).date || 'Recently'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{(page.data as { readTime?: string }).readTime || '5 min read'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-4 ">
                <article className=" text-card-foreground rounded-xl py-4 md:py-8  prose max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-a:text-primary">
                    <MDXContent components={getMDXComponents() as any} />
                </article>

                {/* Read More Section */}
                {allPages.length > 1 && (
                    <div className="mt-10 md:mt-16">
                        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2">
                            <BookOpen className="h-5 w-5 md:h-6 md:w-6" />
                            More Posts
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            {allPages
                                .filter((p) => {
                                    const pageSlug = p.slugs?.join('/') || '';
                                    const currentSlug = Array.isArray(slugPath) ? slugPath.join('/') : '';
                                    return pageSlug !== currentSlug;
                                })
                                .slice(0, 4)
                                .map((post) => {
                                    const postSlug = post.slugs?.join('/') || '';
                                    return (
                                        <Link
                                            key={postSlug}
                                            href={`/blog/${postSlug}`}
                                            className="group"
                                        >
                                            <div className="bg-card text-card-foreground rounded-xl p-4 md:p-6 shadow-sm border-2 border-transparent hover:border-primary transition-all duration-300 hover:shadow-lg">
                                                <h3 className="font-bold text-sm md:text-base group-hover:text-primary transition-colors mb-2">
                                                    {post.data.title || 'Untitled'}
                                                </h3>
                                                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                                                    {post.data.description || 'No description available'}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                        </div>
                    </div>
                )}

                <section className="mt-12 rounded-2xl border border-border bg-card text-card-foreground px-5 md:px-7 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <p className="text-xl font-bold">Want more practical SaaS breakdowns?</p>
                        <p className="text-muted-foreground text-sm mt-1">Browse all posts and keep shipping momentum.</p>
                    </div>
                    <Link href="/blog" className="inline-flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-sm font-semibold transition-colors">
                        Explore Blog
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </section>
            </div>

            {/* Footer */}
            <footer className="bg-muted/40 py-6 md:py-8 px-4 mt-8 md:mt-12 border-t border-border">
                <div className="max-w-4xl mx-auto text-center">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to all posts
                    </Link>
                </div>
            </footer>
        </DocsPage>
    );
}

export async function generateStaticParams() {
    return source.generateParams();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
    const { slug } = await params;
    if (!slug || slug.length === 0) {
        return {
            title: 'SaaSFollo Blog',
            description: 'Playbooks and field notes for solo founders shipping faster.',
        };
    }
    const page = source.getPage(slug);
    if (!page) notFound();

    const seo = page.data as {
        seoTitle?: string;
        seoDescription?: string;
        keywords?: string[];
        ogImage?: string;
    };
    const title = seo.seoTitle || `${page.data.title} | SaaSFollo Blog`;
    const description = seo.seoDescription || page.data.description || 'Playbooks and field notes for solo founders shipping faster.';

    return {
        title,
        description,
        keywords: seo.keywords,
        openGraph: {
            title,
            description,
            images: seo.ogImage ? [seo.ogImage] : undefined,
            type: 'article',
        },
        twitter: {
            card: seo.ogImage ? 'summary_large_image' : 'summary',
            title,
            description,
            images: seo.ogImage ? [seo.ogImage] : undefined,
        },
    };
}
