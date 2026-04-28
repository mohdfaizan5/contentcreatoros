/**
 * AI Chat API Route
 * Handles chat messages with Claude using Vercel AI SDK
 */

// import { createAnthropic } from '@ai-sdk/anthropic';

// Initialize Anthropic client
// const anthropic = createAnthropic({
//     apiKey: process.env.ANTHROPIC_API_KEY,
// });

// System prompt for content creator assistance
const SYSTEM_PROMPT = `You are a helpful AI assistant for content creators. You help with:
- Brainstorming content ideas
- Writing scripts and outlines
- Suggesting titles and hooks
- Planning content series
- Optimizing for different platforms (YouTube, LinkedIn, Twitter, TikTok, Instagram)
- Content strategy and scheduling advice

Be concise, creative, and actionable. Tailor your suggestions to the platform and content type when relevant.`;

import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { anthropic } from '@/shared/lib/anthropic';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic("claude-haiku-4-5"),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
