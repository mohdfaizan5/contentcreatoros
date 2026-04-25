const X_POST_CHARACTER_LIMIT = 280;
const WORKFLOW_MULTI_POST_SPLIT_PATTERN =
  /\n{2,}(?=Post\s*\d+\s*:|\d+\.\s*Post\s*\d+\s*:)|(?=^Post\s*\d+\s*:)|(?=^\d+\.\s*Post\s*\d+\s*:)/gim;

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

export function splitWorkflowSuggestedPosts(
  suggestedPost: string | null | undefined,
  characterLimit = X_POST_CHARACTER_LIMIT,
) {
  const normalizedSuggestedPost = (suggestedPost ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  if (!normalizedSuggestedPost) {
    return [];
  }

  const parts = normalizedSuggestedPost
    .split(WORKFLOW_MULTI_POST_SPLIT_PATTERN)
    .map((part) =>
      normalizeTweetText(
        part
          .replace(/^\d+\.\s*/gm, '')
          .replace(/^Post\s*\d+\s*:\s*/gim, ''),
        characterLimit,
      ),
    )
    .filter(Boolean);

  return [...new Set(parts)];
}

export { X_POST_CHARACTER_LIMIT };
