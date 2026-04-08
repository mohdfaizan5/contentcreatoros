import { NextResponse } from 'next/server';

const OPENAI_TRANSCRIPT_URL = 'https://api.openai.com/v1/audio/transcriptions';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured.' },
      { status: 500 },
    );
  }

  const incomingFormData = await request.formData();
  const file = incomingFormData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'Missing audio file in request.' },
      { status: 400 },
    );
  }

  const modelValue = incomingFormData.get('model');
  const languageValue = incomingFormData.get('language');
  const promptValue = incomingFormData.get('prompt');

  const model =
    typeof modelValue === 'string' && modelValue.trim().length > 0
      ? modelValue
      : 'gpt-4o-mini-transcribe';

  const upstreamFormData = new FormData();
  upstreamFormData.append('file', file, file.name || 'audio.webm');
  upstreamFormData.append('model', model);
  upstreamFormData.append('stream', 'true');

  if (typeof languageValue === 'string' && languageValue.trim().length > 0) {
    upstreamFormData.append('language', languageValue);
  }

  if (typeof promptValue === 'string' && promptValue.trim().length > 0) {
    upstreamFormData.append('prompt', promptValue);
  }

  const upstreamResponse = await fetch(OPENAI_TRANSCRIPT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: upstreamFormData,
    cache: 'no-store',
  });

  if (!upstreamResponse.ok) {
    const errorText = await upstreamResponse.text();

    return NextResponse.json(
      {
        error: 'OpenAI transcription request failed.',
        details: errorText,
      },
      { status: upstreamResponse.status },
    );
  }

  if (!upstreamResponse.body) {
    return NextResponse.json(
      { error: 'OpenAI did not return a streaming body.' },
      { status: 502 },
    );
  }

  return new Response(upstreamResponse.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
