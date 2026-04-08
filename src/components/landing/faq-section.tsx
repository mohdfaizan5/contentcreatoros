"use client"

import { useState } from "react"
import { Badge } from "../ui/badge"

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: "What exactly is ContentOSX?",
    answer:
      "ContentOSX is your operating system for X growth. It helps you capture ideas, structure them into repeatable series, and publish consistently without juggling disconnected tools.",
  },
  {
    question: "Who is this built for?",
    answer:
      "It is designed for solo creators, indie founders, and small teams that want to grow on X with a reliable publishing system instead of random posting spurts.",
  },
  {
    question: "Can I schedule content directly to X?",
    answer:
      "Yes. You can draft, queue, and schedule content from inside ContentOSX. The system handles timing and publishing so your cadence stays consistent even on busy days.",
  },
  {
    question: "Do I need to be a copywriting expert?",
    answer:
      "No. You bring your voice and rough ideas. ContentOSX helps you shape better hooks, structures, and publishing plans so your output sounds sharp without feeling generic.",
  },
  {
    question: "How fast can I start seeing value?",
    answer:
      "Most users start with one content series and feel the difference within the first week: less decision fatigue, fewer missed publishing slots, and clearer topic direction.",
  },
  {
    question: "What if my workflow changes over time?",
    answer:
      "That is expected. ContentOSX is modular, so you can adapt your capture, planning, and publishing flow as your audience, offers, and strategy evolve.",
  },
]

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(160deg,#020617_6%,#0a1020_52%,#000000_100%)] py-20 md:py-24">
      <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-[#1F92F9]/25 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 lg:flex-row lg:gap-12">
        <div className="w-full lg:flex-1">
          <Badge className="border border-white/20 bg-white/10 text-white">FAQ</Badge>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/70 md:text-lg">
            Clear answers about setup, workflow, and how ContentOSX helps you publish better content on a repeatable system.
          </p>
        </div>

        <div className="w-full lg:flex-1">
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm">
            {faqData.map((item, index) => {
              const isOpen = openItems.includes(index)

              return (
                <div key={index} className="w-full overflow-hidden border-b border-white/10 last:border-b-0">
                  <button
                    onClick={() => toggleItem(index)}
                    className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left transition-colors duration-200 hover:bg-white/10"
                    aria-expanded={isOpen}
                  >
                    <div className="flex-1 text-base font-medium leading-6 text-white md:text-lg">
                      {item.question}
                    </div>
                    <div className="flex justify-center items-center">
                      <ChevronDownIcon
                        className={`h-6 w-6 text-white/70 transition-transform duration-300 ease-in-out ${
                          isOpen ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-5 pb-5 text-sm leading-7 text-white/70 md:text-base">
                      {item.answer}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
