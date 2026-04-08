'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HouseIcon, PaletteIcon, PanelsTopLeftIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type BrandKitShellProps = {
  answeredCount: number;
  children: ReactNode;
  totalQuestionCount: number;
};

const tabs = [
  {
    href: '/app/brand-kit',
    icon: HouseIcon,
    label: 'Overview',
  },
  {
    badgeVariant: 'question-count' as const,
    href: '/app/brand-kit/voice',
    icon: PanelsTopLeftIcon,
    label: 'Brand Voice',
  },
  {
    href: '/app/brand-kit/visuals',
    icon: PaletteIcon,
    label: 'Visual Identity',
  },
];

function isTabActive(pathname: string, href: string) {
  if (href === '/app/brand-kit') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function BrandKitShell({
  answeredCount,
  children,
  totalQuestionCount,
}: BrandKitShellProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-8">
      <div className="rounded-4xl border border-slate-200 bg-[#1384FF] p-6 text-white shadow-[0_24px_80px_-60px_rgba(15,23,42,0.35)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary">Brand settings</Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">Company X Profile Toolkit</h1>
              <p className="max-w-3xl text-sm leading-6">
                Keep your company X profile consistent by aligning voice, content intent, and
                visual identity from one workspace.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge variant="outline" className="border-slate-200 px-3 py-1">
              {answeredCount} saved values
            </Badge>
            <Badge variant="outline" className="border-slate-200 px-3 py-1">
              onboarding_answers
            </Badge>
          </div>
        </div>
      </div>

      <ScrollArea>
        <div className="mb-3 flex h-auto gap-2 rounded-none border-b bg-transparent px-0 py-1 text-foreground">
          {tabs.map((tab) => {
            const active = isTabActive(pathname, tab.href);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'after:-mb-1 relative inline-flex items-center rounded-md px-3 py-2 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5',
                  active
                    ? 'bg-transparent text-foreground shadow-none after:bg-primary'
                    : 'text-foreground/70 hover:bg-accent hover:text-foreground after:bg-transparent',
                )}
              >
                <Icon aria-hidden="true" className="-ms-0.5 me-1.5 opacity-60" size={16} />
                {tab.label}
                {tab.badgeVariant === 'question-count' ? (
                  <Badge className="ms-1.5 min-w-5 bg-primary/15 px-1" variant="secondary">
                    {totalQuestionCount}
                  </Badge>
                ) : null}
              </Link>
            );
          })}
        </div>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {children}
    </div>
  );
}
