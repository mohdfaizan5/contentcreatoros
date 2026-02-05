'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Lightbulb,
    FileText,
    Sparkle,
    CalendarBlank,
    Stack,
    LinkSimple,
    Magnet,
    House,
    Robot,
} from '@phosphor-icons/react';

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
import { GearIcon } from '@phosphor-icons/react';
import Logo from '@/components/logo';
import { NavBadge } from './nav-badge';

const mainNavItems = [
    {
        title: 'Dashboard',
        url: '/app',
        icon: House,
        color: 'text-slate-500',
        hoverBg: 'hover:bg-slate-500/10',
    },
    {
        title: 'Ideas',
        url: '/app/ideas',
        icon: Lightbulb,
        color: 'text-amber-500',
        hoverBg: 'hover:bg-amber-500/10',
    },
    {
        title: 'Templates',
        url: '/app/templates',
        icon: FileText,
        color: 'text-blue-500',
        hoverBg: 'hover:bg-blue-500/10',
        badge: 'updated' as const,
    },
    {
        title: 'Inspiration',
        url: '/app/inspiration',
        icon: Sparkle,
        color: 'text-purple-500',
        hoverBg: 'hover:bg-purple-500/10',
        badge: 'updated' as const,
    },
    {
        title: 'Planning',
        url: '/app/planning',
        icon: CalendarBlank,
        color: 'text-cyan-500',
        hoverBg: 'hover:bg-cyan-500/10',
    },
    {
        title: 'Series',
        url: '/app/series',
        icon: Stack,
        color: 'text-green-500',
        hoverBg: 'hover:bg-green-500/10',
    },
    {
        title: 'AI Assistant',
        url: '/app/ai',
        icon: Robot,
        color: 'text-pink-500',
        hoverBg: 'hover:bg-pink-500/10',
        badge: 'new' as const,
    },
];

const growthNavItems = [
    {
        title: 'Public Profile',
        url: '/app/public-profile',
        icon: LinkSimple,
        color: 'text-sky-500',
        hoverBg: 'hover:bg-sky-500/10',
        badge: 'updated' as const,
    },
    {
        title: 'Lead Magnets',
        url: '/app/lead-magnets',
        icon: Magnet,
        color: 'text-rose-500',
        hoverBg: 'hover:bg-rose-500/10',
        badge: 'updated' as const,
    },
];

export function AppSidebar() {
    const pathname = usePathname();

    return (
        <Sidebar collapsible="icon" className='bg-amber-200- text white-'>
            <SidebarHeader className="border-b border-sidebar-border py-4 bg-[#030E1F]-">
                <Logo
                    full
                    height={20}
                    width={20}
                    className="ml-2 gap-2 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:py-[1.5px]"

                    textClassName="-text-white group-data-[collapsible=icon]:hidden bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-base font-bold text-transparent"
                />
            </SidebarHeader>

            <SidebarContent className='bg-[#030E1F]-'>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">Content</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainNavItems.map((item) => {
                                const isActive = pathname === item.url;
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.title}
                                            className={`transition-all duration-200 ${!isActive ? item.hoverBg : ''}`}
                                        >
                                            <Link href={item.url} className="group/link">
                                                <item.icon
                                                    className={`transition-all duration-200 ${isActive ? '' : 'group-hover/link:' + item.color}`}
                                                    weight={isActive ? 'fill' : 'regular'}
                                                />
                                                <span className={isActive ? 'font-medium' : ''}>{item.title}</span>
                                                {'badge' in item && item.badge && <NavBadge isUpdated />}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">Growth</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {growthNavItems.map((item) => {
                                const isActive = pathname === item.url;
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.title}
                                            className={`transition-all duration-200 ${!isActive ? item.hoverBg : ''}`}
                                        >
                                            <Link href={item.url} className="group/link">
                                                <item.icon
                                                    className={`transition-all duration-200 ${isActive ? '' : 'group-hover/link:' + item.color}`}
                                                    weight={isActive ? 'fill' : 'regular'}
                                                />
                                                <span className={isActive ? 'font-medium' : ''}>{item.title}</span>
                                                {'badge' in item && item.badge && <NavBadge isUpdated />}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="bg-[#030E1F]- border-t-[0.5px] border-sidebar-border space-y-3">
                {/* Feedback Card */}
                <div className="mx-2 p-3 rounded-xl bg-linear-to-br from-blue-500/90 to-blue-600/90 text-white group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium leading-snug">
                        We're actively building this tool!
                    </p>
                    <p className="text-xs text-white/80 mt-1">
                        Got feedback or questions? We'd love to hear from you.
                    </p>
                    <div className="flex gap-2 mt-3">
                        <button className="flex-1 px-3 py-1.5 text-xs font-medium bg-white text-blue-600 rounded-lg hover:bg-white/90 transition-colors">
                            Give Feedback
                        </button>
                        <button className="flex-1 px-3 py-1.5 text-xs font-medium bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors">
                            Learn More
                        </button>
                    </div>
                </div>

                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Settings" className="transition-all duration-200 hover:bg-muted">
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
