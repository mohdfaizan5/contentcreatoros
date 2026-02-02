'use client';

import { getPlatformInfo } from '@/lib/link-utils';
import type { Link as LinkType } from '@/types/database';

interface PublicLinkCardProps {
    link: LinkType;
    template: {
        cardBg: string;
        cardBorder: string;
        cardShadow: string;
        cardHover: string;
        fontFamily: string;
        cardTextColor: string;
    };
    borderRadius: string;
    accentColor?: string | null;
}

export function PublicLinkCard({ link, template, borderRadius, accentColor }: PublicLinkCardProps) {
    const platformInfo = getPlatformInfo(link.icon || link.url);
    const PlatformIcon = platformInfo.icon;

    return (
        <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex items-center gap-4 w-full py-4 px-5 ${borderRadius} ${template.cardBg} ${template.cardBorder} ${template.cardShadow} ${template.cardHover} transition-all duration-300`}
            style={accentColor ? {
                '--tw-ring-color': accentColor,
            } as React.CSSProperties : undefined}
        >
            {/* Platform Icon */}
            <div className={`h-10 w-10 ${borderRadius} flex items-center justify-center shrink-0 ${platformInfo.bgColor} border ${platformInfo.borderColor}`}>
                <PlatformIcon
                    className={`h-5 w-5 ${platformInfo.color}`}
                    weight="fill"
                />
            </div>

            {/* Title */}
            <span className={`flex-1 font-medium ${template.cardTextColor} ${template.fontFamily}`}>
                {link.title}
            </span>

            {/* Arrow */}
            <svg
                className={`h-5 w-5 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all ${template.cardTextColor} opacity-50`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </a>
    );
}

interface PublicLinksListProps {
    links: LinkType[];
    template: {
        cardBg: string;
        cardBorder: string;
        cardShadow: string;
        cardHover: string;
        fontFamily: string;
        cardTextColor: string;
    };
    borderRadius: string;
    accentColor?: string | null;
}

export function PublicLinksList({ links, template, borderRadius, accentColor }: PublicLinksListProps) {
    if (!links || links.length === 0) {
        return (
            <p className={`text-center ${template.cardTextColor} opacity-60`}>
                No links yet
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {links.map((link) => (
                <PublicLinkCard
                    key={link.id}
                    link={link}
                    template={template}
                    borderRadius={borderRadius}
                    accentColor={accentColor}
                />
            ))}
        </div>
    );
}
