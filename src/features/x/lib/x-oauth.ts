export const X_OAUTH_SCOPES = [
  'users.read',
  'tweet.read',
  'tweet.write',
  'media.write',
  'offline.access',
] as const;

export const REQUIRED_X_OAUTH_SCOPES = new Set<string>(X_OAUTH_SCOPES);

export const X_OAUTH_SCOPE_STRING = X_OAUTH_SCOPES.join(' ');
