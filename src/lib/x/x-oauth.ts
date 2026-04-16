export const X_OAUTH_SCOPES = [
  'users.read',
  'tweet.read',
  'offline.access',
] as const;

export const X_OAUTH_SCOPE_STRING = X_OAUTH_SCOPES.join(' ');
