import Link from 'next/link';
import { ArrowSquareOut, CalendarDots, ChartLineUp, ChatCircle, Heart, Quotes, TrendUp, Users, XLogo } from '@phosphor-icons/react/dist/ssr';
import { redirect } from 'next/navigation';

import { getCurrentUserLinkedXHandle, hasStoredXConnectionForCurrentUser } from '@/features/x/lib/x-auth';
import {
  hasPublicXLookupConfigured,
  lookupPublicXTweetsByUserId,
  lookupPublicXUserByHandle,
} from '@/features/x/lib/x-public';
import { getAuthenticatedXUser, type XTweet } from '@/features/x/lib/x';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';

type PageProps = {
  searchParams: Promise<{
    connected?: string;
    disconnected?: string;
    error?: string;
    role?: string;
  }>;
};

function formatCompactNumber(value?: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value ?? 0);
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not connected';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

function truncateTweet(text: string) {
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}

function getTweetTotals(tweets: XTweet[]) {
  return tweets.reduce(
    (accumulator, tweet) => {
      accumulator.likes += tweet.public_metrics?.like_count ?? 0;
      accumulator.replies += tweet.public_metrics?.reply_count ?? 0;
      accumulator.retweets += tweet.public_metrics?.retweet_count ?? 0;
      accumulator.quotes += tweet.public_metrics?.quote_count ?? 0;
      return accumulator;
    },
    { likes: 0, quotes: 0, replies: 0, retweets: 0 },
  );
}

export default async function XAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  if (params.connected || params.disconnected || params.error || params.role) {
    const nextParams = new URLSearchParams();

    if (params.connected) nextParams.set('connected', params.connected);
    if (params.disconnected) nextParams.set('disconnected', params.disconnected);
    if (params.error) nextParams.set('error', params.error);
    if (params.role) nextParams.set('role', params.role);

    redirect(`/app/settings${nextParams.size ? `?${nextParams.toString()}` : ''}`);
  }

  const linkedHandle = await getCurrentUserLinkedXHandle();
  const hasStoredConnection = await hasStoredXConnectionForCurrentUser();

  let previewUser = null as Awaited<ReturnType<typeof getAuthenticatedXUser>> | null;
  let previewTweets: XTweet[] = [];
  const previewTitle = 'Linked handle preview';
  let usingPublicFallback = false;

  if (linkedHandle) {
    const publicUser = await lookupPublicXUserByHandle(linkedHandle);

    if (publicUser) {
      previewUser = publicUser;
      usingPublicFallback = true;

      if (publicUser.id) {
        previewTweets = await lookupPublicXTweetsByUserId(publicUser.id);
      }
    }
  }

  const tweetTotals = getTweetTotals(previewTweets);

  return (
    <div className="space-y-6">
      <Card className="border-border/80">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>X analytics</CardTitle>
            <CardDescription>
              Connection management now lives in settings. Analytics stays focused on previewing the account you have linked.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/app/settings">Manage X connections</Link>
          </Button>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {hasStoredConnection
            ? 'Founder and company publishing accounts are configured from settings.'
            : 'Connect your X accounts from settings before using founder or company publishing slots.'}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>{previewTitle}</CardTitle>
            <CardDescription>
              {usingPublicFallback
                ? 'Using your saved handle because there is no live authenticated X profile available here.'
                : 'Live profile preview from the linked X connection.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {previewUser ? (
              <div className="rounded-3xl border border-border/40 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-4">
                    {previewUser.profile_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUser.profile_image_url}
                        alt={previewUser.name}
                        className="size-16 rounded-2xl border border-border/40 object-cover"
                      />
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-900 text-white">
                        <XLogo className="size-7" weight="fill" />
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-semibold">{previewUser.name}</p>
                      <p className="text-sm text-muted-foreground">@{previewUser.username}</p>
                    </div>
                  </div>

                  <Link
                    href={`https://x.com/${previewUser.username}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-600"
                  >
                    Open on X
                    <ArrowSquareOut className="size-4" />
                  </Link>
                </div>

                {previewUser.description ? (
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {previewUser.description}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border/50 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
                {linkedHandle
                  ? 'We found your linked X handle, but could not load a profile right now.'
                  : 'Connect an X account in settings to load profile analytics here.'}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-4">
              {[
                {
                  icon: Users,
                  label: 'Followers',
                  value: formatCompactNumber(previewUser?.public_metrics?.followers_count),
                },
                {
                  icon: TrendUp,
                  label: 'Following',
                  value: formatCompactNumber(previewUser?.public_metrics?.following_count),
                },
                {
                  icon: ChartLineUp,
                  label: 'Posts',
                  value: formatCompactNumber(previewUser?.public_metrics?.tweet_count),
                },
                {
                  icon: XLogo,
                  label: 'Listed',
                  value: formatCompactNumber(previewUser?.public_metrics?.listed_count),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border/40 p-4"
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="size-4" weight="fill" />
                    <span className="text-xs font-mono">{item.label}</span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold">
                    {previewUser ? item.value : '--'}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: 'Likes', value: tweetTotals.likes },
                { label: 'Replies', value: tweetTotals.replies },
                { label: 'Retweets', value: tweetTotals.retweets },
                { label: 'Quotes', value: tweetTotals.quotes },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border/40 p-4"
                >
                  <p className="text-xs font-mono">{item.label}</p>
                  <p className="mt-3 text-2xl font-semibold">
                    {previewTweets.length > 0 ? formatCompactNumber(item.value) : '--'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>Latest posts</CardTitle>
            <CardDescription>
              {hasPublicXLookupConfigured()
                ? 'Recent timeline preview for the linked account.'
                : 'Connect an X account to render recent post activity here.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {previewTweets.length > 0 ? (
              previewTweets.map((tweet) => (
                <div key={tweet.id} className="rounded-2xl border border-border/40 p-4">
                  <p className="text-sm leading-6">{truncateTweet(tweet.text)}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {[
                        {
                          description: 'Replies on this post.',
                          icon: ChatCircle,
                          key: 'replies',
                          value: tweet.public_metrics?.reply_count,
                        },
                        {
                          description: 'Likes on this post.',
                          icon: Heart,
                          key: 'likes',
                          value: tweet.public_metrics?.like_count,
                        },
                        {
                          description: 'Quote posts referencing this post.',
                          icon: Quotes,
                          key: 'quotes',
                          value: tweet.public_metrics?.quote_count,
                        },
                      ].map((metric) => (
                        <Tooltip key={metric.key}>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-border/30 px-2 py-1">
                              <metric.icon className="size-4" />
                              <span className="text-xs font-medium">
                                {formatCompactNumber(metric.value)}
                              </span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">{metric.description}</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                    <p className="text-xs uppercase font-mono text-muted-foreground">
                      {formatDate(tweet.created_at)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/50 bg-slate-50 p-6 text-sm text-slate-500">
                {linkedHandle
                  ? 'We know your X handle, but could not load recent posts right now.'
                  : 'Connect an X account in settings to show recent posts and engagement totals here.'}
              </div>
            )}

            <div className="rounded-2xl border border-border/40 px-4 py-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarDots className="size-4" />
                Founder and company publishing slots are managed in settings.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
