import { createAnthropic } from '@ai-sdk/anthropic';

const anthropicApiKey = process.env.ANTHROPIC_API_KEY?.trim();

export const anthropic = createAnthropic({
  apiKey: anthropicApiKey,
  baseURL: 'https://api.anthropic.com/v1',
});

