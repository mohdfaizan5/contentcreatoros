import { notFound } from 'next/navigation';
import { getPublicProfile } from '@/actions/links';
import { getTemplate, getCardBorderRadius } from '@/lib/profile-templates';
import { PublicLinksList } from '@/components/links/public-links';
import { trackProfileView } from '@/actions/analytics';
import type { Metadata } from 'next';

interface PublicProfilePageProps {
    params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
    const { username } = await params;
    const profile = await getPublicProfile(username);

    if (!profile) {
        return {
            title: 'Profile Not Found | Content Creator OS',
        };
    }

    const title = profile.display_name
        ? `${profile.display_name} | Content Creator OS`
        : 'Content Creator OS';

    return {
        title,
        description: profile.bio || profile.tagline || `Check out ${profile.display_name || profile.username}'s profile`,
    };
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
    const { username } = await params;
    const profile = await getPublicProfile(username);

    if (!profile) {
        notFound();
    }

    // Track profile view (fire and forget - don't await)
    trackProfileView(profile.id).catch(() => {
        // Silently fail - analytics shouldn't break the page
    });

    const template = getTemplate(profile.template_id);
    const borderRadius = getCardBorderRadius(template.styles.cardStyle);

    return (
        <div className={`min-h-screen ${template.styles.background}`}>
            <div className="max-w-md mx-auto px-4 pt-12 pb-8">
                {/* Profile Header */}
                <div className="text-center mb-8">
                    {/* Avatar/Logo */}
                    {profile.logo_url || profile.avatar_url ? (
                        <img
                            src={profile.logo_url || profile.avatar_url!}
                            alt={profile.display_name || profile.username}
                            className="w-24 h-24 mx-auto mb-4 object-cover border-4 border-white shadow-xl rounded-full"
                        />
                    ) : (
                        <div
                            className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold shadow-lg bg-white/20 backdrop-blur-sm border border-white/30 ${template.styles.headerTextColor}`}
                            style={profile.accent_color ? { backgroundColor: profile.accent_color, color: '#fff' } : undefined}
                        >
                            {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                        </div>
                    )}

                    {/* Name */}
                    <h1 className={`text-2xl font-bold ${template.styles.headerTextColor} ${template.styles.fontFamily}`}>
                        {profile.display_name || profile.username}
                    </h1>

                    {/* Tagline */}
                    {profile.tagline && (
                        <p className={`mt-1 text-sm ${template.styles.headerMutedColor}`}>
                            {profile.tagline}
                        </p>
                    )}

                    {/* Bio */}
                    {profile.bio && (
                        <p className={`mt-3 ${template.styles.headerMutedColor}`}>
                            {profile.bio}
                        </p>
                    )}
                </div>

                {/* Links - Client Component */}
                <PublicLinksList
                    links={profile.links || []}
                    template={{
                        cardBg: template.styles.cardBg,
                        cardBorder: template.styles.cardBorder,
                        cardShadow: template.styles.cardShadow,
                        cardHover: template.styles.cardHover,
                        fontFamily: template.styles.fontFamily,
                        cardTextColor: template.styles.cardTextColor,
                    }}
                    borderRadius={borderRadius}
                    accentColor={profile.accent_color}
                />

                {/* Footer */}
                <div className="py-8 text-center">
                    <a
                        href="/"
                        className={`text-sm transition-colors ${template.styles.headerMutedColor} hover:opacity-80`}
                    >
                        Powered by Content OS
                    </a>
                </div>
            </div>
        </div>
    );
}
