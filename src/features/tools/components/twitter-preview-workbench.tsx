"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bookmark,
  Heart,
  ImagePlus,
  MessageCircle,
  MoonStar,
  Repeat2,
  Share,
  Sparkles,
  SunMedium,
  Trash2,
  Upload,
  Video,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib/utils";

const STANDARD_LIMIT = 280;
const PREMIUM_LIMIT = 25_000;
const DEFAULT_TWEET =
  "Another amazing Demo Day in Belgrade is behind us.\n\nThis one proved that @Solana took over the Balkan region.\n\n30 teams pitched.\n100+ guests showed up IRL.\n2.3k views tuned into a 5-hour X live.\n\n@Superteam is a cheat code.";

type PreviewTheme = "light" | "dark";
type MediaKind = "image" | "gif" | "video";

type MediaPreview = {
  fileName: string;
  kind: MediaKind;
  objectUrl: string;
};

type ActionItem = {
  icon: typeof MessageCircle;
  label: string;
  value?: string;
  hoverClassName: string;
};

function formatPreviewTimestamp() {
  const now = new Date();
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(now);
}

function renderTweetText(text: string) {
  return text.split("\n").map((line, lineIndex) => (
    <p key={`line-${lineIndex}`} className="whitespace-pre-wrap break-words">
      {line.split(/(\s+)/).map((part, partIndex) => {
        const key = `${lineIndex}-${partIndex}`;
        const trimmedPart = part.trim();

        if (!trimmedPart) {
          return <span key={key}>{part}</span>;
        }

        if (/^(https?:\/\/|www\.)/i.test(trimmedPart)) {
          const href = trimmedPart.startsWith("http") ? trimmedPart : `https://${trimmedPart}`;
          return (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-[#1d9bf0]"
            >
              {part}
            </a>
          );
        }

        if (/^[@#][\p{L}\p{N}_]+$/u.test(trimmedPart)) {
          return (
            <span key={key} className="text-[#1d9bf0]">
              {part}
            </span>
          );
        }

        return <span key={key}>{part}</span>;
      })}
    </p>
  ));
}

function MediaFrame({
  media,
  isDark,
}: {
  media: MediaPreview | null;
  isDark: boolean;
}) {
  if (!media) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed p-5 text-sm",
          isDark
            ? "border-white/10 bg-white/[0.03] text-[#71767b]"
            : "border-black/10 bg-black/[0.02] text-[#536471]",
        )}
      >
        Upload an image, GIF, or video to preview how the media card will look inside the tweet.
      </div>
    );
  }

  if (media.kind === "video") {
    return (
      <div className={cn("overflow-hidden rounded-2xl border bg-black", isDark ? "border-white/10" : "border-black/10")}>
        <video
          key={media.objectUrl}
          src={media.objectUrl}
          controls
          className="max-h-[28rem] w-full bg-black object-contain"
        />
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-black", isDark ? "border-white/10" : "border-black/10")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={media.objectUrl}
        alt={media.fileName}
        className="max-h-[28rem] w-full object-cover"
      />
    </div>
  );
}

function TwitterPostCard({
  theme,
  name,
  handle,
  tweet,
  premium,
  media,
}: {
  theme: PreviewTheme;
  name: string;
  handle: string;
  tweet: string;
  premium: boolean;
  media: MediaPreview | null;
}) {
  const isDark = theme === "dark";
  const timestamp = useMemo(() => formatPreviewTimestamp(), []);
  const shellClassName = isDark
    ? "bg-[#000000] text-[#e7e9ea] shadow-[0_32px_100px_-48px_rgba(0,0,0,0.88)]"
    : "bg-white text-[#0f1419] shadow-[0_32px_100px_-48px_rgba(15,20,25,0.32)]";
  const borderClassName = isDark ? "border-white/10" : "border-black/10";
  const subtleTextClassName = isDark ? "text-[#71767b]" : "text-[#536471]";
  const primaryTextClassName = isDark ? "text-[#e7e9ea]" : "text-[#0f1419]";

  const actionItems: ActionItem[] = [
    {
      icon: MessageCircle,
      label: "Replies",
      value: "16",
      hoverClassName: "hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10",
    },
    {
      icon: Repeat2,
      label: "Reposts",
      value: "20",
      hoverClassName: "hover:text-[#00ba7c] hover:bg-[#00ba7c]/10",
    },
    {
      icon: Heart,
      label: "Likes",
      value: "68",
      hoverClassName: "hover:text-[#f91880] hover:bg-[#f91880]/10",
    },
    {
      icon: Bookmark,
      label: "Bookmarks",
      value: "2",
      hoverClassName: "hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10",
    },
    {
      icon: Share,
      label: "Share",
      hoverClassName: "hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10",
    },
  ];

  return (
    <div
      className={cn(
        "w-full max-w-[598px] overflow-hidden rounded-[18px] border transition-all duration-300",
        shellClassName,
        borderClassName,
      )}
    >
      <article className="px-4 py-3">
        <div className="flex gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              isDark ? "bg-[#1d9bf0] text-black" : "bg-[#1d9bf0] text-white",
            )}
          >
            {name.trim().charAt(0).toUpperCase() || "Y"}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[15px] leading-5">
              <span className={cn("font-bold", primaryTextClassName)}>{name}</span>
              {premium ? (
                <span
                  className={cn(
                    "rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]",
                    isDark
                      ? "border-[#2f3336] bg-[#16181c] text-[#e7e9ea]"
                      : "border-[#d7dbdc] bg-[#f7f9f9] text-[#0f1419]",
                  )}
                >
                  Premium
                </span>
              ) : null}
              <span className={subtleTextClassName}>@{handle}</span>
              <span className={subtleTextClassName}>·</span>
              <span className={subtleTextClassName}>Now</span>
            </div>

            <div className={cn("mt-1.5 space-y-4 text-[15px] leading-6 tracking-[0.01em]", primaryTextClassName)}>
              {tweet.trim() ? renderTweetText(tweet) : <p className={subtleTextClassName}>Start typing to preview your post.</p>}
            </div>

            <div className="mt-3">
              <MediaFrame media={media} isDark={isDark} />
            </div>

            <div className={cn("mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[15px]", subtleTextClassName)}>
              <span>{timestamp}</span>
              <span>·</span>
              <span className={primaryTextClassName}>1,265</span>
              <span>Views</span>
            </div>

            <div className={cn("mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-y py-3 text-[15px]", borderClassName)}>
              <div className="flex items-center gap-1.5">
                <span className={cn("font-semibold", primaryTextClassName)}>16</span>
                <span className={subtleTextClassName}>Replies</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn("font-semibold", primaryTextClassName)}>20</span>
                <span className={subtleTextClassName}>Reposts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn("font-semibold", primaryTextClassName)}>68</span>
                <span className={subtleTextClassName}>Likes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn("font-semibold", primaryTextClassName)}>2</span>
                <span className={subtleTextClassName}>Bookmarks</span>
              </div>
            </div>

            <div className="mt-0.5 grid grid-cols-5 items-center">
              {actionItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={cn(
                    "group inline-flex items-center gap-1 rounded-full py-2 text-[13px] transition-colors",
                    subtleTextClassName,
                    item.hoverClassName,
                  )}
                >
                  <span className="inline-flex size-8 items-center justify-center rounded-full transition-colors group-hover:bg-current/10">
                    <item.icon className={cn("size-[18px]", item.icon === BarChart3 && "size-[17px]")} />
                  </span>
                  {item.value ? <span className="hidden sm:inline">{item.value}</span> : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

export function TwitterPreviewWorkbench() {
  const [tweet, setTweet] = useState(DEFAULT_TWEET);
  const [name, setName] = useState("Superteam Balkans");
  const [handle, setHandle] = useState("SuperteamBLKN");
  const [isPremium, setIsPremium] = useState(false);
  const [media, setMedia] = useState<MediaPreview | null>(null);

  const characterLimit = isPremium ? PREMIUM_LIMIT : STANDARD_LIMIT;
  const remainingCharacters = characterLimit - tweet.length;

  useEffect(() => {
    return () => {
      if (media?.objectUrl) {
        URL.revokeObjectURL(media.objectUrl);
      }
    };
  }, [media]);

  function updateMedia(nextFile: File | null) {
    if (media?.objectUrl) {
      URL.revokeObjectURL(media.objectUrl);
    }

    if (!nextFile) {
      setMedia(null);
      return;
    }

    const isVideo = nextFile.type.startsWith("video/");
    const isGif = nextFile.type === "image/gif";

    setMedia({
      fileName: nextFile.name,
      kind: isVideo ? "video" : isGif ? "gif" : "image",
      objectUrl: URL.createObjectURL(nextFile),
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-[linear-gradient(135deg,rgba(29,155,240,0.10),rgba(255,255,255,0)_35%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.24),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.02),rgba(15,23,42,0))] p-6 sm:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(29,155,240,0.12),transparent_58%)] lg:block" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#1d9bf0]/20 bg-[#1d9bf0]/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase text-[#1d9bf0]">
              <Sparkles className="size-3.5" />
              Tools / Twitter Preview
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Preview your tweet before it ever hits publish.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Paste the copy, flip premium mode on or off, upload media, and inspect how the post reads in both X light mode and the true black dark theme.
            </p>
          </div>

          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/app/tools">Back to tools</Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Compose</CardTitle>
            <CardDescription>
              Keep everything local. Nothing leaves your browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="twitter-preview-name">Display name</Label>
                <Input
                  id="twitter-preview-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter-preview-handle">Handle</Label>
                <Input
                  id="twitter-preview-handle"
                  value={handle}
                  onChange={(event) => setHandle(event.target.value.replace(/^@+/, "").replace(/\s+/g, ""))}
                  placeholder="yourhandle"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="twitter-preview-text">Tweet copy</Label>
                <div
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    remainingCharacters < 0
                      ? "bg-red-500/12 text-red-600 dark:text-red-400"
                      : remainingCharacters < 20
                        ? "bg-amber-500/12 text-amber-700 dark:text-amber-300"
                        : "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
                  )}
                >
                  {tweet.length.toLocaleString()} / {characterLimit.toLocaleString()}
                </div>
              </div>

              <Textarea
                id="twitter-preview-text"
                value={tweet}
                onChange={(event) => setTweet(event.target.value)}
                placeholder="Paste your tweet here..."
                textareaClassName="min-h-[240px] resize-y leading-6"
              />
              <p className="text-sm text-muted-foreground">
                {isPremium ? "Premium mode gives you a long-form post preview." : "Standard mode keeps you in the classic short-post range."}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/25 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Label htmlFor="twitter-preview-premium">Premium account</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between a regular post and a long-form premium post preview.
                  </p>
                </div>
                <Switch
                  checked={isPremium}
                  onCheckedChange={setIsPremium}
                  aria-label="Toggle premium account mode"
                  id="twitter-preview-premium"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label htmlFor="twitter-preview-media">Media upload</Label>
                  <p className="text-sm text-muted-foreground">
                    One image, GIF, or video. Client-side preview only.
                  </p>
                </div>
                {media ? (
                  <Button variant="ghost" size="sm" onClick={() => updateMedia(null)}>
                    <Trash2 className="size-4" />
                    Remove
                  </Button>
                ) : null}
              </div>

              <label
                htmlFor="twitter-preview-media"
                className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-border/80 bg-background/70 px-5 py-8 text-center transition-colors hover:border-[#1d9bf0]/50 hover:bg-[#1d9bf0]/[0.04]"
              >
                <div className="flex gap-2">
                  <div className="rounded-full bg-[#1d9bf0]/10 p-3 text-[#1d9bf0]">
                    <Upload className="size-4" />
                  </div>
                  <div className="rounded-full bg-muted p-3 text-muted-foreground">
                    {media?.kind === "video" ? <Video className="size-4" /> : <ImagePlus className="size-4" />}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">
                    {media ? media.fileName : "Drop media here or click to browse"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports JPG, PNG, GIF, MP4, MOV, and similar browser-friendly formats.
                  </p>
                </div>
              </label>
              <input
                id="twitter-preview-media"
                type="file"
                accept="image/*,video/*"
                className="sr-only"
                onChange={(event) => updateMedia(event.target.files?.[0] ?? null)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/70">
          <CardHeader className="border-b border-border/60">
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Compare both X themes or focus on one at a time.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="all" className="gap-0">
              <div className="border-b border-border/60 px-4 py-3">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="light">
                    <SunMedium className="size-4" />
                    Light
                  </TabsTrigger>
                  <TabsTrigger value="dark">
                    <MoonStar className="size-4" />
                    Dark
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="p-4 sm:p-6">
                <div className="grid gap-5 2xl:grid-cols-2">
                  <TwitterPostCard
                    theme="light"
                    name={name || "Your Name"}
                    handle={handle || "yourhandle"}
                    tweet={tweet}
                    premium={isPremium}
                    media={media}
                  />
                  <TwitterPostCard
                    theme="dark"
                    name={name || "Your Name"}
                    handle={handle || "yourhandle"}
                    tweet={tweet}
                    premium={isPremium}
                    media={media}
                  />
                </div>
              </TabsContent>

              <TabsContent value="light" className="p-4 sm:p-6">
                <TwitterPostCard
                  theme="light"
                  name={name || "Your Name"}
                  handle={handle || "yourhandle"}
                  tweet={tweet}
                  premium={isPremium}
                  media={media}
                />
              </TabsContent>

              <TabsContent value="dark" className="p-4 sm:p-6">
                <TwitterPostCard
                  theme="dark"
                  name={name || "Your Name"}
                  handle={handle || "yourhandle"}
                  tweet={tweet}
                  premium={isPremium}
                  media={media}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
