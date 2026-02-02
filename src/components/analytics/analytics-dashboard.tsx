'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Users, TrendUp, ChartLine } from '@phosphor-icons/react';
import { getLeadMagnetAnalytics, type LeadMagnetAnalytics } from '@/actions/analytics';

type TimeRange = 'today' | 'week' | 'month' | 'all';

export function AnalyticsDashboard() {
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

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Analytics</h2>
                        <p className="text-muted-foreground">Track your lead magnet performance</p>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="p-6 animate-pulse">
                            <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                            <div className="h-8 bg-muted rounded w-3/4"></div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Unable to load analytics</p>
            </div>
        );
    }

    const getStatsForTimeRange = () => {
        switch (timeRange) {
            case 'today':
                return {
                    views: analytics.viewsToday,
                    leads: analytics.leadsToday,
                };
            case 'week':
                return {
                    views: analytics.viewsThisWeek,
                    leads: analytics.leadsThisWeek,
                };
            case 'month':
                return {
                    views: analytics.viewsThisMonth,
                    leads: analytics.leadsThisMonth,
                };
            default:
                return {
                    views: analytics.totalViews,
                    leads: analytics.totalLeads,
                };
        }
    };

    const stats = getStatsForTimeRange();

    return (
        <div className="space-y-6">
            {/* Header with filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Analytics</h2>
                    <p className="text-muted-foreground">Track your lead magnet performance</p>
                </div>

                {/* Time Range Filter */}
                <div className="flex gap-2 p-1 rounded-xl bg-muted/50">
                    {(['today', 'week', 'month', 'all'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === range
                                ? 'bg-background shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {range === 'all' ? 'All Time' : range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-sky-500/10">
                            <Eye className="h-5 w-5 text-sky-600 dark:text-sky-400" weight="duotone" />
                        </div>
                        <h3 className="font-semibold text-sm text-muted-foreground">Total Views</h3>
                    </div>
                    <p className="text-3xl font-bold">{stats.views.toLocaleString()}</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-green-500/10">
                            <Users className="h-5 w-5 text-green-600 dark:text-green-400" weight="duotone" />
                        </div>
                        <h3 className="font-semibold text-sm text-muted-foreground">Total Leads</h3>
                    </div>
                    <p className="text-3xl font-bold">{stats.leads.toLocaleString()}</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                            <TrendUp className="h-5 w-5 text-purple-600 dark:text-purple-400" weight="duotone" />
                        </div>
                        <h3 className="font-semibold text-sm text-muted-foreground">Conversion Rate</h3>
                    </div>
                    <p className="text-3xl font-bold">{analytics.conversionRate}%</p>
                </Card>
            </div>

            {/* Views Over Time Chart (simplified) */}
            {analytics.viewsOverTime.length > 0 && (
                <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <ChartLine className="h-5 w-5 text-muted-foreground" weight="duotone" />
                        <h3 className="font-semibold">Views Over Time</h3>
                    </div>
                    <div className="h-48 flex items-end gap-1">
                        {analytics.viewsOverTime.slice(-14).map((data, i) => {
                            const maxCount = Math.max(...analytics.viewsOverTime.map(d => d.count));
                            const height = maxCount > 0 ? (data.count / maxCount) * 100 : 0;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div
                                        className="w-full bg-sky-500 rounded-t hover:bg-sky-600 transition-colors cursor-pointer relative group"
                                        style={{ height: `${height}%` }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {data.count} views
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Per-Magnet Stats */}
            {analytics.perMagnetStats.length > 0 && (
                <Card className="p-6">
                    <h3 className="font-semibold mb-4">Lead Magnet Performance</h3>
                    <div className="space-y-4">
                        {analytics.perMagnetStats.map(magnet => (
                            <div key={magnet.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                                <div className="flex-1">
                                    <h4 className="font-medium">{magnet.title}</h4>
                                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                                        <span>{magnet.views} views</span>
                                        <span>•</span>
                                        <span>{magnet.leads} leads</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">{magnet.conversionRate}%</p>
                                    <p className="text-xs text-muted-foreground">conversion</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {analytics.perMagnetStats.length === 0 && (
                <Card className="p-12 text-center">
                    <p className="text-muted-foreground">No lead magnets yet. Create one to start tracking analytics!</p>
                </Card>
            )}
        </div>
    );
}
