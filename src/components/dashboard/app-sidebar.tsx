'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    GearIcon,
    House,
    XLogoIcon,
} from '@phosphor-icons/react';
import { VscCommentDiscussionSparkle } from "react-icons/vsc";

import Logo from '@/components/logo';
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
} from '@/components/ui/sidebar';
import { NavBadge } from './nav-badge';
import { BriefcaseIcon, CalendarDotsIcon, FilesIcon } from '@phosphor-icons/react/dist/ssr';

type NavBadgeType = 'new' | 'updated' | 'comingSoon';

interface SidebarNavItem {
    title: string;
    url?: string;
    icon: typeof House;
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
];

const contentNavItems: SidebarNavItem[] = [
    {
        title: 'Content Calendar',
        url: '/app/calendar',
        icon: CalendarDotsIcon ,
        // color: 'text-pink-500',
        // hoverBg: 'hover:bg-pink-500/10',
        // badge: 'new',
    },
    {
        title: 'Templates',
        url: '/app/templates',
        // icon: FileText,
        icon: FilesIcon ,
        // color: 'text-blue-500',
        // hoverBg: 'hover:bg-blue-500/10',
        // badge: 'updated',
    },
    {
        title: 'Brand Kit',
        url: '/app/brand-kit',
        icon: BriefcaseIcon ,
        // color: 'text-amber-500',
        // badge: 'comingSoon',
        // disabled: true,
    },
    {
        title: 'Auto Replies',
        // @ts-expect-error react-icons component is not typed to match SidebarNavItem icon signature.
        icon: VscCommentDiscussionSparkle,
        // icon: ChatsTeardropIcon  ,
        // color: 'text-amber-500',
        badge: 'comingSoon',
        disabled: true,
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
                const sharedClassName = `transition-all duration-200 ${!isActive && !item.disabled ? hoverBg : ''
                    }`;

                if (item.disabled) {
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                aria-disabled="true"
                                className={`${sharedClassName} cursor-not-allowed opacity-65 hover:bg-transparent`}
                                tooltip={`${item.title} (Coming soon)`}
                            >
                                <item.icon className={iconColor} weight="regular" />
                                <span>{item.title}</span>
                                {renderBadge(item.badge)}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                }

                return (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.title}
                            className={sharedClassName}
                        >
                            <Link href={item.url ?? '#'} className="group/link">
                                <item.icon
                                    className={`transition-all duration-200 ${iconColor} ${!isActive ? 'opacity-90 group-hover/link:opacity-100' : ''
                                        }`}
                                    weight={isActive ? 'fill' : 'regular'}
                                />
                                <span className={isActive ? 'font-medium' : ''}>
                                    {item.title}
                                </span>
                                {renderBadge(item.badge)}
                            </Link>
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
        <Sidebar collapsible="icon" className="bg-amber-200- text white-">
            <SidebarHeader className="border-b border-sidebar-border py-4 bg-[#030E1F]-">
                <Logo
                    full
                    height={20}
                    width={20}
                    className="ml-2 gap-2 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:py-[1.5px]"
                    textClassName="-text-white group-data-[collapsible=icon]:hidden bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-base font-bold text-transparent"
                />
            </SidebarHeader>

            <SidebarContent className="bg-[#030E1F]-">
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

            <SidebarFooter className="bg-[#030E1F]- border-t-[0.5px] border-sidebar-border space-y-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            tooltip="Settings"
                            className="transition-all duration-200 hover:bg-muted"
                        >
                            <Link href="/app/settings">
                                <GearIcon className="transition-transform duration-300 hover:rotate-90" />
                                <span>Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
