// Link utility functions
// Auto-detect platform from URL and provide matching icons/colors

import {
    TwitterLogo,
    YoutubeLogo,
    InstagramLogo,
    GithubLogo,
    LinkedinLogo,
    TiktokLogo,
    DiscordLogo,
    TwitchLogo,
    SpotifyLogo,
    ApplePodcastsLogo,
    Envelope,
    Globe,
    LinkSimple,
    ShoppingBag,
    Storefront,
    Coffee,
    CurrencyDollar,
    MapPin,
    Phone,
    CalendarBlank,
    FileText,
    Play,
    ChatCircle,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

export interface PlatformInfo {
    id: string;
    name: string;
    icon: Icon;
    color: string;
    bgColor: string;
    borderColor: string;
}

// Platform detection patterns
const platformPatterns: { pattern: RegExp; platform: string }[] = [
    // Social Media
    { pattern: /twitter\.com|x\.com/i, platform: 'twitter' },
    { pattern: /youtube\.com|youtu\.be/i, platform: 'youtube' },
    { pattern: /instagram\.com/i, platform: 'instagram' },
    { pattern: /github\.com/i, platform: 'github' },
    { pattern: /linkedin\.com/i, platform: 'linkedin' },
    { pattern: /tiktok\.com/i, platform: 'tiktok' },
    { pattern: /discord\.(gg|com)/i, platform: 'discord' },
    { pattern: /twitch\.tv/i, platform: 'twitch' },
    { pattern: /threads\.net/i, platform: 'threads' },

    // Podcasts & Music
    { pattern: /spotify\.com/i, platform: 'spotify' },
    { pattern: /podcasts\.apple\.com|apple\.com\/.*podcast/i, platform: 'apple-podcasts' },

    // Shopping & Support
    { pattern: /amazon\./i, platform: 'amazon' },
    { pattern: /gumroad\.com/i, platform: 'gumroad' },
    { pattern: /buymeacoffee\.com|ko-fi\.com/i, platform: 'coffee' },
    { pattern: /patreon\.com/i, platform: 'patreon' },
    { pattern: /paypal\.(com|me)/i, platform: 'paypal' },

    // Utility
    { pattern: /mailto:/i, platform: 'email' },
    { pattern: /tel:/i, platform: 'phone' },
    { pattern: /maps\.google|google\.com\/maps|maps\.apple/i, platform: 'location' },
    { pattern: /calendly\.com|cal\.com/i, platform: 'calendar' },
    { pattern: /substack\.com/i, platform: 'substack' },
    { pattern: /medium\.com/i, platform: 'medium' },

    // Video
    { pattern: /vimeo\.com/i, platform: 'vimeo' },
    { pattern: /loom\.com/i, platform: 'loom' },
];

// Platform configurations
const platforms: Record<string, PlatformInfo> = {
    twitter: {
        id: 'twitter',
        name: 'X (Twitter)',
        icon: TwitterLogo,
        color: 'text-sky-500',
        bgColor: 'bg-sky-500/10',
        borderColor: 'border-sky-500/20',
    },
    youtube: {
        id: 'youtube',
        name: 'YouTube',
        icon: YoutubeLogo,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
    },
    instagram: {
        id: 'instagram',
        name: 'Instagram',
        icon: InstagramLogo,
        color: 'text-pink-500',
        bgColor: 'bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10',
        borderColor: 'border-pink-500/20',
    },
    github: {
        id: 'github',
        name: 'GitHub',
        icon: GithubLogo,
        color: 'text-gray-800 dark:text-gray-200',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/20',
    },
    linkedin: {
        id: 'linkedin',
        name: 'LinkedIn',
        icon: LinkedinLogo,
        color: 'text-blue-600',
        bgColor: 'bg-blue-600/10',
        borderColor: 'border-blue-600/20',
    },
    tiktok: {
        id: 'tiktok',
        name: 'TikTok',
        icon: TiktokLogo,
        color: 'text-black dark:text-white',
        bgColor: 'bg-gray-900/10 dark:bg-white/10',
        borderColor: 'border-gray-900/20 dark:border-white/20',
    },
    discord: {
        id: 'discord',
        name: 'Discord',
        icon: DiscordLogo,
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-500/10',
        borderColor: 'border-indigo-500/20',
    },
    twitch: {
        id: 'twitch',
        name: 'Twitch',
        icon: TwitchLogo,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
    },
    threads: {
        id: 'threads',
        name: 'Threads',
        icon: ChatCircle,
        color: 'text-black dark:text-white',
        bgColor: 'bg-gray-900/10 dark:bg-white/10',
        borderColor: 'border-gray-900/20 dark:border-white/20',
    },
    spotify: {
        id: 'spotify',
        name: 'Spotify',
        icon: SpotifyLogo,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
    },
    'apple-podcasts': {
        id: 'apple-podcasts',
        name: 'Apple Podcasts',
        icon: ApplePodcastsLogo,
        color: 'text-purple-600',
        bgColor: 'bg-purple-600/10',
        borderColor: 'border-purple-600/20',
    },
    amazon: {
        id: 'amazon',
        name: 'Amazon',
        icon: ShoppingBag,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
    },
    gumroad: {
        id: 'gumroad',
        name: 'Gumroad',
        icon: Storefront,
        color: 'text-pink-500',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/20',
    },
    coffee: {
        id: 'coffee',
        name: 'Buy Me a Coffee',
        icon: Coffee,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20',
    },
    patreon: {
        id: 'patreon',
        name: 'Patreon',
        icon: CurrencyDollar,
        color: 'text-orange-600',
        bgColor: 'bg-orange-600/10',
        borderColor: 'border-orange-600/20',
    },
    paypal: {
        id: 'paypal',
        name: 'PayPal',
        icon: CurrencyDollar,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
    },
    email: {
        id: 'email',
        name: 'Email',
        icon: Envelope,
        color: 'text-gray-600',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/20',
    },
    phone: {
        id: 'phone',
        name: 'Phone',
        icon: Phone,
        color: 'text-green-600',
        bgColor: 'bg-green-600/10',
        borderColor: 'border-green-600/20',
    },
    location: {
        id: 'location',
        name: 'Location',
        icon: MapPin,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
    },
    calendar: {
        id: 'calendar',
        name: 'Calendar',
        icon: CalendarBlank,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
    },
    substack: {
        id: 'substack',
        name: 'Substack',
        icon: FileText,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
    },
    medium: {
        id: 'medium',
        name: 'Medium',
        icon: FileText,
        color: 'text-gray-800 dark:text-gray-200',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/20',
    },
    vimeo: {
        id: 'vimeo',
        name: 'Vimeo',
        icon: Play,
        color: 'text-cyan-500',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/20',
    },
    loom: {
        id: 'loom',
        name: 'Loom',
        icon: Play,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
    },
    website: {
        id: 'website',
        name: 'Website',
        icon: Globe,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
    },
    default: {
        id: 'default',
        name: 'Link',
        icon: LinkSimple,
        color: 'text-gray-500',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/20',
    },
};

/**
 * Detect the platform from a URL
 */
export function detectPlatform(url: string): string {
    for (const { pattern, platform } of platformPatterns) {
        if (pattern.test(url)) {
            return platform;
        }
    }

    // Check if it's a general website
    try {
        new URL(url);
        return 'website';
    } catch {
        return 'default';
    }
}

/**
 * Get platform info for a given platform ID or URL
 */
export function getPlatformInfo(platformOrUrl: string): PlatformInfo {
    // First check if it's a known platform ID
    if (platforms[platformOrUrl]) {
        return platforms[platformOrUrl];
    }

    // Otherwise, detect from URL
    const detectedPlatform = detectPlatform(platformOrUrl);
    return platforms[detectedPlatform] || platforms.default;
}

/**
 * Get the icon component for a platform
 */
export function getPlatformIcon(platformOrUrl: string): Icon {
    return getPlatformInfo(platformOrUrl).icon;
}

/**
 * Get all available platforms for display
 */
export function getAllPlatforms(): PlatformInfo[] {
    return Object.values(platforms).filter(p => p.id !== 'default');
}
