'use client';

import { Loader2, Mic, PlayCircle, Square } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const DEFAULT_MODEL_ID = 'amazon.nova-2-sonic-v1:0';
const DEFAULT_FILE_NAME = 'test-bedrock.mp3';

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  [index: number]: {
    transcript: string;
  };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
  message?: string;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const typedWindow = window as Window & {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  };

  return typedWindow.SpeechRecognition || typedWindow.webkitSpeechRecognition || null;
}

export default function Test2() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [streamedOutput, setStreamedOutput] = useState('');

  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const [supportsSpeechRecognition, setSupportsSpeechRecognition] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const processAudio = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setStreamedOutput('');

    try {
      const response = await fetch('/api/bedrock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: DEFAULT_FILE_NAME,
          modelId: DEFAULT_MODEL_ID,
          stream: true,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; hint?: string }
          | null;

        throw new Error(payload?.error || `Request failed with status ${response.status}.`);
      }

      if (!response.body) {
        throw new Error('No response stream returned by /api/bedrock.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let combined = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        combined += decoder.decode(value, { stream: true });
        setStreamedOutput(combined);
      }

      const tail = decoder.decode();
      if (tail) {
        combined += tail;
        setStreamedOutput(combined);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to process audio with Bedrock.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const startLiveTranscript = () => {
    const RecognitionConstructor = getSpeechRecognitionConstructor();

    if (!RecognitionConstructor) {
      setSupportsSpeechRecognition(false);
      setMicError(
        'Speech recognition is not supported in this browser. Use Chrome or Edge on HTTPS (or localhost).',
      );
      return;
    }

    setMicError(null);
    setLiveTranscript('');
    setIsListening(true);

    const recognition = new RecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let nextTranscript = '';

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const piece = result[0]?.transcript?.trim();

        if (!piece) {
          continue;
        }

        nextTranscript = `${nextTranscript} ${piece}`.trim();
      }

      setLiveTranscript(nextTranscript);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setMicError(event.message || event.error || 'Speech recognition failed.');
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      setIsListening(false);
      recognitionRef.current = null;
      setMicError(
        error instanceof Error ? error.message : 'Unable to start microphone transcription.',
      );
    }
  };

  const stopLiveTranscript = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  };

  useEffect(() => {
    setSupportsSpeechRecognition(Boolean(getSpeechRecognitionConstructor()));

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const micStatusLabel = useMemo(
    () => (isListening ? 'Listening now' : 'Mic idle'),
    [isListening],
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_15%,hsl(var(--primary)/0.16),transparent_38%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.2))] px-4 py-10 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="space-y-3">
          <Badge variant="outline" className="w-fit bg-background/70">
            Fundamentals: AI SDK + Bedrock
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Nova Audio Test + Live Transcript
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            Simple flow: send public/{DEFAULT_FILE_NAME} to /api/bedrock using
            @ai-sdk/amazon-bedrock, and stream text output. Below that, live mic
            transcript is provided if browser support is available.
          </p>
        </header>

        <Card className="border-border/70 bg-background/75 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Bedrock Audio Test</CardTitle>
            <CardDescription>
              Model: {DEFAULT_MODEL_ID} | File: {DEFAULT_FILE_NAME}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <audio controls preload="metadata" src={`/${DEFAULT_FILE_NAME}`} className="w-full" />

            <Button onClick={processAudio} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="animate-spin" /> : <PlayCircle />}
              {isProcessing ? 'Processing...' : 'Run Bedrock Audio Test'}
            </Button>

            {errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : null}

            <div className="rounded-xl border border-border/70 bg-zinc-950 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                Streamed Model Output
              </p>
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-5 text-zinc-100">
                {streamedOutput || 'No output yet. Click Run Bedrock Audio Test.'}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-background/75 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Live Mic Transcript</CardTitle>
            <CardDescription>
              This uses browser speech recognition and does not call Bedrock.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                disabled={!supportsSpeechRecognition || isListening}
                onClick={startLiveTranscript}
              >
                <Mic />
                Start Mic Transcript
              </Button>

              <Button type="button" variant="outline" disabled={!isListening} onClick={stopLiveTranscript}>
                <Square className="fill-current" />
                Stop Mic Transcript
              </Button>

              <Badge variant="outline">{micStatusLabel}</Badge>
            </div>

            {!supportsSpeechRecognition ? (
              <p className="text-sm text-destructive">
                Browser speech recognition is unavailable. Use Chrome or Edge on HTTPS (or localhost).
              </p>
            ) : null}

            {micError ? <p className="text-sm text-destructive">{micError}</p> : null}

            <div className="rounded-xl border border-border/70 bg-background/85 p-4">
              <p className="min-h-24 whitespace-pre-wrap text-sm leading-6 md:text-base">
                {liveTranscript || 'Your live mic transcript will appear here.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
