import {
    LandingHeader,
    LandingHero,
    LandingCryptoEntry,
    LandingExpansion,
    LandingFooter
} from '@/features/(public)/landing';
import BentoGrid from '@/features/(public)/landing/bento-grids';
import FAQSection from '@/features/(public)/landing/faq-section';

export default function Home() {
    return (
        <main className="min-h-screen overflow-x-hidden bg-white">
            <LandingHeader />
            <section id="hero" data-nav-theme="dark">
                <LandingHero />
            </section>
            <section id="features" data-nav-theme="light">
                <BentoGrid />
            </section>
            <section id="templates" data-nav-theme="light">
                <LandingCryptoEntry />
            </section>
            <section id="faq" data-nav-theme="dark">
                <FAQSection />
            </section>
            <section id="series" data-nav-theme="dark">
                <LandingExpansion />
            </section>
            <section id="footer" data-nav-theme="dark">
                <LandingFooter />
            </section>
        </main>
    );
}
