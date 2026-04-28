import Link from 'next/link';
import { headers } from 'next/headers';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react/dist/ssr';

import { assignSavedXAccountRole } from '@/features/analytics/actions/x-account-roles';
import { ConnectXAccountButton } from '@/features/analytics/components/connect-x-account-button';
import { LabelTooltip } from '@/features/analytics/components/label-tooltip';
import { getConfiguredPublicOrigin } from '@/features/inspiration/lib/request-origin';
import {
  ensureStoredXAccessToken,
  getCurrentUserXAccount,
  getXConfigStatus,
  getXRedirectUri,
  listCurrentUserXAccounts,
} from '@/features/x/lib/x-auth';
import { getAuthenticatedXUser } from '@/features/x/lib/x';
import { X_OAUTH_SCOPE_STRING } from '@/features/x/lib/x-oauth';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import type { XAccount, XAccountRole } from '@/shared/types/database';

type SettingsSearchParams = {
  connected?: string;
  disconnected?: string;
  error?: string;
  role?: string;
};

type AccountSnapshot = {
  account: XAccount | null;
  connectionLabel: string;
  dataError: string | null;
  role: XAccountRole;
  user: Awaited<ReturnType<typeof getAuthenticatedXUser>> | null;
};

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not connected';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(new Date(value));
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
import { ChevronDownIcon } from 'lucide-react';

import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible';
import { Frame, FrameHeader, FramePanel } from '@/shared/components/ui/frame';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { createClient } from '@/shared/lib/supabase/client';

function getRoleLabel(role: XAccountRole) {
  return role === 'company' ? 'Company account' : 'Founder account';
}

async function loadAccountSnapshot(role: XAccountRole): Promise<AccountSnapshot> {
  const account = await getCurrentUserXAccount(role);

  if (!account) {
    return {
      account: null,
      connectionLabel: 'Not connected',
      dataError: null,
      role,
      user: null,
    };
  }

  try {
    const accessToken = await ensureStoredXAccessToken(account.id);
    const user = await getAuthenticatedXUser(accessToken);

    return {
      account,
      connectionLabel: 'Authenticated',
      dataError: null,
      role,
      user,
    };
  } catch (error) {
    return {
      account,
      connectionLabel: 'Reconnect needed',
      dataError: error instanceof Error ? error.message : 'Unable to load data from the X API.',
      role,
      user: null,
    };
  }
}

function AccountConnectionCard({ snapshot }: { snapshot: AccountSnapshot }) {
  const roleLabel = getRoleLabel(snapshot.role);
  const username = snapshot.user?.username ?? snapshot.account?.username ?? null;

  return (
    <Card className="border-border/80">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="text-base">{roleLabel}</CardTitle>
            <CardDescription>{snapshot.connectionLabel}</CardDescription>
          </div>
          <Badge variant={snapshot.account ? 'secondary' : 'outline'}>
            {snapshot.role}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Username
            </p>
            <p className="mt-2 text-base font-semibold">
              {username ? `@${username}` : 'Not connected'}
            </p>
          </div>
          <div className="rounded-2xl border border-border/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Connected at
            </p>
            <p className="mt-2 text-base font-semibold">
              {formatDate(snapshot.account?.connected_at)}
            </p>
          </div>
        </div>

        {snapshot.dataError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-900">
            {snapshot.dataError}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <ConnectXAccountButton hasAccount={Boolean(snapshot.account)} role={snapshot.role} />
          {snapshot.account ? (
            <form action="/api/x/disconnect" method="post">
              <input name="role" type="hidden" value={snapshot.role} />
              <Button type="submit" variant="outline">
                Disconnect
              </Button>
            </form>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export async function XConnectionsSettingsSection({
  searchParams,
}: {
  searchParams: SettingsSearchParams;
}) {
  const headersList = await headers();
  const host = headersList.get('host') ?? 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') ?? 'http';
  const origin = getConfiguredPublicOrigin() ?? `${protocol}://${host}`;
  const callbackUrl = getXRedirectUri(origin);
  const xConfig = getXConfigStatus();
  const isLocalhostCallback = callbackUrl.includes('://localhost');

  const [companySnapshot, founderSnapshot, allAccounts] = await Promise.all([
    loadAccountSnapshot('company'),
    loadAccountSnapshot('founder'),
    listCurrentUserXAccounts(),
  ]);

  const legacyAccounts = allAccounts.filter((account) => account.account_role === null);
  const bannerMessage = getFriendlyError(searchParams.error);
  const actionRole =
    searchParams.role === 'company' || searchParams.role === 'founder'
      ? searchParams.role
      : null;

  return (
    <Frame className="w-full">
      <Collapsible defaultOpen>
        <FrameHeader className="flex-row items-center justify-between px-2 py-2">
          <p>X connections</p>
          <CollapsibleTrigger
            className="data-panel-open:[&_svg]:rotate-180"
            render={<Button variant="ghost" />}
          >
            <ChevronDownIcon className="size-4" />
            View more
          </CollapsibleTrigger>
        </FrameHeader>
        <CollapsiblePanel>
          <FramePanel>
            <section className="space-y-6">
              <div className="space-y-3">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    {/* <h2 className="text-2xl font-semibold tracking-tight">X connections</h2> */}
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                      Founder and company publishing accounts live here. Connect, relabel, or reconnect them in one place.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline">Scopes: {X_OAUTH_SCOPE_STRING}</Badge>
                    <ConnectXAccountButton
                      hasAccount={false}
                      label="Connect another X account"
                      role={null}
                    />
                  </div>
                </div>
              </div>

              {(searchParams.connected || searchParams.disconnected || bannerMessage) && (
                <Card className="border-border/80">
                  <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      {bannerMessage ? (
                        <WarningCircle className="mt-0.5 size-5 text-amber-500" weight="fill" />
                      ) : (
                        <CheckCircle className="mt-0.5 size-5 text-emerald-500" weight="fill" />
                      )}
                      <div>
                        <p className="font-medium">
                          {bannerMessage
                            ? 'X connection needs attention'
                            : searchParams.connected
                              ? `${actionRole ? getRoleLabel(actionRole) : 'X account'} connected`
                              : `${actionRole ? getRoleLabel(actionRole) : 'X account'} disconnected`}
                        </p>
                        <p className="text-sm text-slate-500">
                          {bannerMessage ||
                            (searchParams.connected
                              ? actionRole
                                ? 'That publishing slot is ready for authenticated X actions.'
                                : 'That X account was saved as a separate connection. You can assign it below.'
                              : 'That publishing slot has been removed from saved X connections.')}
                        </p>
                      </div>
                    </div>

                    <Button asChild variant="ghost">
                      <Link href="/app/settings">Refresh</Link>
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
                      Optional: add <code>X_CLIENT_SECRET</code> too if your X app requires it for token exchange.
                    </p>
                    <p>
                      Callback URL to register in the X developer portal:
                      <code className="ml-1 rounded bg-amber-100 px-1.5 py-0.5">{callbackUrl}</code>
                    </p>
                    {isLocalhostCallback ? (
                      <p>
                        For local development, X recommends <code>http://127.0.0.1</code> instead of
                        <code> localhost</code>. If your app settings use <code>127.0.0.1</code> but
                        this page shows <code>localhost</code>, the consent screen will fail before the
                        callback runs.
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              )}

              {legacyAccounts.length > 0 ? (
                <Card className="border-amber-200 bg-amber-50/70">
                  <CardHeader>
                    <CardTitle className="text-base">Saved X connection needs a label</CardTitle>
                    <CardDescription>
                      These accounts came from X sign-in or an older connection. Pick whether each one should publish as Company or Founder.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-amber-950/90">
                    {legacyAccounts.map((account) => (
                      <div
                        className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-white/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                        key={account.id}
                      >
                        <div>
                          <p className="font-medium">@{account.username}</p>
                          <p className="text-xs text-amber-900/75">
                            Connected on {formatDate(account.connected_at)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <form action={assignSavedXAccountRole}>
                            <input name="accountId" type="hidden" value={account.id} />
                            <input name="role" type="hidden" value="company" />
                            <Button size="sm" type="submit">
                              Mark as Company
                            </Button>
                          </form>
                          <form action={assignSavedXAccountRole}>
                            <input name="accountId" type="hidden" value={account.id} />
                            <input name="role" type="hidden" value="founder" />
                            <Button size="sm" type="submit" variant="outline">
                              Mark as Founder
                            </Button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}

              <div className="grid gap-6 xl:grid-cols-2">
                <AccountConnectionCard snapshot={companySnapshot} />
                <AccountConnectionCard snapshot={founderSnapshot} />
              </div>
            </section>
          </FramePanel>
        </CollapsiblePanel>
      </Collapsible>
    </Frame>

  );
}
