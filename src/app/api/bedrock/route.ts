import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { generateText, streamText } from 'ai';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_REGION = 'us-east-1';
const DEFAULT_FILE_NAME = 'test-bedrock.mp3';
const DEFAULT_MODEL_ID = 'amazon.nova-2-sonic-v1:0';
const DEFAULT_PROMPT =
  'Transcribe this audio as accurately as possible. Return only the transcript text.';

type BedrockAudioRequestBody = {
  fileName?: string;
  modelId?: string;
  prompt?: string;
  stream?: boolean;
};

function getRegion() {
  return (
    process.env.BEDROCK_AWS_REGION ||
    process.env.AWS_REGION ||
    process.env.AWS_DEFAULT_REGION ||
    DEFAULT_REGION
  );
}

function getProvider() {
  // Explicitly set auth fields to avoid accidental environment mixing.
  return createAmazonBedrock({
    region: getRegion(),
    apiKey: process.env.AWS_BEARER_TOKEN_BEDROCK || undefined,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || undefined,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || undefined,
    sessionToken: process.env.AWS_SESSION_TOKEN || undefined,
  });
}

function resolvePublicFilePath(fileName: string) {
  const normalized = fileName.replace(/\\/g, '/').replace(/^\/+/, '');

  if (!normalized || normalized.includes('..')) {
    throw new Error('Invalid fileName. Use a safe path inside public/.');
  }

  return path.join(process.cwd(), 'public', normalized);
}

function toUserError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected Bedrock error.';
}

export async function GET() {
  return NextResponse.json({
    route: '/api/bedrock',
    method: 'POST',
    description:
      'AI SDK + Amazon Bedrock audio processing test. Reads an audio file from /public and asks the model for a transcript-like text response.',
    defaults: {
      fileName: DEFAULT_FILE_NAME,
      modelId: DEFAULT_MODEL_ID,
      prompt: DEFAULT_PROMPT,
      stream: true,
    },
    notes: [
      'This route uses @ai-sdk/amazon-bedrock via createAmazonBedrock().',
      'Auth precedence: AWS_BEARER_TOKEN_BEDROCK, then AWS SigV4 credentials.',
      'If the selected model does not support this input mode, Bedrock will return a validation error.',
    ],
  });
}

export async function POST(request: Request) {
  let parsedBody: BedrockAudioRequestBody = {};

  try {
    if (request.headers.get('content-type')?.includes('application/json')) {
      parsedBody = (await request.json()) as BedrockAudioRequestBody;
    }
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body.' },
      { status: 400 },
    );
  }

  const fileName = parsedBody.fileName?.trim() || DEFAULT_FILE_NAME;
  const modelId = parsedBody.modelId?.trim() || DEFAULT_MODEL_ID;
  const prompt = parsedBody.prompt?.trim() || DEFAULT_PROMPT;
  const shouldStream = parsedBody.stream !== false;

  let audioBuffer: Buffer;

  try {
    audioBuffer = await readFile(resolvePublicFilePath(fileName));
  } catch (error) {
    const message = toUserError(error);

    return NextResponse.json(
      {
        success: false,
        error: message.includes('ENOENT')
          ? `File not found: public/${fileName}`
          : message,
      },
      { status: message.includes('ENOENT') ? 404 : 400 },
    );
  }

  const bedrock = getProvider();
  const messages = [
    {
      role: 'user' as const,
      content: [
        { type: 'text' as const, text: prompt },
        {
          type: 'file' as const,
          data: audioBuffer,
          mediaType: 'audio/mpeg',
        },
      ],
    },
  ];

  try {
    if (shouldStream) {
      const result = streamText({
        model: bedrock(modelId),
        messages,
        temperature: 0,
      });

      return result.toTextStreamResponse({
        headers: {
          'Cache-Control': 'no-cache, no-transform',
        },
      });
    }

    const result = await generateText({
      model: bedrock(modelId),
      messages,
      temperature: 0,
    });

    return NextResponse.json({
      success: true,
      modelId,
      region: getRegion(),
      input: {
        fileName,
        bytes: audioBuffer.byteLength,
        prompt,
      },
      output: {
        text: result.text,
        finishReason: result.finishReason,
        usage: result.usage,
        warnings: result.warnings,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        modelId,
        region: getRegion(),
        error: toUserError(error),
        hint: 'If Bedrock rejects this model/input combination, switch modelId or use the legacy /test route for raw runtime experiments.',
      },
      { status: 500 },
    );
  }
}
