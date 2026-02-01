import { Lightbulb, FileText, Sparkle, Stack, LinkSimple, Magnet } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

const quickActions = [
    {
        title: 'Dump an Idea',
        description: 'Capture a raw thought before it escapes',
        href: '/app/ideas',
        icon: Lightbulb,
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
        title: 'Create Template',
        description: 'Build a thinking scaffold for content',
        href: '/app/templates',
        icon: FileText,
        color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
        title: 'Save Inspiration',
        description: 'Collect content that inspires you',
        href: '/app/inspiration',
        icon: Sparkle,
        color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
        title: 'Start a Series',
        description: 'Think in systems, not random posts',
        href: '/app/series',
        icon: Stack,
        color: 'bg-green-500/10 text-green-600 dark:text-green-400',
    },
    {
        title: 'Setup Links',
        description: 'Create your public profile page',
        href: '/app/links',
        icon: LinkSimple,
        color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    },
    {
        title: 'Lead Magnet',
        description: 'Grow your email list',
        href: '/app/lead-magnets',
        icon: Magnet,
        color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    },
];

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Welcome to Content OS</h1>
                <p className="text-muted-foreground mt-2">
                    Your daily system for capturing ideas and creating consistent content.
                </p>
            </div>

            <div>
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {quickActions.map((action) => (
                        <Link
                            key={action.title}
                            href={action.href}
                            className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-md hover:border-primary/50"
                        >
                            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${action.color} mb-4`}>
                                <action.icon className="h-5 w-5" weight="duotone" />
                            </div>
                            <h3 className="font-semibold group-hover:text-primary transition-colors">
                                {action.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {action.description}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="rounded-xl border bg-card p-6">
                <h2 className="text-lg font-semibold mb-2">Philosophy</h2>
                <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground">
                    Content should move from <strong className="text-foreground">raw thought</strong> →
                    <strong className="text-foreground"> structured idea</strong> →
                    <strong className="text-foreground"> repeatable output</strong>.
                </blockquote>
            </div>
        </div>
    );
}
