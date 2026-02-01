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

const mainNavItems = [
    {
        title: 'Dashboard',
        url: '/app',
        icon: House,
    },
    {
        title: 'Ideas',
        url: '/app/ideas',
        icon: Lightbulb,
    },
    {
        title: 'Templates',
        url: '/app/templates',
        icon: FileText,
    },
    {
        title: 'Inspiration',
        url: '/app/inspiration',
        icon: Sparkle,
    },
    {
        title: 'Planning',
        url: '/app/planning',
        icon: CalendarBlank,
    },
    {
        title: 'Series',
        url: '/app/series',
        icon: Stack,
    },
];

const growthNavItems = [
    {
        title: 'Links',
        url: '/app/links',
        icon: LinkSimple,
    },
    {
        title: 'Lead Magnets',
        url: '/app/lead-magnets',
        icon: Magnet,
    },
];

export function AppSidebar() {
    const pathname = usePathname();

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="border-b border-sidebar-border">
                <div className="flex items-center gap-2 px-2 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                        C
                    </div>
                    <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">
                        Content OS
                    </span>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Content</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainNavItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.url}
                                        tooltip={item.title}
                                    >
                                        <Link href={item.url}>
                                            <item.icon weight={pathname === item.url ? 'fill' : 'regular'} />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Growth</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {growthNavItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.url}
                                        tooltip={item.title}
                                    >
                                        <Link href={item.url}>
                                            <item.icon weight={pathname === item.url ? 'fill' : 'regular'} />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Settings">
                            <Link href="/app/settings">
                                <GearIcon />
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
