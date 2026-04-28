/**
 * URL Detection Utilities
 * Detects platform, content type, and extracts IDs from social media URLs
 */

export type Platform = 'x' | 'linkedin' | 'youtube' | 'instagram' | 'link';
export type ContentType = 'post' | 'profile' | 'video' | 'channel' | 'reel' | 'unknown';

interface UrlInfo {
    platform: Platform;
    contentType: ContentType;
    isPost: boolean;
    isProfile: boolean;
    tweetId?: string;
    username?: string;
}

// Platform detection patterns
const patterns = {
    x: {
        post: /^https?:\/\/(twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/,
        profile: /^https?:\/\/(twitter\.com|x\.com)\/(\w+)\/?$/,
    },
    linkedin: {
        post: /^https?:\/\/(www\.)?linkedin\.com\/(posts|feed\/update)/,
        profile: /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+/,
        company: /^https?:\/\/(www\.)?linkedin\.com\/company\/[\w-]+/,
    },
    youtube: {
        video: /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/,
        shorts: /^https?:\/\/(www\.)?youtube\.com\/shorts\/([\w-]+)/,
        channel: /^https?:\/\/(www\.)?youtube\.com\/(c\/|channel\/|@)([\w-]+)/,
    },
    instagram: {
        post: /^https?:\/\/(www\.)?instagram\.com\/p\/([\w-]+)/,
        reel: /^https?:\/\/(www\.)?instagram\.com\/reel\/([\w-]+)/,
        profile: /^https?:\/\/(www\.)?instagram\.com\/([\w.]+)\/?$/,
    },
};

/**
 * Detect platform and content type from URL
 */
export function detectUrlInfo(url: string): UrlInfo {
    const trimmedUrl = url.trim();

    // X/Twitter
    const xPostMatch = trimmedUrl.match(patterns.x.post);
    if (xPostMatch) {
        return {
            platform: 'x',
            contentType: 'post',
            isPost: true,
            isProfile: false,
            tweetId: xPostMatch[3],
            username: xPostMatch[2],
        };
    }

    const xProfileMatch = trimmedUrl.match(patterns.x.profile);
    if (xProfileMatch && !trimmedUrl.includes('/status/')) {
        return {
            platform: 'x',
            contentType: 'profile',
            isPost: false,
            isProfile: true,
            username: xProfileMatch[2],
        };
    }

    // LinkedIn
    if (patterns.linkedin.post.test(trimmedUrl)) {
        return {
            platform: 'linkedin',
            contentType: 'post',
            isPost: true,
            isProfile: false,
        };
    }

    if (patterns.linkedin.profile.test(trimmedUrl) || patterns.linkedin.company.test(trimmedUrl)) {
        return {
            platform: 'linkedin',
            contentType: 'profile',
            isPost: false,
            isProfile: true,
        };
    }

    // YouTube
    const ytVideoMatch = trimmedUrl.match(patterns.youtube.video);
    if (ytVideoMatch) {
        return {
            platform: 'youtube',
            contentType: 'video',
            isPost: true,
            isProfile: false,
        };
    }

    if (patterns.youtube.shorts.test(trimmedUrl)) {
        return {
            platform: 'youtube',
            contentType: 'video',
            isPost: true,
            isProfile: false,
        };
    }

    if (patterns.youtube.channel.test(trimmedUrl)) {
        return {
            platform: 'youtube',
            contentType: 'channel',
            isPost: false,
            isProfile: true,
        };
    }

    // Instagram
    if (patterns.instagram.post.test(trimmedUrl)) {
        return {
            platform: 'instagram',
            contentType: 'post',
            isPost: true,
            isProfile: false,
        };
    }

    if (patterns.instagram.reel.test(trimmedUrl)) {
        return {
            platform: 'instagram',
            contentType: 'reel',
            isPost: true,
            isProfile: false,
        };
    }

    const igProfileMatch = trimmedUrl.match(patterns.instagram.profile);
    if (igProfileMatch && !['p', 'reel', 'explore', 'accounts'].includes(igProfileMatch[2])) {
        return {
            platform: 'instagram',
            contentType: 'profile',
            isPost: false,
            isProfile: true,
            username: igProfileMatch[2],
        };
    }

    // Default: generic link
    return {
        platform: 'link',
        contentType: 'unknown',
        isPost: false,
        isProfile: false,
    };
}

/**
 * Extract tweet ID from X/Twitter URL
 */
export function extractTweetId(url: string): string | null {
    const match = url.match(/status\/(\d+)/);
    return match ? match[1] : null;
}

/**
 * Get platform display name
 */
export function getPlatformLabel(platform: Platform): string {
    const labels: Record<Platform, string> = {
        x: 'X',
        linkedin: 'LinkedIn',
        youtube: 'YouTube',
        instagram: 'Instagram',
        link: 'Link',
    };
    return labels[platform];
}

/**
 * Get platform color classes
 */
export function getPlatformColors(platform: Platform): { bg: string; text: string; border: string } {
    const colors: Record<Platform, { bg: string; text: string; border: string }> = {
        x: { bg: 'bg-sky-500/10', text: 'text-sky-600', border: 'border-sky-500/30' },
        linkedin: { bg: 'bg-blue-600/10', text: 'text-blue-600', border: 'border-blue-600/30' },
        youtube: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/30' },
        instagram: { bg: 'bg-pink-500/10', text: 'text-pink-600', border: 'border-pink-500/30' },
        link: { bg: 'bg-gray-500/10', text: 'text-gray-600', border: 'border-gray-500/30' },
    };
    return colors[platform];
}
