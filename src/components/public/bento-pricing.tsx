"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useInView } from "motion/react";
import { ArrowRight, Check, Sparkles, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface PricingTestimonial {
    id: number;
    name: string;
    role: string;
    company?: string;
    content: string;
    rating: number;
}

export interface PricingPlan {
    id: string;
    name: string;
    // subtitle: string;
    description?: string;
    monthlyPrice: string;
    yearlyPrice: string;
    monthlyPriceSuffix?: string;
    yearlyPriceSuffix?: string;
    badge?: string;
    highlight?: string;
    audienceLabel?: string;
    cadenceLabel: string;
    benefits: string[];
    features: string[];
    ctaText?: string;
    ctaHref?: string;
    secondaryCtaText?: string;
    secondaryCtaHref?: string;
    testimonials?: PricingTestimonial[];
    isFeatured?: boolean;
}

interface PricingBentoProps {
    plans: PricingPlan[];
    className?: string;
}


export const PricingBento: React.FC<PricingBentoProps> = ({ plans, className }) => {
    const [isYearly, setIsYearly] = React.useState(true);
    const featuredPlan = plans.find((plan) => plan.isFeatured) ?? plans[0];
    const supportingPlans = plans.filter((plan) => plan.id !== featuredPlan.id);

    return (
        <section className={cn("w-full py-14 sm:py-20", className)}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="mx-auto max-w-3xl text-center">
                    {/* <Badge className="border border-slate-200 bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700 hover:bg-white">
                        Done-for-you X content
                    </Badge> */}
                    <h1 className="mt-6 font-serif text-4xl  text-slate-950 sm:text-5xl lg:text-5xl">
                        {/* Plans built for founders who want distribution without turning content into a second job. */}
                        Built for founders who want reach, not busywork.
                    </h1>
                    <p className="mt-2 text-base leading-8 text-slate-600 sm:text-lg">
                        {/* Pick the level of support you want and we handle the ideation, creation, formatting, and scheduling for your startup&apos;s X presence. */}
                        We handle the system behind consistent visibility—so you don’t have to.
                    </p>
                    <div className="mt-8 flex items-center justify-center gap-3">
                        <Label
                            htmlFor="billing-toggle"
                            className={cn("text-sm text-slate-500", !isYearly && "font-semibold text-slate-950")}
                        >
                            Monthly
                        </Label>
                        <Switch
                            id="billing-toggle"
                            checked={isYearly}
                            onCheckedChange={setIsYearly}
                            className="data-[state=checked]:bg-slate-950 data-[state=unchecked]:bg-slate-300"
                        />
                        <Label
                            htmlFor="billing-toggle"
                            className={cn("text-sm text-slate-500", isYearly && "font-semibold text-slate-950")}
                        >
                            Yearly (Save ~17%)
                        </Label>
                    </div>
                </div>

                <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:items-start">

                    <div className="flex flex-col gap-6">
                        {supportingPlans.map((plan) => (
                            <BasicPlanCard key={plan.id} plan={plan} isYearly={isYearly} />
                        ))}

                    </div>
                    <div className="lg:col-span-2 self-start">
                        <GrowthPlanCard plan={featuredPlan} isYearly={isYearly} />
                    </div>
                </div>

                {/* Unique Request Card */}
                <div className="flex  justify-between rounded-lg border bg-card p-6 text-card-foreground shadow-sm mt-4">
                    <section>

                        <h3 className="text-xl font-semibold">Unique Request</h3>
                        <p className="mt-2 text-muted-foreground">
                            Are you looking for something custom? Don&apos;t hesitate to contact us, and we&apos;ll help brainstorm your product to success.
                        </p>
                    </section>
                    <div className="mt-6">
                        <CtaButton variant="outline" className="w-full md:w-auto" text="Let&apos;s Talk" />
                    </div>
                </div>
            </div>
        </section>
    );
};


const parsePriceValue = (price: string) => Number(price.replace(/[$,]/g, ""));

const getDisplayedPrice = (plan: PricingPlan, isYearly: boolean) => {
    const monthlyBase = parsePriceValue(plan.monthlyPrice);
    const yearlyBase = parsePriceValue(plan.yearlyPrice);
    const monthlyEquivalent = Math.round(yearlyBase / 12);
    const yearlySavings = monthlyBase * 12 - yearlyBase;

    if (isYearly) {
        return {
            value: `$${monthlyEquivalent}`,
            suffix: "/ month",
            compareAt: plan.monthlyPrice,
            savingsLabel: `Save $${yearlySavings}`,
            billedLabel: `Billed annually at ${plan.yearlyPrice}`,
        };
    }

    return {
        value: plan.monthlyPrice,
        suffix: plan.monthlyPriceSuffix ?? "/ month",
        compareAt: null,
        savingsLabel: null,
        billedLabel: null,
    };
};

const Rating = ({ value }: { value: number }) => (
    <div className="flex items-center gap-1">
        {Array.from({ length: value }).map((_, index) => (
            <Star key={index} className="h-3.5 w-3.5 fill-current text-amber-500" />
        ))}
    </div>
);

const CtaButton = ({
    text,
    href,
    variant = "default",
    className,
}: {
    text: string;
    href?: string;
    variant?: "default" | "outline";
    className?: string;
}) => {
    if (href) {
        return (
            <Button asChild variant={variant} className={className}>
                <Link href={href}>
                    <span>{text}</span>
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </Button>
        );
    }

    return (
        <Button variant={variant} className={className}>
            <span>{text}</span>
            <ArrowRight className="h-4 w-4" />
        </Button>
    );
};

const GrowthPlanCard = ({ plan, isYearly }: { plan: PricingPlan; isYearly: boolean }) => {
    const sectionRef = React.useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.25 });
    const [testimonialIndex, setTestimonialIndex] = React.useState(0);
    const testimonials = plan.testimonials ?? [];
    const displayedPrice = getDisplayedPrice(plan, isYearly);

    React.useEffect(() => {
        if (testimonials.length <= 1) return;

        const interval = window.setInterval(() => {
            setTestimonialIndex((current) => (current + 1) % testimonials.length);
        }, 4500);

        return () => window.clearInterval(interval);
    }, [testimonials.length]);

    return (
        <Card
            ref={sectionRef}
            className="relative self-start overflow-hidden border border-emerald-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.18),_transparent_34%),linear-gradient(145deg,_rgba(255,255,255,0.98),_rgba(244,252,248,0.96))] shadow-[0_24px_80px_-34px_rgba(16,185,129,0.45)]"
        >
            <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(16,185,129,0.04),transparent)]" />
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-200/40 blur-3xl" />

            <div className="relative grid gap-0 lg:grid-cols-[minmax(0,0.94fr)_minmax(280px,0.72fr)]">
                <div className="flex flex-col px-4 py-4">
                    <div className="mb-5 flex flex-wrap items-center gap-3">
                        {plan.badge ? (
                            <Badge className="border absolute -top-5 left-0 border-emerald-300/60 bg-emerald-100/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-900 hover:bg-emerald-100">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                {plan.badge}
                            </Badge>
                        ) : null}
                        {plan.highlight ? (
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-800/80">
                                {plan.highlight}
                            </span>
                        ) : null}
                    </div>

                    <div className="max-w-xl">
                        <h2 className="font-serif text-3xl leading-tight text-slate-950 sm:text-4xl">
                            {plan.name}
                        </h2>
                        {/* <p className="mt-2 text-lg text-slate-600">{plan.subtitle}</p> */}
                        {plan.description ? (
                            <p className=" text-sm leading-5 text-slate-600">{plan.description}</p>

                        ) : null}
                    </div>

                    <div className="mt-8 flex flex-wrap items-end gap-x-3 gap-y-2">
                        <div className="font-serif text-5xl leading-none text-slate-950 sm:text-6xl">
                            {displayedPrice.value}
                        </div>
                        <div className="pb-1 text-sm uppercase tracking-[0.2em] text-slate-500">
                            {displayedPrice.suffix}
                        </div>
                        {displayedPrice.compareAt ? (
                            <div className="pb-1 text-lg text-slate-400 line-through">
                                {displayedPrice.compareAt}
                            </div>
                        ) : null}
                        {displayedPrice.savingsLabel ? (
                            <Badge className="border border-emerald-300/60 bg-emerald-100/90 px-3 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-100">
                                {displayedPrice.savingsLabel}
                            </Badge>
                        ) : null}
                    </div>
                    {displayedPrice.billedLabel ? (
                        <p className="mt-3 text-sm text-slate-500">{displayedPrice.billedLabel}</p>
                    ) : null}

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        {
                            plan.audienceLabel && (
                                <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Best for</p>
                                    <p className="mt-2 text-sm font-medium text-slate-900">{plan.audienceLabel}</p>
                                </div>
                            )

                        }
                        < div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Publishing cadence</p>
                            <p className="mt-2 text-sm font-medium text-slate-900">{plan.cadenceLabel}</p>
                        </div>
                    </div>

                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                        {plan.benefits.length > 0 && plan.benefits.map((benefit, index) => (
                            <motion.div
                                key={benefit}
                                initial={{ opacity: 0, y: 14 }}
                                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
                                transition={{ delay: 0.15 + index * 0.05, duration: 0.4 }}
                                className="flex items-start gap-3 rounded-2xl border border-emerald-100/80 bg-white/70 p-4 text-sm text-slate-700"
                            >
                                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                    <Check className="h-3.5 w-3.5" />
                                </span>
                                <span>{benefit}</span>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">

                        {plan.ctaText && (
                            <CtaButton
                                text={plan.ctaText}
                                href={plan.ctaHref}
                                className="h-12 flex-1 justify-between bg-slate-950 px-5 text-white hover:bg-slate-800"
                            />
                        )}
                        {plan.secondaryCtaText ? (
                            <CtaButton
                                text={plan.secondaryCtaText}
                                href={plan.secondaryCtaHref}
                                variant="outline"
                                className="h-12 flex-1 justify-between border-slate-300 bg-white/70 px-5 text-slate-900 hover:bg-white"
                            />
                        ) : null}
                    </div>
                </div>

                <div className="border-t border-emerald-100/80  px-7 py-7 text-black lg:border-l lg:border-t-0 lg:px-8 lg:py-9">
                    <div className="flex items-center justify-between gap-4">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                            Included in Growth
                        </h3>
                        <Badge className="border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] text-white hover:bg-white/10">
                            Daily presence
                        </Badge>
                    </div>

                    <div className="mt-2">
                        {plan.features.map((feature, index) => (
                            <motion.div
                                key={feature}
                                initial={{ opacity: 0, x: 16 }}
                                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 16 }}
                                transition={{ delay: 0.3 + index * 0.04, duration: 0.4 }}
                                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5"
                            >
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                                    <Check className="h-3 w-3 text-black" />
                                </span>
                                <span className="text-sm leading-6 ">{feature}</span>
                            </motion.div>
                        ))}
                    </div>

                    {testimonials.length > 0 ? (
                        <>
                            <Separator className="my-6 bg-white/10" />
                            <div className="relative min-h-[154px] overflow- rounded-2xl border border bg-white/5 p-4">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={testimonials[testimonialIndex].id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -16 }}
                                        transition={{ duration: 0.35 }}
                                        className="absolute inset-0 flex flex-col justify-between p-4"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-semibold ">
                                                    {testimonials[testimonialIndex].name}
                                                </p>
                                                <p className="mt-1 text-xs ">
                                                    {testimonials[testimonialIndex].role}
                                                    {testimonials[testimonialIndex].company
                                                        ? ` at ${testimonials[testimonialIndex].company}`
                                                        : ""}
                                                </p>
                                            </div>
                                            <Rating value={testimonials[testimonialIndex].rating} />
                                        </div>
                                        <p className="mt-4 text-sm leading-6 ">
                                            &ldquo;{testimonials[testimonialIndex].content}&rdquo;
                                        </p>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {testimonials.length > 1 ? (
                                <div className="mt-4 flex justify-center gap-1.5">
                                    {testimonials.map((testimonial, index) => (
                                        <button
                                            key={testimonial.id}
                                            type="button"
                                            onClick={() => setTestimonialIndex(index)}
                                            aria-label={`Show testimonial ${index + 1}`}
                                            className={cn(
                                                "h-1.5 rounded-full transition-all",
                                                index === testimonialIndex
                                                    ? "w-5 bg-emerald-300"
                                                    : "w-1.5 bg-white/20"
                                            )}
                                        />
                                    ))}
                                </div>
                            ) : null}
                        </>
                    ) : null}
                </div>
            </div>
        </Card >
    );
};

const BasicPlanCard = ({ plan, isYearly }: { plan: PricingPlan; isYearly: boolean }) => {
    const displayedPrice = getDisplayedPrice(plan, isYearly);

    return (
        <Card className="self-start overflow-hidden border border-slate-200 bg-white shadow-[0_20px_60px_-36px_rgba(15,23,42,0.3)]">
            <div className="px-6 py-6 sm:px-7 sm:py-7">
                <div className="flex flex-col items-start justify-between gap-3">
                    <div>
                        {plan.badge ? (
                            <Badge className="border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700 hover:bg-slate-50">
                                {plan.badge}
                            </Badge>
                        ) : null}
                        <h3 className="mt-4 font-serif text-3xl text-slate-950">{plan.name}</h3>
                        {/* <p className="mt-2 text-sm leading-6 text-slate-600">{plan.subtitle}</p> */}
                    </div>
                    {plan.description && (
                        <p className=" text-sm leading-5 text-slate-600">{plan.description}</p>
                    )}


                    <div className="flex gap-2 items-baseline">
                        <div className="font-serif text-4xl leading-none text-slate-950">{displayedPrice.value}</div>
                        <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                            {displayedPrice.suffix}
                        </div>
                        {displayedPrice.compareAt ? (
                            <div className="mt-2 text-sm text-slate-400 line-through">{displayedPrice.compareAt}</div>
                        ) : null}
                        {displayedPrice.savingsLabel ? (
                            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                {displayedPrice.savingsLabel}
                            </div>
                        ) : null}
                    </div>
                    {displayedPrice.billedLabel ? (
                        <p className="mt-3 text-sm text-slate-500">{displayedPrice.billedLabel}</p>
                    ) : null}
                </div>


                <div className="mt-6 grid gap-3">
                    {plan.audienceLabel && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Best for</p>
                            <p className="mt-2 text-sm font-medium text-slate-900">{plan.audienceLabel}</p>
                        </div>
                    )
                    }


                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Publishing cadence</p>
                        <p className="mt-2 text-sm font-medium text-slate-900">{plan.cadenceLabel}</p>
                    </div>
                </div>

                <div className="mt-6 space-y-3">
                    {plan.benefits.length > 0 && plan.benefits.map((benefit) => (
                        <div key={benefit} className="flex items-start gap-3 text-sm text-slate-700">
                            <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                                <Check className="h-3 w-3" />
                            </span>
                            <span>{benefit}</span>
                        </div>
                    ))}
                </div>

                {/* <Separator className="my-6 bg-slate-200" /> */}

                <div className="space-y-3">
                    {plan.features.length > 0 && plan.features.map((feature) => (
                        <div key={feature} className="rounded-2xl border border-slate-200 p-3 text-sm leading-6 text-slate-700">
                            {feature}
                        </div>
                    ))}
                </div>
            </div>

            {/* {plan.ctaText || plan.secondaryCtaText && (

                <div className="border-t border-slate-200 bg-slate-50/70 p-6 sm:p-7">

                    {plan.ctaText && (<CtaButton
                        text={plan.ctaText}
                        href={plan.ctaHref}
                        className="h-12 w-full justify-between bg-slate-950 px-5 text-white hover:bg-slate-800"
                    />)}
                    {plan.secondaryCtaText ? (
                        <CtaButton
                            text={plan.secondaryCtaText}
                            href={plan.secondaryCtaHref}
                            variant="outline"
                            className="mt-3 h-12 w-full justify-between border-slate-300 bg-white px-5 text-slate-900 hover:bg-slate-100"
                        />
                    ) : null}
                </div>
            )} */}
        </Card >
    );
};
