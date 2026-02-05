'use client';

import { useState, useEffect } from 'react';
import { Plus, Lightbulb, Sparkle, Brain, Lightning } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const PROMPTS = [
    { text: "Create a new idea", icon: Plus },
    { text: "Brain dump  ", icon: Brain },
    { text: "Spark a thought", icon: Sparkle },
    { text: "Capture magic", icon: Lightning },
    { text: "Something brilliant", icon: Lightbulb },
];

export function DynamicCreateButton() {
    const [index, setIndex] = useState(0);

    // Rotate through prompts every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % PROMPTS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const current = PROMPTS[index];
    const Icon = current.icon;

    return (
        <Link
            href="/app/ideas/new"
            className="relative group block w-fit overflow-hidden rounded-xl bg-primary text-primary-foreground font-medium shadow-lg hover:shadow-xl hover:bg-primary/90 transition-shadow duration-300 active:scale-95"
        >
            <motion.div
                layout
                className="flex items-center gap-3 px-6 py-2 justify-center"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
                {/* Icon Animation */}
                <div className="relative w-5 h-5 shrink-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`icon-${index}`}
                            initial={{ scale: 0, rotate: -90, opacity: 0 }}
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            exit={{ scale: 0, rotate: 90, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <Icon className="w-5 h-5" weight="bold" />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Text Animation */}
                <div className="relative h-6 flex items-center overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={index}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{
                                y: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            className="whitespace-nowrap"
                        >
                            {current.text}
                        </motion.span>
                    </AnimatePresence>
                    {/* Invisible spacer to reserve height/alignment if needed, but here we want fluid width */}
                </div>
            </motion.div>

            {/* Shine effect on hover */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-shine bg-linear-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        </Link>
    );
}
