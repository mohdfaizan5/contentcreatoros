
import Link from 'next/link';
import { headers } from 'next/headers';
import {
  ArrowsClockwise,
  ArrowClockwise,
  ArrowSquareOut,
  ChatCircle,
  ChartLineUp,
  CheckCircle,
  Heart,
  Info,
  LockKey,
  Quotes,
  TrendUp,
  Users,
  WarningCircle,
  XLogo,
} from '@phosphor-icons/react/dist/ssr';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ensureXAccessToken,
  getCurrentUserLinkedXHandle,
  getAuthenticatedUserTweets,
  getAuthenticatedXUser,
  getXRedirectUri,
  getXConfigStatus,
  getXConnectionMetadata,
  type XTweet,
} from '@/lib/x/x';
import { X_OAUTH_SCOPE_STRING } from '@/lib/x/x-oauth';
import {
  hasPublicXLookupConfigured,
  lookupPublicXTweetsByUserId,
  lookupPublicXUserByHandle,
} from '@/lib/x/x-public';

type PageProps = {
  searchParams: Promise<{
    connected?: string;
    disconnected?: string;
    error?: string;
  }>;
};
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar"
import { Badge } from '@/components/ui/badge';
import { LabelTooltip } from '@/components/label-tooltip';

function formatCompactNumber(value?: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value ?? 0);
}

function formatDate(value?: string) {
  if (!value) return 'N/A';

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

function getFriendlyError(error?: string) {
  if (!error) return null;

  if (error.includes('Missing X_CLIENT_ID')) {
    return 'Add X_CLIENT_ID to your environment first. The older API key and bearer token are not enough for user login.';
  }

  if (error.includes('access_denied')) {
    return 'X denied the connection request. This usually means the callback URL or requested scopes do not match your X app configuration.';
  }

  return error;
}

import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";

export default async function XAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const headersList = await headers();
  const host = headersList.get('host') ?? 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') ?? 'http';
  const origin = `${protocol}://${host}`;
  const callbackUrl = getXRedirectUri(origin);
  const xConfig = getXConfigStatus();
  const connectionMetadata = await getXConnectionMetadata();
  const linkedHandle = await getCurrentUserLinkedXHandle();
  const canUsePublicFallback = Boolean(linkedHandle);

  let accessToken: string | null = null;
  let user = null;
  let tweets: XTweet[] = [];
  let dataError: string | null = null;
  let usingPublicFallback = false;

  if (xConfig.configured) {
    accessToken = await ensureXAccessToken(origin, { persistCookies: false });

    if (accessToken) {
      try {
        user = await getAuthenticatedXUser(accessToken);
        tweets = await getAuthenticatedUserTweets(accessToken, user.id);
      } catch (error) {
        dataError =
          error instanceof Error ? error.message : 'Unable to load data from the X API.';
      }
    }
  }

  if (!user && linkedHandle) {
    const publicUser = await lookupPublicXUserByHandle(linkedHandle);

    if (publicUser) {
      user = publicUser;
      usingPublicFallback = true;

      if (publicUser.id) {
        tweets = await lookupPublicXTweetsByUserId(publicUser.id);
      }
    }
  }

  const tweetTotals = getTweetTotals(tweets);
  const bannerMessage =
    getFriendlyError(params.error) ??
    (!usingPublicFallback ? dataError : null);
  // Treat the account as connected when we have a valid token or known connection metadata,
  // even if a live profile fetch temporarily fails.
  const isConnected = Boolean(
    accessToken || connectionMetadata.connectedAt || usingPublicFallback,
  );
  const connectionLabel = accessToken
    ? 'Authenticated'
    : usingPublicFallback
      ? 'Linked handle'
      : isConnected
        ? 'Reconnect needed'
        : 'Not connected';

  return (
    <div className="space-y-6">

      <section className="relative overflow-hidden  rounded-2xl  border border-border/70 bg-[#1384FF] px-8 py-4 text-white shadow-[0_24px_80px_-28px_rgba(15,23,42,0.75)]">
        <div className="absolute inset-y-0 right-[-8%] w-56 rounded-full bg-[#1384FF] blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            {/* <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase  text-white/80">
              <XLogo className="size-4" weight="fill" />
              Analytics
            </div> */}
            <div className="space-y-3">
              <h1 className=" font-semibold tracking-tight text-2xl">
                Connect an <XLogo className="size-5 inline-flex mr-1" weight="fill" />
                account and pull live profile data into the app.
              </h1>
              {/* <p className="max-w-xl text-sm leading-6 text-slate-200/80 sm:text-base">
                This page uses the latest X OAuth 2.0 Authorization Code flow with PKCE,
                then reads the authenticated user from <code>/2/users/me</code> plus a
                recent post snapshot from the user timeline.
              </p> */}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {!accessToken ? (
              <Button
                asChild
                className="rounded-full px-5 text-sm font-semibold "
              >
                <Link href="/api/x/login">
                  <LockKey className="size-4" />
                  Connect X
                </Link>
              </Button>
            ) : (
              <form action="/api/x/disconnect" method="post">
                <Button
                  type="submit"
                  variant="default"
                  className="rounded-full px-5 text-sm "
                >
                  Disconnect
                </Button>
              </form>
            )}

            {/* <Button
              asChild
              variant="outline"
              className="h-11 rounded-full border-white/20 bg-white/5 px-5 text-sm text-white hover:bg-white/10"
            >
              <Link href="/app/x">
                <ArrowSquareOut className="size-4" />
                X workspace
              </Link>
            </Button> */}
          </div>
        </div>
      </section>

      {(params.connected || params.disconnected || bannerMessage) && (
        <Card className="border-border/80  backdrop-blur">
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              {bannerMessage ? (
                <WarningCircle className="mt-0.5 size-5 text-amber-500" weight="fill" />
              ) : (
                <CheckCircle className="mt-0.5 size-5 text-emerald-500" weight="fill" />
              )}
              <div>
                <p className="font-medium ">
                  {bannerMessage
                    ? 'X connection needs attention'
                    : params.connected
                      ? 'X account connected'
                      : 'X account disconnected'}
                </p>
                <p className="text-sm text-slate-500">
                  {bannerMessage ||
                    (params.connected
                      ? 'The app can now fetch authenticated user data from X.'
                      : 'The saved X session cookies were cleared.')}
                </p>
              </div>
            </div>

            <Button asChild variant="ghost" className="justify-start sm:justify-center">
              <Link href="/app/analytics">
                <ArrowClockwise className="size-4" />
                Refresh
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!xConfig.configured && (
        <Card className="border-amber-200 bg-amber-50/80">
          <CardHeader>
            <CardTitle>
              <LabelTooltip
                label="Setup still needed"
                description="The X login flow needs an OAuth client ID. The current environment has the old API credentials, but not the OAuth client ID required by the latest docs."
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-amber-950/80">
            <p>Add <code>X_CLIENT_ID</code> to <code>.env.local</code>.</p>
            <p>
              Optional: add <code>X_CLIENT_SECRET</code> too if your X app requires it for
              token exchange. This implementation already sends it when present.
            </p>
            <p>
              Callback URL to register in the X developer portal:
              <code className="ml-1 rounded bg-amber-100 px-1.5 py-0.5">{callbackUrl}</code>
            </p>
          </CardContent>
        </Card>
      )}



      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/80 ">
          <CardHeader >
            <CardTitle>
              <LabelTooltip
                label="Connection status"
                description="User-authenticated X API access via OAuth 2.0 PKCE."
              />
            </CardTitle>
            <CardDescription>

              <Badge>
                <LabelTooltip
                  label="Linked handle"
                  description="This handle is loaded from your stored X connection or onboarding answers."
                />
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/40 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] ">
                  <LabelTooltip
                    label="Session"
                    description="Shows whether the current app session has a valid authenticated X connection."
                  />
                </p>
                <p className="mt-2 text-xl font-semibold ">
                  {connectionLabel}
                </p>

              </div>

              <div className="rounded-2xl border border-border/40 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] ">
                  <LabelTooltip
                    label="Connected at"
                    description="The time this X session was first stored in secure HTTP-only cookies."
                  />
                </p>
                <p className="mt-2 text-xl font-semibold ">
                  {formatDate(connectionMetadata.connectedAt)}
                </p>
              </div>
            </div> */}

            {/* {!accessToken && linkedHandle && (

              <div className="rounded-2xl border border-border/40 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] ">
                  <LabelTooltip
                    label="Linked handle"
                    description="This handle is loaded from your stored X connection or onboarding answers."
                  />
                </p>
                <p className="mt-2 text-xl font-semibold ">@{linkedHandle}</p>
              </div>
            )} */}

            {user ? (
              <div className="rounded-3xl border border-border/40  p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-4">
                    {user.profile_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.profile_image_url}
                        alt={user.name}
                        className="size-16 rounded-2xl border border-border/40 object-cover"
                      />
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-900 text-white">
                        <XLogo className="size-7" weight="fill" />
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-semibold ">{user.name}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>

                  <Link
                    href={`https://x.com/${user.username}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-600"
                  >
                    Open on X
                    <ArrowSquareOut className="size-4" />
                  </Link>
                </div>

                {user.description && (
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {user.description}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border/50 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
                {linkedHandle
                  ? 'We found your linked X handle, but could not load the profile right now.'
                  : 'Connect an X account or save your X handle in onboarding to render profile analytics here.'}
              </div>
            )}
            <div className="grid gap-6">
              <Card className="border-border/80 ">
                <CardHeader>
                  <CardTitle>
                    <LabelTooltip
                      label="Profile metrics"
                      description="Public metrics returned directly on the authenticated user object."
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-4">
                  {[
                    {
                      icon: Users,
                      label: 'Followers',
                      value: formatCompactNumber(user?.public_metrics?.followers_count),
                    },
                    {
                      icon: TrendUp,
                      label: 'Following',
                      value: formatCompactNumber(user?.public_metrics?.following_count),
                    },
                    {
                      icon: ChartLineUp,
                      label: 'Posts',
                      value: formatCompactNumber(user?.public_metrics?.tweet_count),
                    },
                    {
                      icon: XLogo,
                      label: 'Listed',
                      value: formatCompactNumber(user?.public_metrics?.listed_count),
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-border/40 p-4"
                    >
                      <div className="flex items-center gap-2 ">
                        <item.icon className="size-4" weight="fill" />
                        <span className="text-xs font-mono">
                          <LabelTooltip
                            label={item.label}
                            description={`The current X ${item.label.toLowerCase()} count for this authenticated account.`}
                          />
                        </span>
                      </div>
                      <p className="mt-3 text-2xl font-semibold ">
                        {user ? item.value : '--'}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/80 ">
                <CardHeader>
                  <CardTitle>
                    <LabelTooltip
                      label="Recent post snapshot"
                      description="Latest five posts from the authenticated user timeline."
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Likes', value: tweetTotals.likes },
                    { label: 'Replies', value: tweetTotals.replies },
                    { label: 'Retweets', value: tweetTotals.retweets },
                    { label: 'Quotes', value: tweetTotals.quotes },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-border/40  p-4"
                    >
                      <p className="text-xs font-mono ">
                        <LabelTooltip
                          label={item.label}
                          description={`The total number of ${item.label.toLowerCase()} across the latest five posts.`}
                        />
                      </p>
                      <p className="mt-3 text-2xl font-semibold ">
                        {tweets.length > 0 ? formatCompactNumber(item.value) : '--'}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>


        <Frame className="w-full">
          <FrameHeader>
            <AnimatedCircularProgressBar
              value={32}
              gaugePrimaryColor="rgb(79 70 229)"
              gaugeSecondaryColor="rgba(0, 0, 0, 0.1)"
            />
            <FrameTitle>
              <LabelTooltip
                label="Latest posts"
                description="Lightweight timeline preview using /2/users/:id/tweets with tweet.fields=created_at,public_metrics."
              />
            </FrameTitle>
          </FrameHeader>

          {tweets.length > 0 ? (
            tweets.map((tweet) => (
              <FramePanel key={tweet.id} className="rounded-2xl p-4">
                <div className="flex flex-col gap-3 md:items-start md:justify-between">
                  <p className="text-sm leading-6">
                    {truncateTweet(tweet.text)}
                  </p>
                  <div className="flex justify-between w-full  items-center space-y-2">


                    <div className="flex min-w-55 flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {[
                        {
                          key: 'replies',
                          icon: ChatCircle,
                          value: tweet.public_metrics?.reply_count,
                          description: 'Replies on this post.',
                        },
                        {
                          key: 'retweets',
                          icon: ArrowsClockwise,
                          value: tweet.public_metrics?.retweet_count,
                          description: 'Reposts or retweets of this post.',
                        },
                        {
                          key: 'likes',
                          icon: Heart,
                          value: tweet.public_metrics?.like_count,
                          description: 'Likes on this post.',
                        },
                        {
                          key: 'quotes',
                          icon: Quotes,
                          value: tweet.public_metrics?.quote_count,
                          description: 'Quote posts referencing this post.',
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
                    <p className="text-xs uppercase font-mono">
                      <LabelTooltip
                        label={formatDate(tweet.created_at)}
                        description="The creation date of this post as returned by the X timeline API."
                      />
                    </p>
                  </div>

                </div>
              </FramePanel>
            ))
          ) : (
            <FramePanel className="rounded-2xl border-dashed bg-slate-50 p-6 text-sm text-slate-500">
              {isConnected
                ? 'No recent posts were returned for this account.'
                : canUsePublicFallback
                  ? 'We know your X handle, but could not load recent posts right now.'
                  : 'Connect an X account or save your X handle to show recent posts and engagement totals here.'}
            </FramePanel>
          )}

          <FramePanel className="text-xs">
            Scopes requested: {X_OAUTH_SCOPE_STRING}
          </FramePanel>
        </Frame>
      </div>


    </div>
  );
}

