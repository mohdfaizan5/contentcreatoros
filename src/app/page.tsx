import {
    LandingHeader,
    LandingHero,
    LandingCryptoEntry,
    LandingExpansion,
    LandingFooter
} from '@/features/(public)/landing';
import BentoGrid from '@/features/(public)/landing/bento-grids';
import FAQSection from '@/features/(public)/landing/faq-section';
import { createClient } from '@/shared/lib/supabase/server';

export default async function Home() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isAuthenticated = Boolean(user);

    return (
        <main className="min-h-screen overflow-x-hidden bg-white">
            <LandingHeader isAuthenticated={isAuthenticated} />
            <section id="hero" data-nav-theme="dark">
                <LandingHero isAuthenticated={isAuthenticated} />
            </section>
            <section id="features" data-nav-theme="light">
                <BentoGrid />
            </section>
            <section id="templates" data-nav-theme="light">
                <LandingCryptoEntry isAuthenticated={isAuthenticated} />
            </section>
            <section id="faq" data-nav-theme="dark">
                <FAQSection />
            </section>
            <section id="series" data-nav-theme="dark">
                <LandingExpansion isAuthenticated={isAuthenticated} />
            </section>
            <section id="footer" data-nav-theme="dark">
                <LandingFooter isAuthenticated={isAuthenticated} />
            </section>
        </main>
    );
}
