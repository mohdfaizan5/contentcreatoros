import Link from 'next/link';
import { headers } from 'next/headers';
import {
  ArrowClockwise,
  ArrowSquareOut,
  ChartLineUp,
  CheckCircle,
  LockKey,
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
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ensureXAccessToken,
  getAuthenticatedUserTweets,
  getAuthenticatedXUser,
  getXConfigStatus,
  getXConnectionMetadata,
  type XTweet,
} from '@/lib/x';

type PageProps = {
  searchParams: Promise<{
    connected?: string;
    disconnected?: string;
    error?: string;
  }>;
};

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

  return error;
}

export default async function XAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const headersList = await headers();
  const host = headersList.get('host') ?? 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') ?? 'http';
  const origin = `${protocol}://${host}`;
  const xConfig = getXConfigStatus();
  const connectionMetadata = await getXConnectionMetadata();

  let user = null;
  let tweets: XTweet[] = [];
  let dataError: string | null = null;

  if (xConfig.configured) {
    const accessToken = await ensureXAccessToken(origin);

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

  const tweetTotals = getTweetTotals(tweets);
  const bannerMessage = getFriendlyError(params.error) ?? dataError;
  const isConnected = Boolean(user);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(29,155,240,0.24),_transparent_35%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(12,18,31,0.92)_55%,_rgba(13,26,56,0.98))] p-8 text-white shadow-[0_24px_80px_-28px_rgba(15,23,42,0.75)]">
        <div className="absolute inset-y-0 right-[-8%] w-56 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.18),_transparent_60%)] blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-white/80">
              <XLogo className="size-4" weight="fill" />
              X Analytics
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Connect an X account and pull live profile data into the app.
              </h1>
              <p className="max-w-xl text-sm leading-6 text-slate-200/80 sm:text-base">
                This page uses the latest X OAuth 2.0 Authorization Code flow with PKCE,
                then reads the authenticated user from <code>/2/users/me</code> plus a
                recent post snapshot from the user timeline.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {!isConnected ? (
              <Button
                asChild
                className="h-11 rounded-full border border-sky-300/30 bg-sky-500 px-5 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_-12px_rgba(14,165,233,0.8)] hover:bg-sky-400"
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
                  variant="outline"
                  className="h-11 rounded-full border-white/20 bg-white/5 px-5 text-sm text-white hover:bg-white/10"
                >
                  Disconnect
                </Button>
              </form>
            )}

            <Button
              asChild
              variant="outline"
              className="h-11 rounded-full border-white/20 bg-white/5 px-5 text-sm text-white hover:bg-white/10"
            >
              <Link href="/app/x">
                <ArrowSquareOut className="size-4" />
                X workspace
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {(params.connected || params.disconnected || bannerMessage) && (
        <Card className="border-slate-200/80 bg-white/80 backdrop-blur">
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              {bannerMessage ? (
                <WarningCircle className="mt-0.5 size-5 text-amber-500" weight="fill" />
              ) : (
                <CheckCircle className="mt-0.5 size-5 text-emerald-500" weight="fill" />
              )}
              <div>
                <p className="font-medium text-slate-900">
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
              <Link href="/app/x/analytics">
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
            <CardTitle>Setup still needed</CardTitle>
            <CardDescription>
              The X login flow needs an OAuth client ID. The current environment has the
              old API credentials, but not the OAuth client ID required by the latest docs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-amber-950/80">
            <p>Add <code>X_CLIENT_ID</code> to <code>.env.local</code>.</p>
            <p>
              Optional: add <code>X_CLIENT_SECRET</code> too if your X app requires it for
              token exchange. This implementation already sends it when present.
            </p>
            <p>
              Callback URL to register in the X developer portal:
              <code className="ml-1 rounded bg-amber-100 px-1.5 py-0.5">
                {origin}/api/x/callback
              </code>
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-slate-200/80 bg-white/90">
          <CardHeader>
            <CardTitle>Connection status</CardTitle>
            <CardDescription>
              User-authenticated X API access via OAuth 2.0 PKCE.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Session
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {isConnected ? 'Connected' : 'Not connected'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {isConnected
                    ? 'Authenticated user data is available on this page.'
                    : 'Connect X to pull user profile and post metrics.'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Connected at
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {formatDate(connectionMetadata.connectedAt)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Stored in secure HTTP-only cookies inside the app session.
                </p>
              </div>
            </div>

            {user ? (
              <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,_rgba(248,250,252,1),_rgba(241,245,249,0.7))] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-4">
                    {user.profile_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.profile_image_url}
                        alt={user.name}
                        className="size-16 rounded-2xl border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-900 text-white">
                        <XLogo className="size-7" weight="fill" />
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{user.name}</p>
                      <p className="text-sm text-slate-500">@{user.username}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Joined {formatDate(user.created_at)}
                      </p>
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
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                    {user.description}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
                Connect an X account to render the authenticated user here with
                <code className="mx-1 rounded bg-slate-200 px-1.5 py-0.5">/2/users/me</code>
                and pull recent-post metrics from the user timeline endpoint.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="border-slate-200/80 bg-white/90">
            <CardHeader>
              <CardTitle>Profile metrics</CardTitle>
              <CardDescription>
                Public metrics returned directly on the authenticated user object.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
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
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-2 text-slate-400">
                    <item.icon className="size-4" weight="fill" />
                    <span className="text-xs uppercase tracking-[0.24em]">
                      {item.label}
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">
                    {user ? item.value : '--'}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/90">
            <CardHeader>
              <CardTitle>Recent post snapshot</CardTitle>
              <CardDescription>
                Latest five posts from the authenticated user timeline.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Likes', value: tweetTotals.likes },
                { label: 'Replies', value: tweetTotals.replies },
                { label: 'Retweets', value: tweetTotals.retweets },
                { label: 'Quotes', value: tweetTotals.quotes },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,_rgba(241,245,249,0.75),_rgba(255,255,255,1))] p-4"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">
                    {tweets.length > 0 ? formatCompactNumber(item.value) : '--'}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-slate-200/80 bg-white/90">
        <CardHeader>
          <CardTitle>Latest posts</CardTitle>
          <CardDescription>
            Lightweight timeline preview using <code>/2/users/:id/tweets</code> with
            <code className="ml-1">tweet.fields=created_at,public_metrics</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tweets.length > 0 ? (
            tweets.map((tweet) => (
              <article
                key={tweet.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm leading-6 text-slate-700">
                      {truncateTweet(tweet.text)}
                    </p>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                      {formatDate(tweet.created_at)}
                    </p>
                  </div>

                  <div className="grid min-w-[220px] grid-cols-2 gap-2 text-sm text-slate-500">
                    <div>Likes: {formatCompactNumber(tweet.public_metrics?.like_count)}</div>
                    <div>Replies: {formatCompactNumber(tweet.public_metrics?.reply_count)}</div>
                    <div>Retweets: {formatCompactNumber(tweet.public_metrics?.retweet_count)}</div>
                    <div>Quotes: {formatCompactNumber(tweet.public_metrics?.quote_count)}</div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              {isConnected
                ? 'No recent posts were returned for this account.'
                : 'Connect an X account to show recent posts and engagement totals here.'}
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t border-slate-100 text-xs text-slate-400">
          Scopes requested: users.read, tweet.read, offline.access
        </CardFooter>
      </Card>
    </div>
  );
}
