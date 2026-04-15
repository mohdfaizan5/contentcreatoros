export function buildTweetIntentUrl(text: string) {
  const params = new URLSearchParams({ text });
  return `https://x.com/intent/post?${params.toString()}`;
}
