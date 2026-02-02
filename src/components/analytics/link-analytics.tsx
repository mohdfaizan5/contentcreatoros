'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Eye, ChartBar } from '@phosphor-icons/react';
import { getProfileAnalytics, type ProfileAnalytics } from '@/actions/analytics';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type TimeRange = 'today' | 'week' | 'month' | 'all';

export function ProfileViewsAnalytics() {
    const [analytics, setAnalytics] = useState<ProfileAnalytics | null>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadAnalytics() {
            setLoading(true);
            const data = await getProfileAnalytics(timeRange);
            setAnalytics(data);
            setLoading(false);
        }
        loadAnalytics();
    }, [timeRange]);

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-muted rounded w-32 ml-auto"></div>
                <div className="h-48 bg-muted rounded"></div>
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

    const getViewsForTimeRange = () => {
        switch (timeRange) {
            case 'today':
                return analytics.viewsToday;
            case 'week':
                return analytics.viewsThisWeek;
            case 'month':
                return analytics.viewsThisMonth;
            default:
                return analytics.totalViews;
        }
    };

    const views = getViewsForTimeRange();

    return (
        <div className="space-y-4">
            {/* Header with dropdown */}
            <div className="flex justify-end">
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
            </div>

            {/* View Count Card */}
            <Card className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-sky-500/10">
                            <Eye className="h-5 w-5 text-sky-600 dark:text-sky-400" weight="duotone" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Profile Views</p>
                            <p className="text-3xl font-bold">{views.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Compact Chart */}
            {analytics.viewsOverTime.length > 0 ? (
                <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <ChartBar className="h-4 w-4 text-muted-foreground" weight="duotone" />
                        <span className="text-sm font-medium">Views Over Time</span>
                    </div>

                    {/* Simple Bar Chart */}
                    <div className="h-32 flex items-end gap-1">
                        {analytics.viewsOverTime.slice(-14).map((data, i) => {
                            const maxCount = Math.max(...analytics.viewsOverTime.map(d => d.count), 1);
                            const height = (data.count / maxCount) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                        className="w-full bg-sky-500 rounded-t hover:opacity-80 transition-opacity cursor-pointer relative group"
                                        style={{ height: `${height}%`, minHeight: data.count > 0 ? '4px' : '0' }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none">
                                            {data.count} view{data.count !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            ) : (
                <Card className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">No view data yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Share your profile link to start tracking views</p>
                </Card>
            )}
        </div>
    );
}
