import { PricingBento, type PricingPlan } from "@/components/public/bento-pricing";

const pricingPlans: PricingPlan[] = [
  {
    id: "growth",
    name: "Growth",
    // subtitle: "Your done-for-you daily X content engine for consistent startup distribution.",
    description:
      "Built for founders who already know X matters and want a serious content system without hiring a full-time marketer. You give direction once, and we run the monthly content operation for you.",
    monthlyPrice: "$299",
    yearlyPrice: "$2,979",
    monthlyPriceSuffix: "/ month",
    yearlyPriceSuffix: "/ year",
    badge: "Most popular",
    highlight: "Flagship plan for serious growth",
    audienceLabel: "Serious founders who want daily visibility and stronger positioning",
    cadenceLabel: "25-30 posts per month with a consistent daily presence",
    benefits: [
    //   "Done-for-you ideation, writing, formatting, and scheduling",
    //   "Full content mix across text posts, image posts, threads, polls, and Q&A",
    //   "4-5 motion graphics each month for higher-feed contrast",
    //   "More strategic positioning built around growth, proof, and authority",
    ],
    features: [
      "Monthly content plan mapped around your company, audience, and growth goals",
      "Daily founder presence without needing to write every day yourself",
      "Themes can include product updates, industry insights, founder journey, and educational content",
      "Voice can be tuned to professional, witty, bold, or casual brand styles",
    //   "CTAs can optimize for engagement, awareness, or direct conversion",
    //   "Structured variety keeps your feed from becoming repetitive or vanilla",
    ],
    // ctaText: "Choose Growth",
    // secondaryCtaText: "See onboarding flow",
    isFeatured: true,
    testimonials: [
    //   {
    //     id: 1,
    //     name: "Arjun",
    //     role: "Founder",
    //     company: "AI SaaS",
    //     content:
    //       "This is the first setup that felt like leverage instead of another marketing task on my list.",
    //     rating: 5,
    //   },
    //   {
    //     id: 2,
    //     name: "Maya",
    //     role: "Indie hacker",
    //     content:
    //       "The daily presence matters. We stayed active across the month without me disappearing into content work.",
    //     rating: 5,
    //   },
    ],
  },
  {
    id: "basic",
    name: "Basic",
    // subtitle: "A lighter done-for-you plan for founders",
    description:
      "Designed for early founders who want a credible X presence without jumping straight into full daily distribution.",
    monthlyPrice: "$149",
    yearlyPrice: "$1,484",
    monthlyPriceSuffix: "/ month",
    yearlyPriceSuffix: "/ year",
    badge: "Entry plan",
    // audienceLabel: "Early founders testing content as a growth channel",
    cadenceLabel: "8-12 posts per month, usually 2-3 per week",
    benefits: [
      "Done-for-you text-first content support",
      "Some image-based posts mixed in for variety",
      "Light customization around your tone and audience",
    ],
    features: [
    //   "Best for validating whether consistent posting fits your startup",
    //   "Lower-volume plan with less motion and lighter strategic depth",
    //   "Clear upgrade path into Growth once you want a daily content engine",
    ],
    // ctaText: "Start with Basic",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffdf8_0%,#f6f9f7_52%,#ffffff_100%)]">
      <PricingBento plans={pricingPlans} />
      
    </main>
  );
}
