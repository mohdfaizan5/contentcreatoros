'use client';

import { Loader2, Mic, Square, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const DEFAULT_MODEL_ID = 'whisper-1';
const TRANSCRIBE_ENDPOINT = '/api/speech/transcribe';

type RecordingStatus = 'idle' | 'recording' | 'transcribing' | 'error';

type TranscriptionPayload = {
  text?: string;
  error?: string;
};

type BaseSpeechInputProProps = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  modelId?: string;
  languageCode?: string;
  className?: string;
  disabled?: boolean;
  onError?: (message: string) => void;
};

type SpeechInputProProps =
  | (BaseSpeechInputProProps & {
      as?: 'input';
      type?: string;
    })
  | (BaseSpeechInputProProps & {
      as: 'textarea';
      rows?: number;
    });

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
  disabled,
  onStart,
  onStop,
  onCancel,
}: {
  isRecording: boolean;
  isTranscribing: boolean;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
}) {
  if (isRecording) {
    return (
      <div className="inline-flex items-center gap-0 rounded-xl border border-zinc-700/80 bg-zinc-900 shadow-sm">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onCancel}
          className="text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
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
          <Square className="h-3.5 w-3.5 fill-[#FF6467]" />
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
      disabled={disabled || isTranscribing}
      className="rounded-lg hover:bg-muted-foreground/20"
      aria-label={isTranscribing ? 'Transcribing...' : 'Start recording'}
    >
      {isTranscribing ? <Loader2 className="animate-spin" /> : <Mic />}
    </Button>
  );
}

export function SpeechInputPro(props: SpeechInputProProps) {
  const {
    id,
    value,
    onValueChange,
    placeholder,
    modelId = DEFAULT_MODEL_ID,
    languageCode,
    className,
    disabled,
    onError,
  } = props;

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

  const reportError = (message: string) => {
    setErrorMessage(message);
    setStatus('error');
    onError?.(message);
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

      const normalizedLanguage = languageCode?.trim();
      if (normalizedLanguage) {
        formData.append('language', normalizedLanguage);
      }

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
        onValueChange((value.trim() ? `${value.trim()} ${transcript}` : transcript).trim());
      }

      setStatus('idle');
      setErrorMessage(null);
    } catch (error) {
      reportError(toErrorMessage(error));
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
    if (status === 'recording' || status === 'transcribing' || disabled) {
      return;
    }

    setErrorMessage(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      reportError('Microphone is not supported in this browser.');
      return;
    }

    if (typeof window === 'undefined' || !('MediaRecorder' in window)) {
      reportError('MediaRecorder is not available in this browser.');
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
        reportError('Recording failed. Please try again.');
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
      reportError(toErrorMessage(error));
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

  if (props.as === 'textarea') {
    return (
      <div className="space-y-2">
        <div className="relative">
          <Textarea
            id={id}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={placeholder}
            rows={props.rows ?? 4}
            disabled={disabled}
            className={cn('resize-none pb-14', className)}
          />

          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <RecorderControls
              isRecording={isRecording}
              isTranscribing={isTranscribing}
              disabled={disabled}
              onStart={() => {
                void startRecording();
              }}
              onStop={stopRecording}
              onCancel={cancelRecording}
            />
          </div>
        </div>

        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type={props.type ?? 'text'}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn('flex-1', className)}
        />

        <RecorderControls
          isRecording={isRecording}
          isTranscribing={isTranscribing}
          disabled={disabled}
          onStart={() => {
            void startRecording();
          }}
          onStop={stopRecording}
          onCancel={cancelRecording}
        />
      </div>

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
    </div>
  );
}
