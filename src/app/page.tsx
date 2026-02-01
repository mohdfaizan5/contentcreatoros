import {
    LandingHeader,
    LandingHero,
    LandingCryptoEntry,
    LandingGrowth,
    LandingManagement,
    LandingExpansion,
    LandingFooter
} from '@/components/landing';

export default function Home() {
    return (
        <main className="min-h-screen overflow-x-hidden">
            <LandingHeader />
            <LandingHero />
            <LandingCryptoEntry />
            <LandingGrowth />
            <LandingManagement />
            <LandingExpansion />
            <LandingFooter />
        </main>
    );
}