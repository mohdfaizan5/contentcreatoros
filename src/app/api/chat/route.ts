/**
 * AI Chat API Route
 * Handles chat messages with Claude using Vercel AI SDK
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

// Initialize Anthropic client
const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt for content creator assistance
const SYSTEM_PROMPT = `You are a helpful AI assistant for content creators. You help with:
- Brainstorming content ideas
- Writing scripts and outlines
- Suggesting titles and hooks
- Planning content series
- Optimizing for different platforms (YouTube, LinkedIn, Twitter, TikTok, Instagram)
- Content strategy and scheduling advice

Be concise, creative, and actionable. Tailor your suggestions to the platform and content type when relevant.`;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        const result = streamText({
            model: anthropic('claude-3-5-sonnet-20241022'),
            system: SYSTEM_PROMPT,
            messages,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error('AI chat error:', error);
        return new Response('Failed to process chat request', { status: 500 });
    }
}
