'use client';

import { Loader2, Mic, Square, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

const DEFAULT_MODEL_ID = 'whisper-1';
const TRANSCRIBE_ENDPOINT = '/api/speech/transcribe';

type RecordingStatus = 'idle' | 'recording' | 'transcribing' | 'error';

type TranscriptionPayload = {
  text?: string;
  error?: string;
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Something went wrong.';
}

function extensionFromMimeType(mimeType: string): string {
  if (mimeType.includes('wav')) {
    return 'wav';
  }
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) {
    return 'mp3';
  }
  if (mimeType.includes('mp4')) {
    return 'mp4';
  }
  return 'webm';
}

function RecorderControls({
  isRecording,
  isTranscribing,
  onStart,
  onStop,
  onCancel,
  className,
}: {
  isRecording: boolean;
  isTranscribing: boolean;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
  className?: string;
}) {
  if (isRecording) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-0 rounded-xl border border-zinc-700/80 bg-zinc-900 shadow-sm',
          className,
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onCancel}
          className=" text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
          aria-label="Cancel recording"
        >
          <X className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onStop}
          className="hover:bg-muted/10"
          aria-label="Stop recording"
        >
          <Square className="h-3.5 w-3.5 fill- fill-[#FF6467]" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onStart}
      disabled={isTranscribing}
      className={cn("rounded-lg hover:bg-muted-foreground/20",className)}
      aria-label={isTranscribing ? 'Transcribing...' : 'Start recording'}
    >
      {isTranscribing ? <Loader2 className="animate-spin" /> : <Mic />}
    </Button>
  );
}

export default function Test4Page() {
  const [value, setValue] = useState('');
  const modelId = DEFAULT_MODEL_ID;
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isStoppingRef = useRef(false);
  const shouldTranscribeOnStopRef = useRef(true);

  const stopStreamTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const resetRecorderRefs = () => {
    recorderRef.current = null;
    chunksRef.current = [];
    isStoppingRef.current = false;
    shouldTranscribeOnStopRef.current = true;
  };

  const resetAfterRecording = () => {
    stopStreamTracks();
    resetRecorderRefs();
  };

  const transcribeRecordedAudio = async () => {
    try {
      const mimeType =
        recorderRef.current?.mimeType || chunksRef.current[0]?.type || 'audio/webm';
      const audioBlob = new Blob(chunksRef.current, { type: mimeType });

      if (audioBlob.size === 0) {
        throw new Error('No audio detected. Please speak and try again.');
      }

      const extension = extensionFromMimeType(mimeType);
      const formData = new FormData();
      formData.append(
        'file',
        new File([audioBlob], `recording-${Date.now()}.${extension}`, {
          type: mimeType,
        }),
      );
      formData.append('model', modelId.trim() || DEFAULT_MODEL_ID);

      const response = await fetch(TRANSCRIBE_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      const payload = (await response.json()) as TranscriptionPayload;

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to transcribe recording.');
      }

      if (payload.error) {
        throw new Error(payload.error);
      }

      const transcript = payload.text?.trim() || '';
      if (transcript) {
        setValue((previous) => {
          const prefix = previous.trim();
          return prefix ? `${prefix} ${transcript}` : transcript;
        });
      }

      setStatus('idle');
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      setStatus('error');
    } finally {
      resetAfterRecording();
    }
  };

  const stopRecording = () => {
    if (status !== 'recording') {
      return;
    }

    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive' || isStoppingRef.current) {
      return;
    }

    isStoppingRef.current = true;
    shouldTranscribeOnStopRef.current = true;
    setStatus('transcribing');
    recorder.stop();
  };

  const cancelRecording = () => {
    if (status !== 'recording') {
      return;
    }

    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive' || isStoppingRef.current) {
      return;
    }

    isStoppingRef.current = true;
    shouldTranscribeOnStopRef.current = false;
    setErrorMessage(null);
    setStatus('idle');
    recorder.stop();
  };

  const startRecording = async () => {
    if (status === 'recording' || status === 'transcribing') {
      return;
    }

    setErrorMessage(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setErrorMessage('Microphone is not supported in this browser.');
      return;
    }

    if (typeof window === 'undefined' || !('MediaRecorder' in window)) {
      setStatus('error');
      setErrorMessage('MediaRecorder is not available in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];
      shouldTranscribeOnStopRef.current = true;

      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
      ];
      const supportedMimeType = preferredTypes.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );

      const recorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setStatus('error');
        setErrorMessage('Recording failed. Please try again.');
        resetAfterRecording();
      };

      recorder.onstop = () => {
        if (!shouldTranscribeOnStopRef.current) {
          resetAfterRecording();
          return;
        }

        void transcribeRecordedAudio();
      };

      recorder.start(250);
      setStatus('recording');
    } catch (error) {
      stopStreamTracks();
      resetRecorderRefs();
      setStatus('error');
      setErrorMessage(toErrorMessage(error));
    }
  };

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        shouldTranscribeOnStopRef.current = false;
        recorderRef.current.stop();
      }
      stopStreamTracks();
      resetRecorderRefs();
    };
  }, []);

  const isRecording = status === 'recording';
  const isTranscribing = status === 'transcribing';

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_12%,hsl(var(--primary)/0.16),transparent_38%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.2))] px-4 py-10 md:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Type or dictate..."
            className="flex-1"
          />

          <RecorderControls
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            onStart={() => {
              void startRecording();
            }}
            onStop={stopRecording}
            onCancel={cancelRecording}
          />
        </div>
        <div className="relative">
          <Textarea
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
            }}
            placeholder="Jot down some thoughts..."
            className="min-h-30 resize-none rounded-2xl px-3.5 pt-3 pb-14"
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <RecorderControls
            
              isRecording={isRecording}
              isTranscribing={isTranscribing}
              onStart={() => {
                void startRecording();
              }}
              onStop={stopRecording}
              onCancel={cancelRecording}
            />
            {/* <SpeechInput
              size="sm"
              getToken={getToken}
              onStart={() => {
                valueAtStartRef.current = value
              }}
              onChange={({ transcript }) => {
                setValue(valueAtStartRef.current + transcript)
              }}
              onStop={({ transcript }) => {
                setValue(valueAtStartRef.current + transcript)
              }}
              onCancel={() => {
                setValue(valueAtStartRef.current)
              }}
              onError={(error) => {
                toast.error(String(error))
              }}
            >
              <SpeechInputCancelButton />
              <SpeechInputPreview placeholder="Listening..." />
              <SpeechInputRecordButton />
            </SpeechInput> */}
          </div>
        </div>
        
        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}
        {/* <Card className="border-border/70 bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Input + Mic</CardTitle>
            <CardDescription>
              Minimal flow: record, stop, transcribe, append to input.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">


            <div className="rounded-xl border border-border/70 bg-background/90 p-3">
              <p className="text-xs text-muted-foreground">
                While recording, the button turns red. Press it again to stop
                and send audio to OpenAI.
              </p>
            </div>


          </CardContent>
        </Card> */}
      </div>
    </main>
  );
}