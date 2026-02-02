'use server';

import { createClient } from '@/lib/server';
import { headers } from 'next/headers';
import crypto from 'crypto';

// Helper function to hash IP for privacy
function hashIP(ip: string): string {
    return crypto.createHash('sha256').update(ip).digest('hex');
}

// ============================================
// TRACKING FUNCTIONS
// ============================================

/**
 * Track a profile view
 */
export async function trackProfileView(profileId: string): Promise<void> {
    const supabase = await createClient();
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || null;
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] ||
        headersList.get('x-real-ip') ||
        'unknown';
    const ipHash = hashIP(ip);

    await supabase
        .from('profile_views')
        .insert({
            profile_id: profileId,
            user_agent: userAgent,
            ip_hash: ipHash,
        });
}

/**
 * Track a lead magnet view
 */
export async function trackLeadMagnetView(leadMagnetId: string): Promise<void> {
    const supabase = await createClient();
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || null;
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] ||
        headersList.get('x-real-ip') ||
        'unknown';
    const ipHash = hashIP(ip);

    await supabase
        .from('lead_magnet_views')
        .insert({
            lead_magnet_id: leadMagnetId,
            user_agent: userAgent,
            ip_hash: ipHash,
        });
}

/**
 * Track a link click
 */
export async function trackLinkClick(linkId: string, profileId: string): Promise<void> {
    const supabase = await createClient();
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || null;
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] ||
        headersList.get('x-real-ip') ||
        'unknown';
    const ipHash = hashIP(ip);

    await supabase
        .from('link_clicks')
        .insert({
            link_id: linkId,
            profile_id: profileId,
            user_agent: userAgent,
            ip_hash: ipHash,
        });
}

// ============================================
// ANALYTICS FETCHING FUNCTIONS
// ============================================

export interface LinkClickAnalytics {
    totalClicks: number;
    clicksToday: number;
    clicksThisWeek: number;
    clicksThisMonth: number;
    clicksOverTime: { date: string; count: number }[];
    perLinkStats: {
        linkId: string;
        linkTitle: string;
        linkUrl: string;
        clicks: number;
    }[];
}

export interface ProfileAnalytics {
    totalViews: number;
    viewsToday: number;
    viewsThisWeek: number;
    viewsThisMonth: number;
    viewsOverTime: { date: string; count: number }[];
}

export interface LeadMagnetAnalytics {
    totalViews: number;
    totalLeads: number;
    conversionRate: number;
    viewsToday: number;
    viewsThisWeek: number;
    viewsThisMonth: number;
    leadsToday: number;
    leadsThisWeek: number;
    leadsThisMonth: number;
    viewsOverTime: { date: string; count: number }[];
    leadsOverTime: { date: string; count: number }[];
    perMagnetStats: {
        id: string;
        title: string;
        views: number;
        leads: number;
        conversionRate: number;
    }[];
}

/**
 * Get profile analytics for the authenticated user
 */
export async function getProfileAnalytics(timeRange: 'today' | 'week' | 'month' | 'all' = 'all'): Promise<ProfileAnalytics | null> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return null;

    // Get user's profile
    const { data: profile } = await supabase
        .from('link_profiles')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

    if (!profile) return null;

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all views
    const { data: allViews } = await supabase
        .from('profile_views')
        .select('viewed_at')
        .eq('profile_id', profile.id)
        .order('viewed_at', { ascending: false });

    if (!allViews) {
        return {
            totalViews: 0,
            viewsToday: 0,
            viewsThisWeek: 0,
            viewsThisMonth: 0,
            viewsOverTime: [],
        };
    }

    // Calculate stats
    const views = allViews.map((v: { viewed_at: string }) => new Date(v.viewed_at));
    const viewsToday = views.filter((d: Date) => d >= today).length;
    const viewsThisWeek = views.filter((d: Date) => d >= weekAgo).length;
    const viewsThisMonth = views.filter((d: Date) => d >= monthAgo).length;

    // Group by date for chart
    const viewsByDate: Record<string, number> = {};
    views.forEach((date: Date) => {
        const dateKey = date.toISOString().split('T')[0];
        viewsByDate[dateKey] = (viewsByDate[dateKey] || 0) + 1;
    });

    const viewsOverTime = Object.entries(viewsByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30); // Last 30 days

    return {
        totalViews: allViews.length,
        viewsToday,
        viewsThisWeek,
        viewsThisMonth,
        viewsOverTime,
    };
}

/**
 * Get lead magnet analytics for the authenticated user
 */
export async function getLeadMagnetAnalytics(timeRange: 'today' | 'week' | 'month' | 'all' = 'all'): Promise<LeadMagnetAnalytics | null> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return null;

    // Get user's lead magnets
    const { data: magnets } = await supabase
        .from('lead_magnets')
        .select('id, title')
        .eq('user_id', userData.user.id);

    if (!magnets || magnets.length === 0) {
        return {
            totalViews: 0,
            totalLeads: 0,
            conversionRate: 0,
            viewsToday: 0,
            viewsThisWeek: 0,
            viewsThisMonth: 0,
            leadsToday: 0,
            leadsThisWeek: 0,
            leadsThisMonth: 0,
            viewsOverTime: [],
            leadsOverTime: [],
            perMagnetStats: [],
        };
    }

    const magnetIds = magnets.map((m: { id: string; title: string }) => m.id);

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all views
    const { data: allViews } = await supabase
        .from('lead_magnet_views')
        .select('viewed_at, lead_magnet_id')
        .in('lead_magnet_id', magnetIds)
        .order('viewed_at', { ascending: false });

    // Get all leads
    const { data: allLeads } = await supabase
        .from('lead_magnet_leads')
        .select('created_at, lead_magnet_id')
        .in('lead_magnet_id', magnetIds)
        .order('created_at', { ascending: false });

    const totalViews = allViews?.length || 0;
    const totalLeads = allLeads?.length || 0;
    const conversionRate = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0;

    // Calculate time-based stats
    const views = (allViews || []).map((v: { viewed_at: string; lead_magnet_id: string }) => ({ date: new Date(v.viewed_at), magnetId: v.lead_magnet_id }));
    const leads = (allLeads || []).map((l: { created_at: string; lead_magnet_id: string }) => ({ date: new Date(l.created_at), magnetId: l.lead_magnet_id }));

    const viewsToday = views.filter((v: { date: Date; magnetId: string }) => v.date >= today).length;
    const viewsThisWeek = views.filter((v: { date: Date; magnetId: string }) => v.date >= weekAgo).length;
    const viewsThisMonth = views.filter((v: { date: Date; magnetId: string }) => v.date >= monthAgo).length;

    const leadsToday = leads.filter((l: { date: Date; magnetId: string }) => l.date >= today).length;
    const leadsThisWeek = leads.filter((l: { date: Date; magnetId: string }) => l.date >= weekAgo).length;
    const leadsThisMonth = leads.filter((l: { date: Date; magnetId: string }) => l.date >= monthAgo).length;

    // Group by date for charts
    const viewsByDate: Record<string, number> = {};
    views.forEach(({ date }: { date: Date; magnetId: string }) => {
        const dateKey = date.toISOString().split('T')[0];
        viewsByDate[dateKey] = (viewsByDate[dateKey] || 0) + 1;
    });

    const leadsByDate: Record<string, number> = {};
    leads.forEach(({ date }: { date: Date; magnetId: string }) => {
        const dateKey = date.toISOString().split('T')[0];
        leadsByDate[dateKey] = (leadsByDate[dateKey] || 0) + 1;
    });

    const viewsOverTime = Object.entries(viewsByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30);

    const leadsOverTime = Object.entries(leadsByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30);

    // Per-magnet stats
    const perMagnetStats = magnets.map((magnet: { id: string; title: string }) => {
        const magnetViews = views.filter((v: { date: Date; magnetId: string }) => v.magnetId === magnet.id).length;
        const magnetLeads = leads.filter((l: { date: Date; magnetId: string }) => l.magnetId === magnet.id).length;
        const magnetConversion = magnetViews > 0 ? (magnetLeads / magnetViews) * 100 : 0;

        return {
            id: magnet.id,
            title: magnet.title,
            views: magnetViews,
            leads: magnetLeads,
            conversionRate: Math.round(magnetConversion * 10) / 10,
        };
    });

    return {
        totalViews,
        totalLeads,
        conversionRate: Math.round(conversionRate * 10) / 10,
        viewsToday,
        viewsThisWeek,
        viewsThisMonth,
        leadsToday,
        leadsThisWeek,
        leadsThisMonth,
        viewsOverTime,
        leadsOverTime,
        perMagnetStats,
    };
}

/**
 * Get leads for a specific lead magnet
 */
export async function getLeadMagnetLeads(leadMagnetId: string) {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    // Verify ownership
    const { data: magnet } = await supabase
        .from('lead_magnets')
        .select('id')
        .eq('id', leadMagnetId)
        .eq('user_id', userData.user.id)
        .single();

    if (!magnet) throw new Error('Lead magnet not found');

    const { data: leads, error } = await supabase
        .from('lead_magnet_leads')
        .select('*')
        .eq('lead_magnet_id', leadMagnetId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return leads;
}

/**
 * Get link click analytics for the authenticated user
 */
export async function getLinkClickAnalytics(timeRange: 'today' | 'week' | 'month' | 'all' = 'all'): Promise<LinkClickAnalytics | null> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return null;

    // Get user's profile
    const { data: profile } = await supabase
        .from('link_profiles')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

    if (!profile) return null;

    // Get all links for the profile
    const { data: links } = await supabase
        .from('links')
        .select('id, title, url')
        .eq('profile_id', profile.id)
        .eq('is_active', true);

    if (!links || links.length === 0) {
        return {
            totalClicks: 0,
            clicksToday: 0,
            clicksThisWeek: 0,
            clicksThisMonth: 0,
            clicksOverTime: [],
            perLinkStats: [],
        };
    }

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all clicks
    const { data: allClicks } = await supabase
        .from('link_clicks')
        .select('clicked_at, link_id')
        .eq('profile_id', profile.id)
        .order('clicked_at', { ascending: false });

    if (!allClicks) {
        return {
            totalClicks: 0,
            clicksToday: 0,
            clicksThisWeek: 0,
            clicksThisMonth: 0,
            clicksOverTime: [],
            perLinkStats: [],
        };
    }

    // Calculate stats
    const clicks = allClicks.map((c: { clicked_at: string; link_id: string }) => ({ date: new Date(c.clicked_at), linkId: c.link_id }));
    const clicksToday = clicks.filter((c: { date: Date; linkId: string }) => c.date >= today).length;
    const clicksThisWeek = clicks.filter((c: { date: Date; linkId: string }) => c.date >= weekAgo).length;
    const clicksThisMonth = clicks.filter((c: { date: Date; linkId: string }) => c.date >= monthAgo).length;

    // Group by date for chart
    const clicksByDate: Record<string, number> = {};
    clicks.forEach(({ date }: { date: Date; linkId: string }) => {
        const dateKey = date.toISOString().split('T')[0];
        clicksByDate[dateKey] = (clicksByDate[dateKey] || 0) + 1;
    });

    const clicksOverTime = Object.entries(clicksByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30); // Last 30 days

    // Per-link stats
    const perLinkStats = links.map((link: { id: string; title: string; url: string }) => {
        const linkClicks = clicks.filter((c: { date: Date; linkId: string }) => c.linkId === link.id).length;
        return {
            linkId: link.id,
            linkTitle: link.title,
            linkUrl: link.url,
            clicks: linkClicks,
        };
    }).filter((stat: { clicks: number }) => stat.clicks > 0) // Only show links with clicks
        .sort((a: { clicks: number }, b: { clicks: number }) => b.clicks - a.clicks); // Sort by clicks descending

    return {
        totalClicks: allClicks.length,
        clicksToday,
        clicksThisWeek,
        clicksThisMonth,
        clicksOverTime,
        perLinkStats,
    };
}
