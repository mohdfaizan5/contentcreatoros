'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Eye, Users, TrendUp } from '@phosphor-icons/react';
import { getLeadMagnetAnalytics, type LeadMagnetAnalytics } from '@/actions/analytics';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type TimeRange = 'today' | 'week' | 'month' | 'all';

export function CompactStats() {
    const [analytics, setAnalytics] = useState<LeadMagnetAnalytics | null>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadAnalytics() {
            setLoading(true);
            const data = await getLeadMagnetAnalytics(timeRange);
            setAnalytics(data);
            setLoading(false);
        }
        loadAnalytics();
    }, [timeRange]);

    const getStatsForTimeRange = () => {
        if (!analytics) return { views: 0, leads: 0, conversion: 0 };

        switch (timeRange) {
            case 'today':
                return {
                    views: analytics.viewsToday,
                    leads: analytics.leadsToday,
                    conversion: analytics.conversionRate,
                };
            case 'week':
                return {
                    views: analytics.viewsThisWeek,
                    leads: analytics.leadsThisWeek,
                    conversion: analytics.conversionRate,
                };
            case 'month':
                return {
                    views: analytics.viewsThisMonth,
                    leads: analytics.leadsThisMonth,
                    conversion: analytics.conversionRate,
                };
            default:
                return {
                    views: analytics.totalViews,
                    leads: analytics.totalLeads,
                    conversion: analytics.conversionRate,
                };
        }
    };

    const stats = getStatsForTimeRange();

    if (loading) {
        return (
            <div className="flex items-center gap-3">
                {[1, 2, 3].map(i => (
                    <Card key={i} className="flex-1 p-4 animate-pulse">
                        <div className="h-3 bg-muted rounded w-16 mb-2"></div>
                        <div className="h-6 bg-muted rounded w-12"></div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <section className="flex flex-col  gap-3">
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                <SelectTrigger className="w-32">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
            </Select>
            <section className="flex items-center gap-3 h-48">
                <section className='space-y-4'>
                    <Card className="flex flex-row items-end p-4 relative">
                        <div className="flex items-center gap-2 mb-1">
                            <Eye className="h-10 w-10 absolute -left-2 -top-2 text-sky-500" weight="duotone" />
                            <span className="text-sm text-muted-foreground">Views</span>
                        </div>
                        <p className="text-5xl font-bold">{stats.views.toLocaleString()}</p>
                    </Card>

                    <Card className="flex flex-row items-end p-4 relative">
                        <div className="flex items-center gap-1 mb-1">
                            <Users className="h-10 w-10 absolute -left-2 -top-2 text-green-500" weight="duotone" />
                            <span className="text-sm text-muted-foreground">Leads</span>
                        </div>
                        <p className="text-5xl font-bold">{stats.leads.toLocaleString()}</p>
                    </Card>
                </section>

                <Card className="flex flex-col items-end p-4 relative bg-primary text-white h-full">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendUp className="h-10 w-10 absolute font-bold -left-2 -top-2 text-white/60" weight="duotone" />
                        <span className="text-sm">Conversion</span>
                    </div>
                    <p className="text-5xl font-bold">{stats.conversion}%</p>
                </Card>
            </section>




        </section>
    );
}
