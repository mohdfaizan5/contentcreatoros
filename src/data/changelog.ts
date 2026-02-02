import { Changelog } from '@/types/changelog';

/**
 * Changelog data for the application.
 * Add new entries at the TOP of the array.
 * Follow the format: version, date, title, description, and categorized changes.
 */
export const changelog: Changelog = [
    {
        version: '0.3.0',
        date: 'Feb 2, 2026',
        title: 'Analytics & Inline Editing',
        description: 'Added comprehensive analytics tracking, inline editing capabilities, and enhanced UI with badges and bento grid layouts.',
        improvements: [
            'Added profile view analytics with time range filters (Today/Week/Month/All Time)',
            'Implemented inline editing for inspiration entries with title, notes, and "what worked" fields',
            'Added "UPDATED" badges to sidebar navigation for Templates, Inspiration, Public Profile, and Lead Magnets',
            'Designed bento grid layout for lead magnet stats with Views, Leads, and Conversion Rate',
            'Created public changelog route at /changelog with expandable categories',
            'Implemented expandable sections for Improvements, Fixes, and Patches with counts',
        ],
        fixes: [
            'Fixed RLS policies for public analytics tracking (profile views, lead magnet views, and leads)',
            'Fixed TypeScript errors in sidebar navigation badge rendering',
            'Resolved build errors related to type comparisons',
        ],
        patches: [
            'Updated profile preview UI with subtle edit icon on hover',
            'Improved compact stats component with gradient backgrounds and watermark icons',
            'Enhanced sidebar badges with ml-2 spacing for better alignment',
            'Moved CompactStats component into lead magnets client for better organization',
        ],
    },
    {
        version: '0.2.0',
        date: 'Feb 1, 2026',
        title: 'Public Profiles & Lead Magnets Enhancement',
        description: 'Major update introducing public profile pages, lead magnet functionality, and comprehensive UI/UX improvements.',
        improvements: [
            'Added public profile pages with custom usernames at /profile/[username]',
            'Implemented logo upload feature with 2MB size limit and validation',
            'Added lead magnet creation with email and file delivery options',
            'Created lead magnet landing pages at /m/[slug] for public access',
            'Implemented profile customization with multiple theme options',
            'Added drag-and-drop link reordering functionality',
            'Created analytics dashboard for tracking profile views',
            'Added lead capture forms integrated with profiles',
        ],
        fixes: [
            'Fixed link type/value conflicts in links-client component',
            'Resolved circular reference errors in Supabase migrations',
            'Fixed database schema foreign key constraints',
        ],
        patches: [
            'Renamed "Branding" tab to "Edit" for clarity',
            'Changed "Links" heading to "Public Links"',
            'Updated profile preview to show only image, name, and bio',
            'Added username change warning when editing profile',
            'Improved theme contrast for better readability',
        ],
    },
    {
        version: '0.1.5',
        date: 'Feb 1, 2026',
        title: 'Templates & Content Management',
        description: 'Comprehensive template system with social media previews, mad-libs style editing, and multi-platform support.',
        improvements: [
            'Implemented template creation with platform-specific formatting',
            'Added mad-libs style editor for dynamic content placeholders',
            'Created platform preview component for X, LinkedIn, Instagram, and YouTube',
            'Built template detail pages with social media embeds',
            'Added bento grid layout for template galleries',
            'Implemented example card component for showcasing templates',
            'Created auto-resize textarea for better content editing',
            'Added URL detector utility for identifying social media platforms',
        ],
        fixes: [],
        patches: [
            'Enhanced template form with better validation',
            'Improved template card design with hover effects',
            'Updated template utilities for better placeholder handling',
        ],
    },
    {
        version: '0.1.0',
        date: 'Feb 1, 2026',
        title: 'Core Application Structure',
        description: 'Initial release with complete authentication system, dashboard modules, and foundational UI components.',
        improvements: [
            'Implemented Next.js 15 app with TypeScript and Tailwind CSS',
            'Created Supabase authentication flows (login, sign-up, forgot password, confirm email)',
            'Built dashboard with sidebar navigation and collapsible icon mode',
            'Added Ideas module with idea cards and dump functionality',
            'Implemented Inspiration module with URL detection and platform categorization',
            'Created Series module for organizing content into series',
            'Built Templates module with template creation and management',
            'Added Planning board with drag-and-drop task management',
            'Created Links/Public Profile module for bio link pages',
            'Implemented Lead Magnets module for email collection',
            'Built comprehensive UI component library (Button, Card, Input, Select, Dropdown, etc.)',
            'Added shadcn/ui sidebar component with tooltips',
            'Implemented user dropdown menu with profile and settings',
            'Created landing page sections (Hero, Features, Growth, Footer)',
        ],
        fixes: [],
        patches: [
            'Set up Supabase middleware for authentication',
            'Configured environment variables and client setup',
            'Added database migrations for all tables',
            'Implemented RLS policies for data security',
        ],
    },
    {
        version: '0.0.1',
        date: 'Jan 13, 2026',
        title: 'Initial Setup',
        description: 'Project initialization with Next.js and basic configuration.',
        improvements: [
            'Initialized Next.js application with TypeScript',
            'Set up project structure and dependencies',
            'Configured Tailwind CSS for styling',
            'Added basic routing and layout structure',
        ],
        fixes: [],
        patches: [],
    },
];
