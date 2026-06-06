import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LayoutTemplate, Sparkles } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";

export const metadata: Metadata = {
  title: "Tools | ContentOSX",
  description: "Utility tools for previewing and refining content before it goes live.",
};

const tools = [
  {
    href: "/app/tools/twitter-preview",
    title: "Twitter Preview",
    description:
      "Paste copy, toggle premium mode, upload media, and preview the post in X light and dark themes.",
  },
];

export default function ToolsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
      <section className="rounded-[2rem] border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(29,155,240,0.14),transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.03),transparent_55%)] p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#1d9bf0]/15 bg-[#1d9bf0]/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase text-[#1d9bf0]">
          <Sparkles className="size-3.5" />
          Utilities
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Content tools that help before you publish.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Small focused tools live here. Right now you’ve got a dedicated X post visualizer for checking copy and media before the real post goes out.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <Card key={tool.href} className="border-border/70 transition-transform duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="mb-3 inline-flex size-11 items-center justify-center rounded-2xl bg-[#1d9bf0]/10 text-[#1d9bf0]">
                <LayoutTemplate className="size-5" />
              </div>
              <CardTitle>{tool.title}</CardTitle>
              <CardDescription>{tool.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={tool.href}>
                  Open tool
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
