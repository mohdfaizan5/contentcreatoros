'use client';

import { ArrowRight, Loader2, Mic, RotateCcw, Sparkles, Square } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from "canvas-confetti"

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { BenfitsAnimatedBeam } from '@/features/onboarding/components/benefits-animated-beam';
import { OnboardingTerminal } from '@/features/onboarding/components/onboarding-end-animation-terminal';

type StreamStatus = 'idle' | 'streaming' | 'done' | 'error';

type StreamEvent = {
  id: string;
  event: string;
  payload: unknown;
};

type ParsedSseEvent = {
  event: string;
  data: unknown;
};

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

function parseSseEvent(rawBlock: string): ParsedSseEvent | null {
  const lines = rawBlock.split(/\r?\n/);
  let eventName = 'message';
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim() || 'message';
      continue;
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  const rawData = dataLines.join('\n');

  try {
    return {
      event: eventName,
      data: JSON.parse(rawData) as unknown,
    };
  } catch {
    return {
      event: eventName,
      data: rawData,
    };
  }
}

function extractTextCandidate(payload: unknown, depth = 0): string {
  if (depth > 4 || payload == null) {
    return '';
  }

  if (typeof payload === 'string') {
    return payload.trim();
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const value = extractTextCandidate(item, depth + 1);
      if (value) {
        return value;
      }
    }

    return '';
  }

  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>;

    const directTextKeys = [
      'text',
      'outputText',
      'delta',
      'transcript',
      'message',
      'raw',
    ];

    for (const key of directTextKeys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    for (const value of Object.values(record)) {
      const nested = extractTextCandidate(value, depth + 1);
      if (nested) {
        return nested;
      }
    }
  }

  return '';
}

function payloadToString(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload;
  }

  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}
import { AnimatePresence, motion } from 'motion/react';

export default function TestVoicePage() {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [supportsSpeechRecognition, setSupportsSpeechRecognition] = useState(true);

  const [streamStatus, setStreamStatus] = useState<StreamStatus>('idle');
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamedText, setStreamedText] = useState('');
  const [streamEvents, setStreamEvents] = useState<StreamEvent[]>([]);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const manualStopRef = useRef(false);
  const transcriptRef = useRef('');
  const interimTranscriptRef = useRef('');

  const abortRef = useRef<AbortController | null>(null);
  const activeStreamIdRef = useRef(0);

  const updateFinalTranscript = useCallback((value: string) => {
    transcriptRef.current = value;
    setTranscript(value);
  }, []);

  const updateInterimTranscript = useCallback((value: string) => {
    interimTranscriptRef.current = value;
    setInterimTranscript(value);
  }, []);

  const appendStreamEvent = useCallback((event: string, payload: unknown) => {
    setStreamEvents((previous) => {
      const next: StreamEvent = {
        id: `${Date.now()}-${Math.random()}`,
        event,
        payload,
      };

      return [...previous, next].slice(-60);
    });
  }, []);

  const processSseEvent = useCallback(
    (parsedEvent: ParsedSseEvent) => {
      appendStreamEvent(parsedEvent.event, parsedEvent.data);

      if (parsedEvent.event === 'chunk') {
        const chunkText = extractTextCandidate(parsedEvent.data);

        if (chunkText) {
          setStreamedText((previous) => {
            if (!previous) {
              return chunkText;
            }

            return `${previous} ${chunkText}`;
          });
        }

        return;
      }

      if (parsedEvent.event === 'error') {
        setStreamStatus('error');
        setStreamError(
          extractTextCandidate(parsedEvent.data) ||
          'Stream returned an error event.',
        );
        return;
      }

      if (parsedEvent.event === 'done') {
        setStreamStatus('done');
      }
    },
    [appendStreamEvent],
  );

  const streamToTestRoute = useCallback(
    async (spokenText: string) => {
      const text = spokenText.trim();

      if (!text) {
        return;
      }

      activeStreamIdRef.current += 1;
      const streamId = activeStreamIdRef.current;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStreamStatus('streaming');
      setStreamError(null);
      setStreamedText('');
      setStreamEvents([]);

      appendStreamEvent('client', {
        message: 'Sending transcript to /test.',
        text,
      });

      try {
        const response = await fetch('/test', {
          method: 'POST',
          headers: {
            Accept: 'text/event-stream',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const details = await response.text();
          throw new Error(details || 'Request to /test failed.');
        }

        if (!response.body) {
          throw new Error('No stream body was returned from /test.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          if (activeStreamIdRef.current !== streamId) {
            await reader.cancel();
            return;
          }

          buffer += decoder.decode(value, { stream: true });

          while (true) {
            const delimiterIndex = buffer.indexOf('\n\n');
            if (delimiterIndex < 0) {
              break;
            }

            const rawBlock = buffer.slice(0, delimiterIndex);
            buffer = buffer.slice(delimiterIndex + 2);

            const parsedEvent = parseSseEvent(rawBlock);
            if (parsedEvent) {
              processSseEvent(parsedEvent);
            }
          }
        }

        if (buffer.trim()) {
          const parsedEvent = parseSseEvent(buffer);
          if (parsedEvent) {
            processSseEvent(parsedEvent);
          }
        }

        setStreamStatus((previous) =>
          previous === 'error' ? previous : 'done',
        );
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Failed to stream data from /test.';

        setStreamStatus('error');
        setStreamError(message);
        appendStreamEvent('client-error', { message });
      }
    },
    [appendStreamEvent, processSseEvent],
  );

  const finalizeInterimIntoTranscript = useCallback(() => {
    const interim = interimTranscriptRef.current.trim();

    if (!interim) {
      return;
    }

    const combined = `${transcriptRef.current} ${interim}`.trim();
    updateFinalTranscript(combined);
    updateInterimTranscript('');
  }, [updateFinalTranscript, updateInterimTranscript]);

  const startListening = useCallback(() => {
    const RecognitionConstructor = getSpeechRecognitionConstructor();

    if (!RecognitionConstructor) {
      setSupportsSpeechRecognition(false);
      setSpeechError(
        'Speech recognition is not supported in this browser. Use Chrome or Edge on HTTPS (or localhost).',
      );
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setSpeechError(null);
    updateFinalTranscript('');
    updateInterimTranscript('');
    setIsListening(true);
    manualStopRef.current = false;

    const recognition = new RecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let nextFinal = transcriptRef.current;
      let nextInterim = '';

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcriptPiece = result[0]?.transcript?.trim();

        if (!transcriptPiece) {
          continue;
        }

        if (result.isFinal) {
          nextFinal = `${nextFinal} ${transcriptPiece}`.trim();
        } else {
          nextInterim = `${nextInterim} ${transcriptPiece}`.trim();
        }
      }

      updateFinalTranscript(nextFinal);
      updateInterimTranscript(nextInterim);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setSpeechError(event.message || event.error || 'Speech recognition failed.');
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;

      if (!manualStopRef.current) {
        return;
      }

      const spoken = transcriptRef.current.trim();

      if (spoken) {
        void streamToTestRoute(spoken);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      recognitionRef.current = null;
      setIsListening(false);
      setSpeechError(
        error instanceof Error ? error.message : 'Unable to start microphone recognition.',
      );
    }
  }, [streamToTestRoute, updateFinalTranscript, updateInterimTranscript]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) {
      return;
    }

    finalizeInterimIntoTranscript();
    manualStopRef.current = true;
    recognitionRef.current.stop();
  }, [finalizeInterimIntoTranscript]);

  const clearSpeechCapture = useCallback(() => {
    manualStopRef.current = true;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setSpeechError(null);
    setIsListening(false);
    updateFinalTranscript('');
    updateInterimTranscript('');
  }, [updateFinalTranscript, updateInterimTranscript]);

  useEffect(() => {
    setSupportsSpeechRecognition(Boolean(getSpeechRecognitionConstructor()));

    return () => {
      abortRef.current?.abort();
      manualStopRef.current = true;
      recognitionRef.current?.stop();
    };
  }, []);

  const liveTranscript = useMemo(
    () => `${transcript} ${interimTranscript}`.trim(),
    [interimTranscript, transcript],
  );

  const statusBadgeVariant = useMemo(() => {
    switch (streamStatus) {
      case 'streaming':
        return 'default' as const;
      case 'done':
        return 'secondary' as const;
      case 'error':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  }, [streamStatus]);
  const handleClick = () => {
    const end = Date.now() + 3 * 1000 // 3 seconds
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"]
    const frame = () => {
      if (Date.now() > end) return
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      })
      requestAnimationFrame(frame)
    }
    frame()
  }

  useEffect(() => {
      handleClick()
  }, []);
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,hsl(var(--primary)/0.16),transparent_40%),radial-gradient(circle_at_90%_90%,hsl(var(--accent)/0.2),transparent_45%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.22))] px-4 py-10 md:px-8">
      <div className="flex min-h-svh items-center justify-center  p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl space-y-5"
        >
          {/* <Button onClick={handleClick}>Trigger Side Cannons</Button> */}

          <OnboardingTerminal mode="complete" />

          <div className="flex items-center justify-between rounded-xl border border-border/40 bg-white p-4 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.55)]">
            <p className="text-sm text-slate-600">Finalizing your setup and taking you to the workspace...</p>
            <Button
              className="h-10 rounded-full px-5"
            // onClick={() => router.push(redirectTo)}
            >
              Continue now
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </motion.div>
      </div>
      {/* <div className="flex min-h-svh items-center justify-center  p-6 ">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl space-y-5"
        >
          <OnboardingTerminal mode="processing" />

          <div className="rounded-xl border border-border/40  p-4 text-sm bg-card shadow-[0_24px_50px_-40px_rgba(15,23,42,0.55)]">
            Analyzing your website, extracting brand signals, and prefilling your answers...
          </div>
        </motion.div>
      </div> */}
      {/* <BenfitsAnimatedBeam /> */}
      {/* <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="space-y-3">
          <Badge variant="outline" className="w-fit bg-background/70">
            Nova Sonic Test Surface
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Click Mic, Speak, Stream to /test
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            Speak into the microphone to get live transcript updates. When you
            stop recording, the transcript is sent to /test and the response
            stream is rendered live below.
          </p>
        </header>

        <Card className="border-border/70 bg-background/75 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Voice Input</CardTitle>
            <CardDescription>
              One click starts recording, second click stops and sends your text
              to the route.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => {
                  if (isListening) {
                    stopListening();
                  } else {
                    startListening();
                  }
                }}
                className="h-14 rounded-full px-5 text-base"
                disabled={!supportsSpeechRecognition}
              >
                {isListening ? <Square className="fill-current" /> : <Mic />}
                {isListening ? 'Stop & Stream' : 'Start Mic'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={clearSpeechCapture}
                disabled={!liveTranscript && !isListening}
              >
                <RotateCcw />
                Clear
              </Button>

              <Button
                variant="outline"
                disabled={!liveTranscript || streamStatus === 'streaming'}
                onClick={() => {
                  void streamToTestRoute(liveTranscript);
                }}
              >
                {streamStatus === 'streaming' ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Sparkles />
                )}
                Stream Current Transcript
              </Button>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/85 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isListening ? 'animate-pulse bg-emerald-500' : 'bg-zinc-400'
                  }`}
                />
                {isListening ? 'Listening now' : 'Mic idle'}
              </div>
              <p className="min-h-24 whitespace-pre-wrap text-sm leading-6 md:text-base">
                {liveTranscript ||
                  'Your spoken words will appear here in real time as text.'}
              </p>
              {!supportsSpeechRecognition ? (
                <p className="mt-3 text-sm text-destructive">
                  Browser speech recognition is unavailable. Use Chrome or Edge on HTTPS (or localhost).
                </p>
              ) : null}
              {speechError ? (
                <p className="mt-3 text-sm text-destructive">{speechError}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-background/75 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Route Stream Output</CardTitle>
                <CardDescription>
                  SSE events from /test are rendered here.
                </CardDescription>
              </div>
              <Badge variant={statusBadgeVariant}>{streamStatus}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/70 bg-background/85 p-4">
              <p className="min-h-24 whitespace-pre-wrap text-sm leading-6 md:text-base">
                {streamedText ||
                  'Text-like chunks from the model stream will show up here.'}
              </p>
              {streamError ? (
                <p className="mt-3 text-sm text-destructive">{streamError}</p>
              ) : null}
            </div>

            <div className="rounded-xl border border-border/70 bg-zinc-950 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                Raw Stream Events
              </p>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-5 text-zinc-100">
                {streamEvents.length === 0
                  ? 'No stream events yet. Speak and stop once to trigger /test.'
                  : streamEvents
                      .map(
                        (entry) =>
                          `[${entry.event}] ${payloadToString(entry.payload)}`,
                      )
                      .join('\n\n')}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div> */}
    </main>
  );
}

