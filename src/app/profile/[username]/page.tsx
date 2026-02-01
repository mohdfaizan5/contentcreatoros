import { notFound } from 'next/navigation';
import { getPublicProfile } from '@/actions/links';
import { LinkSimple } from '@phosphor-icons/react/dist/ssr';

interface PublicProfilePageProps {
    params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
    const { username } = await params;
    const profile = await getPublicProfile(username);

    if (!profile) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            <div className="max-w-md mx-auto px-4 py-12">
                <div className="text-center mb-8">
                    {profile.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt={profile.display_name || profile.username}
                            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-background shadow-lg"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold shadow-lg">
                            {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                        </div>
                    )}

                    <h1 className="text-2xl font-bold">{profile.display_name || profile.username}</h1>

                    {profile.bio && (
                        <p className="text-muted-foreground mt-2">{profile.bio}</p>
                    )}
                </div>

                <div className="space-y-3">
                    {profile.links?.map((link) => (
                        <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-4 px-6 rounded-xl bg-card border shadow-sm hover:shadow-md hover:scale-[1.02] transition-all text-center font-medium"
                        >
                            <LinkSimple className="h-5 w-5" />
                            {link.title}
                        </a>
                    ))}
                </div>

                {(!profile.links || profile.links.length === 0) && (
                    <p className="text-center text-muted-foreground">No links yet</p>
                )}

                <div className="mt-12 text-center">
                    <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        Powered by Content OS
                    </a>
                </div>
            </div>
        </div>
    );
}
