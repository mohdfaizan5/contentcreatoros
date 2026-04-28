import { cookies } from 'next/headers';
import { TwitterApi } from 'twitter-api-v2';

import { ONBOARDING_FLOW_KEY } from '@/features/onboarding/lib/onboarding';
import { extractXHandle } from '@/features/x/lib/x-handle';
import {
  REQUIRED_X_OAUTH_SCOPES,
  X_OAUTH_SCOPES,
} from '@/features/x/lib/x-oauth';
import { createClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/server-admin';
import type { XAccountRole } from '@/shared/types/database';
import { PendingXOAuthAttempt, StoredXAccount, XApiError, XTokenResponse } from '../types/x.types';

const X_OAUTH_ATTEMPTS_COOKIE = 'x_oauth_attempts';
const X_OAUTH_ATTEMPT_TTL_SECONDS = 60 * 10;

type XOAuthLogContext = Record<string, unknown>;

const X_ACCOUNT_ROLE_ORDER: Record<'company' | 'founder' | 'legacy', number> = {
  company: 0,
  founder: 1,
  legacy: 2,
};

/**
 * X auth source of truth.
 *
 * This module owns the user-scoped X OAuth lifecycle for the app:
 * starting PKCE auth, validating callbacks, persisting founder/company
 * account connections, refreshing tokens, and cleaning up connections.
 *
 * Callers:
 * - `/api/x/login`, `/api/x/callback`, `/api/x/disconnect`
 * - analytics and publishing surfaces that need connection status
 * - server actions that need stored X account tokens
 *
 * Storage:
 * - short-lived PKCE attempts live in one HTTP-only cookie
 * - persistent X account tokens live in `x_accounts`
 */

function getRequestedXScopes() {
  const customScopes = process.env.X_OAUTH_SCOPES?.trim();

  if (!customScopes) {
    return [...X_OAUTH_SCOPES];
  }

  const parsedScopes = customScopes
    .split(/[\s,]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);

  if (parsedScopes.length === 0) {
    return [...X_OAUTH_SCOPES];
  }

  const combinedScopes = new Set(parsedScopes);

  for (const requiredScope of REQUIRED_X_OAUTH_SCOPES) {
    combinedScopes.add(requiredScope);
  }

  return Array.from(combinedScopes);
}

function getXClientId() {
  return process.env.X_CLIENT_ID?.trim();
}

function getXClientSecret() {
  return process.env.X_CLIENT_SECRET?.trim() || process.env.Secret_Key?.trim();
}

function normalizeOrigin(rawOrigin: string) {
  return rawOrigin.endsWith('/') ? rawOrigin.slice(0, -1) : rawOrigin;
}

function normalizeLocalXOrigin(origin: string) {
  if (process.env.NODE_ENV === 'production') {
    return normalizeOrigin(origin);
  }

  try {
    const url = new URL(origin);

    if (url.hostname === 'localhost') {
      url.hostname = '127.0.0.1';
    }

    return normalizeOrigin(url.origin);
  } catch {
    return normalizeOrigin(origin);
  }
}

function createCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    maxAge,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
}

function createXOAuthClient() {
  const clientId = getXClientId();
  const clientSecret = getXClientSecret();

  if (!clientId) {
    throw new Error('Missing X_CLIENT_ID. Add it to your environment before connecting X.');
  }

  return clientSecret
    ? new TwitterApi({ clientId, clientSecret })
    : new TwitterApi({ clientId });
}

function createXUserClient(accessToken: string) {
  return new TwitterApi(accessToken);
}

function maskToken(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  if (value.length <= 10) {
    return `${value.slice(0, 4)}...`;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function logXOAuth(event: string, context: XOAuthLogContext) {
  console.info('[x-oauth]', JSON.stringify({ event, ...context }));
}

function normalizeTwitterApiError(error: unknown, fallbackMessage: string) {
  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const maybeData = error as Error & {
    data?: XApiError;
    code?: number;
  };

  return (
    maybeData.data?.detail ||
    maybeData.data?.message ||
    maybeData.data?.title ||
    maybeData.data?.errors?.[0]?.detail ||
    maybeData.data?.errors?.[0]?.message ||
    error.message ||
    fallbackMessage
  );
}

function parseScopeList(scope?: string | string[] | null) {
  if (Array.isArray(scope)) {
    return scope.filter(Boolean);
  }

  if (typeof scope === 'string' && scope.trim()) {
    return scope.split(/\s+/).filter(Boolean);
  }

  return getRequestedXScopes();
}

function parseExpiresAt(expiresAt: string | null) {
  if (!expiresAt) {
    return null;
  }

  const expiresAtMs = new Date(expiresAt).getTime();
  return Number.isFinite(expiresAtMs) ? expiresAtMs : null;
}

function getRoleSortKey(role: XAccountRole | null) {
  if (role === 'company' || role === 'founder') {
    return X_ACCOUNT_ROLE_ORDER[role];
  }

  return X_ACCOUNT_ROLE_ORDER.legacy;
}

function normalizeOnboardingAnswerToString(answer: unknown) {
  if (typeof answer === 'string') {
    return answer.trim();
  }

  if (answer && typeof answer === 'object') {
    const record = answer as Record<string, unknown>;
    const value = record.value;
    return typeof value === 'string' ? value.trim() : '';
  }

  return '';
}

async function readPendingAttempts() {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(X_OAUTH_ATTEMPTS_COOKIE)?.value;

  if (!rawValue) {
    return {} as Record<string, PendingXOAuthAttempt>;
  }

  try {
    const parsed = JSON.parse(
      decodeURIComponent(rawValue),
    ) as Record<string, PendingXOAuthAttempt>;

    const now = Date.now();
    const nextAttempts = Object.fromEntries(
      Object.entries(parsed).filter(([, attempt]) => {
        const createdAt = new Date(attempt.createdAt).getTime();
        return Number.isFinite(createdAt) && now - createdAt < X_OAUTH_ATTEMPT_TTL_SECONDS * 1000;
      }),
    );

    return nextAttempts;
  } catch {
    return {} as Record<string, PendingXOAuthAttempt>;
  }
}

async function writePendingAttempts(attempts: Record<string, PendingXOAuthAttempt>) {
  const cookieStore = await cookies();
  const entries = Object.entries(attempts);

  if (!entries.length) {
    cookieStore.delete(X_OAUTH_ATTEMPTS_COOKIE);
    return;
  }

  cookieStore.set(
    X_OAUTH_ATTEMPTS_COOKIE,
    encodeURIComponent(JSON.stringify(attempts)),
    createCookieOptions(X_OAUTH_ATTEMPT_TTL_SECONDS),
  );
}

async function createPendingAttempt(state: string, attempt: PendingXOAuthAttempt) {
  const attempts = await readPendingAttempts();
  attempts[state] = attempt;
  await writePendingAttempts(attempts);
}

async function consumePendingAttempt(state: string) {
  const attempts = await readPendingAttempts();
  const attempt = attempts[state] ?? null;

  if (attempt) {
    delete attempts[state];
    await writePendingAttempts(attempts);
  }

  return attempt;
}

async function clearPendingAttempts() {
  const cookieStore = await cookies();
  cookieStore.delete(X_OAUTH_ATTEMPTS_COOKIE);
}

async function loadAuthenticatedXUser(accessToken: string) {
  try {
    const client = createXUserClient(accessToken);
    const response = await client.v2.me({
      'user.fields': [
        'created_at',
        'description',
        'verified',
        'profile_image_url',
        'public_metrics',
      ],
    });

    return response.data as {
      id: string;
      username: string;
    };
  } catch (error) {
    throw new Error(
      normalizeTwitterApiError(error, 'Unable to load the authenticated X user.'),
    );
  }
}

async function exchangeXCodeForToken(
  code: string,
  origin: string,
  codeVerifier: string,
) {
  try {
    const client = createXOAuthClient();
    const tokenResult = await client.loginWithOAuth2({
      code,
      redirectUri: getXRedirectUri(origin),
      codeVerifier,
    });

    const tokenResponse = {
      access_token: tokenResult.accessToken,
      expires_in: tokenResult.expiresIn,
      refresh_token: tokenResult.refreshToken,
      scope: tokenResult.scope.join(' '),
      token_type: 'bearer',
    } satisfies XTokenResponse;

    logXOAuth('token_exchanged', {
      accessToken: maskToken(tokenResponse.access_token),
      codePresent: Boolean(code),
      redirectUri: getXRedirectUri(origin),
      refreshToken: maskToken(tokenResponse.refresh_token),
      scope: tokenResult.scope,
    });

    return tokenResponse;
  } catch (error) {
    throw new Error(
      normalizeTwitterApiError(
        error,
        'Unable to exchange the X authorization code for tokens.',
      ),
    );
  }
}

async function refreshXAccessToken(refreshToken: string) {
  try {
    const client = createXOAuthClient();
    const tokenResult = await client.refreshOAuth2Token(refreshToken);

    const tokenResponse = {
      access_token: tokenResult.accessToken,
      expires_in: tokenResult.expiresIn,
      refresh_token: tokenResult.refreshToken,
      scope: tokenResult.scope.join(' '),
      token_type: 'bearer',
    } satisfies XTokenResponse;

    logXOAuth('token_refreshed', {
      accessToken: maskToken(tokenResponse.access_token),
      refreshToken: maskToken(tokenResponse.refresh_token ?? refreshToken),
      scope: tokenResult.scope,
    });

    return tokenResponse;
  } catch (error) {
    throw new Error(
      normalizeTwitterApiError(error, 'Unable to refresh the X access token.'),
    );
  }
}

async function loadCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Sign in before connecting an X account.');
  }

  return user.id;
}

async function listXAccountsForUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('x_accounts')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    throw new Error('Unable to load your saved X connections.');
  }

  return ((data ?? []) as StoredXAccount[]).sort((left, right) => {
    const roleOrder = getRoleSortKey(left.account_role) - getRoleSortKey(right.account_role);

    if (roleOrder !== 0) {
      return roleOrder;
    }

    return new Date(right.connected_at).getTime() - new Date(left.connected_at).getTime();
  });
}

async function loadStoredXAccountById(accountId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('x_accounts')
    .select('*')
    .eq('id', accountId)
    .single();

  if (error || !data) {
    throw new Error('Unable to load the stored X connection.');
  }

  return data as StoredXAccount;
}

async function updateStoredXAccountRecord(
  accountId: string,
  payload: Partial<StoredXAccount>,
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('x_accounts')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', accountId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error('Unable to update the stored X connection.');
  }

  return data as StoredXAccount;
}

async function persistRefreshedTokens(account: StoredXAccount, tokenResponse: XTokenResponse) {
  const refreshedUser = await loadAuthenticatedXUser(tokenResponse.access_token);

  return updateStoredXAccountRecord(account.id, {
    access_token: tokenResponse.access_token,
    expires_at: tokenResponse.expires_in
      ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
      : null,
    refresh_token: tokenResponse.refresh_token ?? account.refresh_token,
    scope: parseScopeList(tokenResponse.scope),
    username: refreshedUser.username,
    x_user_id: refreshedUser.id,
  });
}

/**
 * Parse a request-level role string into a supported X account role.
 *
 * Used by route handlers and UI code to validate `founder` / `company`
 * inputs before we touch storage or OAuth state.
 */
export function parseXAccountRole(rawRole: string | null | undefined) {
  return rawRole === 'founder' || rawRole === 'company' ? rawRole : null;
}

/**
 * Resolve the X callback URL for the current deployment origin.
 *
 * Called by the login route and analytics setup UI. Reads env overrides
 * first, then falls back to `/api/x/callback` on the provided origin.
 */
export function getXRedirectUri(origin: string) {
  const configuredCallback =
    process.env.X_CALLBACK_URL?.trim() ||
    process.env.X_REDIRECT_URI?.trim();

  if (configuredCallback) {
    return configuredCallback;
  }

  return `${normalizeLocalXOrigin(origin)}/api/x/callback`;
}

/**
 * Expose whether the app has the X OAuth client configured.
 *
 * Called by the analytics page so setup guidance can explain which env
 * vars are still missing before a user tries to connect an account.
 */
export function getXConfigStatus() {
  const clientId = getXClientId();

  return {
    clientId,
    configured: Boolean(clientId),
    hasClientSecret: Boolean(getXClientSecret()),
  };
}

/**
 * Start a role-specific X OAuth 2.0 PKCE flow.
 *
 * Called by `/api/x/login`. Writes one short-lived pending auth attempt
 * into the cookie store, keyed by OAuth `state`, so founder and company
 * connection attempts can exist at the same time without colliding.
 */
export async function createXAuthorizationUrl(
  origin: string,
  role: XAccountRole | null = null,
) {
  const client = createXOAuthClient();
  const authLink = client.generateOAuth2AuthLink(getXRedirectUri(origin), {
    scope: getRequestedXScopes(),
  });

  await createPendingAttempt(authLink.state, {
    codeVerifier: authLink.codeVerifier,
    createdAt: new Date().toISOString(),
    role,
  });

  logXOAuth('start', {
    redirectUri: getXRedirectUri(origin),
    role,
    scope: getRequestedXScopes(),
    state: authLink.state,
  });

  return authLink.url;
}

/**
 * Complete an X OAuth callback and attach the account to the current user.
 *
 * Called by `/api/x/callback`. Consumes the pending PKCE attempt for the
 * supplied `state`, exchanges the auth code for tokens, persists the role-
 * based X connection, and returns the resolved founder/company role.
 */
export async function completeXAuthorizationCallback(params: {
  code: string;
  origin: string;
  state: string | null;
}) {
  logXOAuth('callback_received', {
    codePresent: Boolean(params.code),
    redirectUri: getXRedirectUri(params.origin),
    state: params.state,
  });

  if (!params.state) {
    throw new Error('Invalid X OAuth state.');
  }

  const pendingAttempt = await consumePendingAttempt(params.state);

  if (!pendingAttempt) {
    throw new Error('Invalid X OAuth state.');
  }

  const tokenResponse = await exchangeXCodeForToken(
    params.code,
    params.origin,
    pendingAttempt.codeVerifier,
  );
  const account = pendingAttempt.role
    ? await connectCurrentUserXAccount(pendingAttempt.role, tokenResponse)
    : await connectUnlabelledXAccountForCurrentUser(tokenResponse);

  logXOAuth('callback_completed', {
    accountId: account.id,
    role: account.account_role,
    state: params.state,
    username: account.username,
    xUserId: account.x_user_id,
  });

  return {
    account,
    role: pendingAttempt.role,
  };
}

/**
 * Remove all pending X OAuth attempts from the browser session.
 *
 * Called by the callback route when X sends back an auth error so the
 * browser does not keep stale PKCE attempts around.
 */
export async function clearPendingXAuthorizationAttempts() {
  await clearPendingAttempts();
}

/**
 * Persist or reconnect one founder/company X slot for the current user.
 *
 * Called by the OAuth callback after we receive tokens from X. Reads the
 * authenticated app user, fetches the authenticated X user, then updates
 * either the matching role row or a legacy null-role row for the same
 * X account. Writes to `x_accounts`.
 */
export async function connectCurrentUserXAccount(
  role: XAccountRole,
  tokenResponse: XTokenResponse,
) {
  const userId = await loadCurrentUserId();
  const accounts = await listXAccountsForUser(userId);
  const xUser = await loadAuthenticatedXUser(tokenResponse.access_token);
  const now = new Date().toISOString();
  const scope = parseScopeList(tokenResponse.scope);
  const expiresAt = tokenResponse.expires_in
    ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
    : null;
  const payload = {
    access_token: tokenResponse.access_token,
    connected_at: now,
    expires_at: expiresAt,
    refresh_token: tokenResponse.refresh_token ?? null,
    scope,
    updated_at: now,
      username: xUser.username,
      x_user_id: xUser.id,
  } satisfies Partial<StoredXAccount>;

  try {
    const existingAccount = accounts.find((account) => account.x_user_id === xUser.id) ?? null;
    const roleOwner = accounts.find(
      (account) => account.account_role === role && account.x_user_id !== xUser.id,
    );

    logXOAuth('store_prepared', {
      accessToken: maskToken(tokenResponse.access_token),
      existingAccountId: existingAccount?.id ?? null,
      refreshToken: maskToken(tokenResponse.refresh_token),
      requestedRole: role,
      scope,
      userId,
      username: xUser.username,
      xUserId: xUser.id,
    });

    let account: StoredXAccount;

    if (existingAccount) {
      account = await updateStoredXAccountRecord(existingAccount.id, payload);
    } else {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('x_accounts')
        .insert({
          ...payload,
          account_role: null,
          created_at: now,
          user_id: userId,
        })
        .select('*')
        .single();

      if (error || !data) {
        throw error;
      }

      account = data as StoredXAccount;
    }

    if (!roleOwner || roleOwner.id === account.id) {
      account = await updateStoredXAccountRecord(account.id, {
        account_role: role,
      });
      logXOAuth('store_completed', {
        accountId: account.id,
        accountRole: account.account_role,
        mode: existingAccount ? 'updated' : 'inserted',
        userId,
        username: account.username,
        xUserId: account.x_user_id,
      });

      return account;
    }

    logXOAuth('role_conflict', {
      connectedAccountId: account.id,
      requestedRole: role,
      roleOwnerAccountId: roleOwner.id,
      roleOwnerUsername: roleOwner.username,
      userId,
      username: account.username,
      xUserId: account.x_user_id,
    });

    throw new Error(
      `${role === 'company' ? 'Company' : 'Founder'} is already assigned to @${roleOwner.username}. The new X account was saved separately, but you need to disconnect or relabel the current ${role} account before assigning this role.`,
    );
  } catch (error) {
    throw new Error(
      normalizeTwitterApiError(
        error,
        'Unable to save the X connection for publishing.',
      ),
    );
  }
}

/**
 * Save an X provider token from Supabase social sign-in without assigning a role.
 *
 * Called by the Supabase auth callback. This keeps “Continue with X” useful as
 * a saved connection, but leaves the user in control of whether that account
 * should become the founder or company publishing slot.
 */
export async function connectUnlabelledXAccountForCurrentUser(
  tokenResponse: XTokenResponse,
) {
  const userId = await loadCurrentUserId();
  const xUser = await loadAuthenticatedXUser(tokenResponse.access_token);
  const now = new Date().toISOString();
  const scope = parseScopeList(tokenResponse.scope);
  const expiresAt = tokenResponse.expires_in
    ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
    : null;
  const supabase = await createClient();

  const { data: existingAccount, error: existingAccountError } = await supabase
    .from('x_accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('x_user_id', xUser.id)
    .maybeSingle();

  if (existingAccountError) {
    throw new Error('Unable to inspect the saved X connection.');
  }

  const payload = {
    access_token: tokenResponse.access_token,
    connected_at: now,
    expires_at: expiresAt,
    refresh_token: tokenResponse.refresh_token ?? null,
    scope,
    updated_at: now,
    username: xUser.username,
    x_user_id: xUser.id,
  } satisfies Partial<StoredXAccount>;

  logXOAuth('store_prepared', {
    accessToken: maskToken(tokenResponse.access_token),
    existingAccountId: existingAccount?.id ?? null,
    refreshToken: maskToken(tokenResponse.refresh_token),
    requestedRole: null,
    scope,
    userId,
    username: xUser.username,
    xUserId: xUser.id,
  });

  if (existingAccount?.id) {
    const account = await updateStoredXAccountRecord(existingAccount.id, payload);
    logXOAuth('store_completed', {
      accountId: account.id,
      accountRole: account.account_role,
      mode: 'updated',
      userId,
      username: account.username,
      xUserId: account.x_user_id,
    });
    return account;
  }

  const { data, error } = await supabase
    .from('x_accounts')
    .insert({
      ...payload,
      account_role: null,
      created_at: now,
      user_id: userId,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(
      normalizeTwitterApiError(
        error,
        'Unable to save the X sign-in connection.',
      ),
    );
  }

  const account = data as StoredXAccount;
  logXOAuth('store_completed', {
    accountId: account.id,
    accountRole: account.account_role,
    mode: 'inserted',
    userId,
    username: account.username,
    xUserId: account.x_user_id,
  });
  return account;
}

/**
 * Assign an existing saved X connection to the founder or company slot.
 *
 * Called by Analytics when a user wants to label the account they used for
 * sign-in. Writes only `account_role`; token data stays attached to the same
 * row so no reconnect is needed.
 */
export async function assignCurrentUserXAccountRole(
  accountId: string,
  role: XAccountRole,
) {
  const userId = await loadCurrentUserId();
  const accounts = await listXAccountsForUser(userId);
  const account = accounts.find((entry) => entry.id === accountId);

  if (!account) {
    throw new Error('Unable to find that saved X account.');
  }

  const roleOwner = accounts.find(
    (entry) => entry.account_role === role && entry.id !== accountId,
  );

  if (roleOwner) {
    throw new Error(
      `${role === 'company' ? 'Company' : 'Founder'} is already assigned to @${roleOwner.username}. Disconnect or relabel that account first.`,
    );
  }

  const sameXUserInOtherRole = accounts.find(
    (entry) =>
      entry.x_user_id === account.x_user_id &&
      entry.id !== accountId &&
      entry.account_role !== null &&
      entry.account_role !== role,
  );

  if (sameXUserInOtherRole) {
    throw new Error(
      `@${account.username} is already assigned as ${sameXUserInOtherRole.account_role}.`,
    );
  }

  return updateStoredXAccountRecord(account.id, {
    account_role: role,
  });
}

/**
 * Delete one founder/company X slot for the current user.
 *
 * Called by `/api/x/disconnect`. Removes only the selected role row from
 * `x_accounts` so disconnecting company never touches founder, and vice versa.
 */
export async function disconnectCurrentUserXAccount(role: XAccountRole) {
  const userId = await loadCurrentUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from('x_accounts')
    .delete()
    .eq('user_id', userId)
    .eq('account_role', role);

  if (error) {
    throw new Error('Unable to disconnect this X account.');
  }
}

/**
 * Load every stored X account row for the current user.
 *
 * Called by analytics and other server surfaces that need to render both
 * founder/company slots plus any legacy null-role rows that still need relink.
 */
export async function listCurrentUserXAccounts() {
  const userId = await loadCurrentUserId();
  return listXAccountsForUser(userId);
}

/**
 * Load all publishable founder/company X connections for the current user.
 *
 * Called by template and workflow pages that need a chooser for explicit
 * publishing selection. Legacy null-role rows are intentionally excluded.
 */
export async function listPublishingXAccountsForCurrentUser() {
  const accounts = await listCurrentUserXAccounts();
  return accounts.filter(
    (account): account is StoredXAccount & { account_role: XAccountRole } =>
      account.account_role === 'company' || account.account_role === 'founder',
  );
}

/**
 * Load a single founder/company connection for the current user.
 *
 * Called by analytics when a page needs the exact row for one role rather
 * than the full list of accounts.
 */
export async function getCurrentUserXAccount(role: XAccountRole) {
  const accounts = await listCurrentUserXAccounts();
  return accounts.find((account) => account.account_role === role) ?? null;
}

/**
 * Return whether the current user has any publishable X connections.
 *
 * Called by template surfaces that need a quick “can auto-publish” guard,
 * while still requiring an explicit founder/company choice later.
 */
export async function hasStoredXConnectionForCurrentUser() {
  const accounts = await listPublishingXAccountsForCurrentUser();
  return accounts.length > 0;
}

/**
 * Resolve a valid access token for one stored X account id.
 *
 * Called by analytics, dashboard reads, and server-side publishing helpers.
 * Reads from `x_accounts`, refreshes the token when it is near expiry, and
 * writes refreshed tokens back into `x_accounts`.
 */
export async function ensureStoredXAccessToken(accountId: string) {
  const account = await loadStoredXAccountById(accountId);
  const expiresAt = parseExpiresAt(account.expires_at);

  if (!expiresAt || expiresAt > Date.now() + 60_000) {
    logXOAuth('client_token_reused', {
      accountId: account.id,
      username: account.username,
      xUserId: account.x_user_id,
    });
    return account.access_token;
  }

  if (!account.refresh_token) {
    throw new Error(
      'Reconnect X before publishing again so we can store a refresh token for this account.',
    );
  }

  const refreshedToken = await refreshXAccessToken(account.refresh_token);
  const refreshedAccount = await persistRefreshedTokens(account, {
    ...refreshedToken,
    refresh_token: refreshedToken.refresh_token ?? account.refresh_token,
  });

  logXOAuth('client_token_refreshed', {
    accountId: refreshedAccount.id,
    username: refreshedAccount.username,
    xUserId: refreshedAccount.x_user_id,
  });

  return refreshedAccount.access_token;
}

/**
 * Force-refresh one stored X account from its refresh token.
 *
 * Called by runtime publishing code when X rejects a publish request and we
 * want one explicit token refresh retry before surfacing the failure.
 */
export async function forceRefreshStoredXAccessToken(accountId: string) {
  const account = await loadStoredXAccountById(accountId);

  if (!account.refresh_token) {
    throw new Error(
      'Reconnect X before publishing again so we can store a refresh token for this account.',
    );
  }

  const refreshedToken = await refreshXAccessToken(account.refresh_token);
  const refreshedAccount = await persistRefreshedTokens(account, {
    ...refreshedToken,
    refresh_token: refreshedToken.refresh_token ?? account.refresh_token,
  });

  return refreshedAccount.access_token;
}

/**
 * Pick the best available X handle for the current user.
 *
 * Called by analytics and onboarding to prefill UI even when live X auth is
 * unavailable. Prefers connected founder/company rows, then legacy rows,
 * then falls back to onboarding answers and autofill profiles.
 */
export async function getCurrentUserLinkedXHandle() {
  const accounts = await listCurrentUserXAccounts();
  const preferredUsername = accounts.find((account) => account.username)?.username;

  if (preferredUsername) {
    return preferredUsername;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: onboardingAnswer } = await supabase
    .from('onboarding_answers')
    .select('answer')
    .eq('user_id', user.id)
    .eq('flow_key', ONBOARDING_FLOW_KEY)
    .eq('question_key', 'x_account')
    .maybeSingle();

  const linkedHandle = extractXHandle(
    normalizeOnboardingAnswerToString(onboardingAnswer?.answer),
  );

  if (linkedHandle) {
    return linkedHandle;
  }

  const { data: autofillProfile } = await supabase
    .from('onboarding_autofill_profiles')
    .select('x_handle')
    .eq('user_id', user.id)
    .eq('flow_key', ONBOARDING_FLOW_KEY)
    .maybeSingle();

  return extractXHandle(autofillProfile?.x_handle ?? null);
}
