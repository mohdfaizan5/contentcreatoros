const X_POST_CHARACTER_LIMIT = 280;

export function normalizeTweetText(
  text: string,
  characterLimit = X_POST_CHARACTER_LIMIT,
) {
  const normalizedLineEndings = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const normalizedText = normalizedLineEndings
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();

  if (!normalizedText) {
    return '';
  }

  if (normalizedText.length <= characterLimit) {
    return normalizedText;
  }

  return normalizedText.slice(0, characterLimit).trimEnd();
}

export function buildTweetContentForScheduling(
  suggestedPost: string | null | undefined,
  fallbackPillar: string,
  fallbackAngle: string,
  characterLimit = X_POST_CHARACTER_LIMIT,
) {
  const normalizedSuggestedPost = normalizeTweetText(
    suggestedPost ?? '',
    characterLimit,
  );

  if (normalizedSuggestedPost) {
    return normalizedSuggestedPost;
  }

  return normalizeTweetText(
    `${fallbackPillar}: ${fallbackAngle}`,
    characterLimit,
  );
}

export { X_POST_CHARACTER_LIMIT };