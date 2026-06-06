import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, ShieldCheck, TriangleAlert } from 'lucide-react';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';

export const metadata: Metadata = {
  title: 'Auto Engage Policies | ContentOSX',
  description:
    'Readable guidance on what the Auto Engage feature does, what it avoids, and why the first version is intentionally draft-only.',
};

const safeRules = [
  'The feature discovers posts from tracked accounts and keyword search, then drafts replies for you to review manually.',
  'Replies stay draft-only in v1. You copy the text and reply on X yourself.',
  'The system avoids obvious sensitive topics and lets you define extra blocked topics for each profile.',
  'Daily output is intentionally capped at 10 suggestions per account so this stays selective rather than spammy.',
];

const avoidRules = [
  'No autopilot cold replies under random people from keyword search.',
  'No auto-liking, auto-following, or mass engagement loops.',
  'No scraping the X website or simulating browser posting to bypass API and policy limits.',
  'No links in generated replies by default, and no generic “great post” filler replies.',
];

const operatorNotes = [
  'Read the original post before using a draft. Context can shift fast, especially on newsy or emotional threads.',
  'Treat medium-risk suggestions cautiously. If the post feels sensitive, skip it.',
  'Keep the client voice honest. The draft should never claim experience the client does not actually have.',
  'This is an engagement copilot, not a growth hack. Quality and relevance matter more than volume.',
];

export default function AutoEngagePoliciesPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-12">
      <section className="rounded-[2rem] border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(29,155,240,0.16),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.03),transparent_60%)] p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl space-y-4">
            <Badge variant="outline" className="border-[#1d9bf0]/30 bg-[#1d9bf0]/10 text-[#1d9bf0]">
              Draft-only safety model
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Auto Engage is designed to help you engage without sliding into spam.
              </h1>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                The first version deliberately stays conservative. It finds promising posts, drafts responses in the right voice, and leaves the final action to a human.
              </p>
            </div>
          </div>

          <Button asChild variant="outline">
            <Link href="/app/auto-engage">
              <ArrowLeft className="size-4" />
              Back to Auto Engage
            </Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-[#1d9bf0]" />
              <CardTitle>What this version does</CardTitle>
            </div>
            <CardDescription>
              Safe by default, useful immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6">
            {safeRules.map((rule) => (
              <p key={rule}>{rule}</p>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TriangleAlert className="size-5 text-amber-500" />
              <CardTitle>What we intentionally avoid</CardTitle>
            </div>
            <CardDescription>
              These are the lines we do not want v1 crossing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6">
            {avoidRules.map((rule) => (
              <p key={rule}>{rule}</p>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Operator notes</CardTitle>
          <CardDescription>
            Keep the user out of no-man&apos;s-land. The tool should always make the boundaries obvious.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm leading-6 md:grid-cols-2">
          {operatorNotes.map((note) => (
            <div key={note} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
              {note}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>References</CardTitle>
          <CardDescription>
            The guardrails here are based on current X developer docs and automation policy guidance.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="https://help.x.com/en/rules-and-policies/x-automation" target="_blank" rel="noreferrer">
              X automation rules
              <ExternalLink className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="https://docs.x.com/x-api/posts/search/introduction" target="_blank" rel="noreferrer">
              X search docs
              <ExternalLink className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="https://docs.x.com/x-api/posts/timelines/introduction" target="_blank" rel="noreferrer">
              X timelines docs
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
