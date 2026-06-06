'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    BriefcaseIcon,
    CalendarDotsIcon,
    FilesIcon,
    GearIcon,
    House,
    ToolboxIcon,
    XLogoIcon,
} from '@phosphor-icons/react';
import { VscCommentDiscussionSparkle } from "react-icons/vsc";

import Logo from '@/shared/components/logo';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/shared/components/ui/sidebar';
import { cn } from '@/shared/lib/utils';
import { NavBadge } from './nav-badge';
import { TreeStructureIcon } from '@phosphor-icons/react/dist/ssr';

type NavBadgeType = 'new' | 'updated' | 'comingSoon';
type SidebarIcon = React.ComponentType<{ className?: string }>;

interface SidebarNavItem {
    title: string;
    url?: string;
    icon: SidebarIcon;
    color?: string;
    hoverBg?: string;
    badge?: NavBadgeType;
    disabled?: boolean;
}

const DEFAULT_NAV_ICON_COLOR = 'text-muted-foreground';
const DEFAULT_NAV_HOVER_BG = 'hover:bg-muted/70';

const companyNavItems: SidebarNavItem[] = [
    {
        title: 'Dashboard',
        url: '/app',
        icon: House,
        // color: 'text-slate-500',
        // hoverBg: 'hover:bg-slate-500/10',
    },
    {
        title: 'Analytics',
        url: '/app/analytics',
        icon: XLogoIcon,
        // color: 'text-pink-500',
        // hoverBg: 'hover:bg-pink-500/10',
        // badge: 'new',
    },
    {
        title: 'Brand Kit',
        url: '/app/brand-kit',
        icon: BriefcaseIcon,
        // color: 'text-amber-500',
        // badge: 'comingSoon',
        // disabled: true,
    },
];

const contentNavItems: SidebarNavItem[] = [
    {
        title: 'Workflow',
        url: '/app/workflow',
        icon: TreeStructureIcon ,
        // color: 'text-pink-500',
        // hoverBg: 'hover:bg-pink-500/10',
        // badge: 'new',
    },
    {
        title: 'Content Calendar',
        url: '/app/calendar',
        icon: CalendarDotsIcon,
        // color: 'text-pink-500',
        // hoverBg: 'hover:bg-pink-500/10',
        // badge: 'new',
    },
    {
        title: 'Templates',
        url: '/app/templates',
        // icon: FileText,
        icon: FilesIcon,
        // color: 'text-blue-500',
        // hoverBg: 'hover:bg-blue-500/10',
        // badge: 'updated',
    },
    // {
    //     title: 'Tools',
    //     url: '/app/tools',
    //     icon: ToolboxIcon,
    // },
    
    {
        title: 'Auto Engage',
        url: '/app/auto-engage',
        icon: VscCommentDiscussionSparkle,
        badge: 'new',
    },
];

function renderBadge(badge?: NavBadgeType) {
    if (badge === 'new') {
        return <NavBadge isNew />;
    }

    if (badge === 'comingSoon') {
        return <NavBadge isComingSoon />;
    }

    if (badge === 'updated') {
        return <NavBadge isUpdated />;
    }

    return null;
}

function SidebarNavSection({
    items,
    pathname,
}: {
    items: SidebarNavItem[];
    pathname: string;
}) {
    return (
        <SidebarMenu>
            {items.map((item) => {
                const isActive =
                    !item.disabled &&
                    Boolean(
                        item.url &&
                        (pathname === item.url ||
                            (item.url !== '/app' && pathname.startsWith(`${item.url}/`))),
                    );
                const iconColor = item.color ?? DEFAULT_NAV_ICON_COLOR;
                const hoverBg = item.hoverBg ?? DEFAULT_NAV_HOVER_BG;
                const sharedClassName = cn(
                    'transition-all duration-200',
                    !isActive && !item.disabled && hoverBg,
                );

                if (item.disabled) {
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                aria-disabled="true"
                                className={cn(
                                    sharedClassName,
                                    'cursor-not-allowed opacity-65 hover:bg-transparent',
                                )}
                                tooltip={`${item.title} (Coming soon)`}
                            >
                                <item.icon className={cn('size-4 shrink-0', iconColor)} />
                                <span className="group-data-[collapsible=icon]:hidden">
                                    {item.title}
                                </span>
                                {item.badge ? (
                                    <span className="ml-auto group-data-[collapsible=icon]:hidden">
                                        {renderBadge(item.badge)}
                                    </span>
                                ) : null}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                }

                return (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            render={<Link href={item.url ?? '#'} />}
                            isActive={isActive}
                            tooltip={item.title}
                            className={sharedClassName}
                        >
                            <item.icon
                                className={cn(
                                    'size-4 shrink-0 transition-opacity duration-200',
                                    iconColor,
                                    !isActive && 'opacity-90',
                                )}
                            />
                            <span
                                className={cn(
                                    'group-data-[collapsible=icon]:hidden',
                                    isActive && 'font-medium',
                                )}
                            >
                                {item.title}
                            </span>
                            {item.badge ? (
                                <span className="ml-auto group-data-[collapsible=icon]:hidden">
                                    {renderBadge(item.badge)}
                                </span>
                            ) : null}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                );
            })}
        </SidebarMenu>
    );
}

export function AppSidebar() {
    const pathname = usePathname();

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="border-b border-sidebar-border py-4">
                <Logo
                    full
                    height={24}
                    width={24}
                    className="ml-2 gap-0 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:py-[1.5px]"
                    textClassName="group-data-[collapsible=icon]:hidden bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-base font-bold text-transparent"
                />
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">
                        Company
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarNavSection items={companyNavItems} pathname={pathname} />
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">
                        Content
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarNavSection items={contentNavItems} pathname={pathname} />
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="space-y-3 border-sidebar-border border-t">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            render={<Link href="/app/settings" />}
                            tooltip="Settings"
                            className="transition-all duration-200 hover:bg-muted"
                        >
                            <GearIcon className="transition-transform duration-300 hover:rotate-90" />
                            <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
