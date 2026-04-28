"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type AudioFormat = "webm" | "wav" | "mp3" | "pcm"
export type CommitStrategy = "auto" | "manual"
export type RealtimeConnection = null

export const RealtimeEvents = {
  OPEN: "OPEN",
  CLOSE: "CLOSE",
  SESSION_STARTED: "SESSION_STARTED",
  PARTIAL_TRANSCRIPT: "PARTIAL_TRANSCRIPT",
  COMMITTED_TRANSCRIPT: "COMMITTED_TRANSCRIPT",
  ERROR: "ERROR",
} as const

export type ScribeStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "transcribing"
  | "error"

export interface TranscriptSegment {
  id: string
  text: string
  timestamp: number
  isFinal: boolean
}

export interface ScribeCallbacks {
  onSessionStarted?: () => void
  onPartialTranscript?: (data: { text: string }) => void
  onCommittedTranscript?: (data: { text: string }) => void
  onCommittedTranscriptWithTimestamps?: (data: {
    text: string
    timestamps?: { start: number; end: number }[]
  }) => void
  onError?: (error: Error | Event) => void
  onAuthError?: (data: { error: string }) => void
  onQuotaExceededError?: (data: { error: string }) => void
  onCommitThrottledError?: (data: { error: string }) => void
  onTranscriberError?: (data: { error: string }) => void
  onUnacceptedTermsError?: (data: { error: string }) => void
  onRateLimitedError?: (data: { error: string }) => void
  onInputError?: (data: { error: string }) => void
  onQueueOverflowError?: (data: { error: string }) => void
  onResourceExhaustedError?: (data: { error: string }) => void
  onSessionTimeLimitExceededError?: (data: { error: string }) => void
  onChunkSizeExceededError?: (data: { error: string }) => void
  onInsufficientAudioActivityError?: (data: { error: string }) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

export interface ScribeHookOptions extends ScribeCallbacks {
  token?: string
  modelId?: string
  baseUri?: string
  commitStrategy?: CommitStrategy
  vadSilenceThresholdSecs?: number
  vadThreshold?: number
  minSpeechDurationMs?: number
  minSilenceDurationMs?: number
  languageCode?: string
  microphone?: {
    deviceId?: string
    echoCancellation?: boolean
    noiseSuppression?: boolean
    autoGainControl?: boolean
    channelCount?: number
  }
  audioFormat?: AudioFormat
  sampleRate?: number
  autoConnect?: boolean
  includeTimestamps?: boolean
}

export interface UseScribeReturn {
  status: ScribeStatus
  isConnected: boolean
  isTranscribing: boolean
  partialTranscript: string
  committedTranscripts: TranscriptSegment[]
  error: string | null
  connect: (options?: Partial<ScribeHookOptions>) => Promise<void>
  disconnect: () => void
  sendAudio: (
    audioBase64: string,
    options?: { commit?: boolean; sampleRate?: number; previousText?: string }
  ) => void
  commit: () => void
  clearTranscripts: () => void
  getConnection: () => RealtimeConnection | null
}

const TRANSCRIBE_ENDPOINT = "/api/speech/transcribe"
const DEFAULT_MODEL_ID = "whisper-1"

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "Transcription failed"
}

function base64ToBlob(base64Audio: string): Blob {
  const base64 = base64Audio.includes(",")
    ? base64Audio.split(",").pop() || ""
    : base64Audio

  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: "audio/webm" })
}

async function transcribeBlobWithServer({
  blob,
  languageCode,
  modelId,
  onDelta,
  signal,
}: {
  blob: Blob
  languageCode?: string
  modelId: string
  onDelta: (text: string) => void
  signal?: AbortSignal
}): Promise<string> {
  const formData = new FormData()
  formData.append("file", blob, `chunk-${Date.now()}.webm`)
  formData.append("model", modelId)

  if (languageCode) {
    formData.append("language", languageCode)
  }

  const response = await fetch(TRANSCRIBE_ENDPOINT, {
    method: "POST",
    body: formData,
    signal,
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(details || "Transcription request failed")
  }

  const payload = (await response.json()) as {
    text?: string
    error?: string
  }

  if (payload.error) {
    throw new Error(payload.error)
  }

  const text = payload.text?.trim() || ""
  if (text) {
    onDelta(text)
  }

  return text
}

function useWhisperRecorder({
  onTranscribe,
  timeSlice,
}: {
  onTranscribe: (blob: Blob) => void | Promise<void>
  timeSlice: number
}) {
  const [recording, setRecording] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const isStartingRef = useRef(false)

  const stopStream = useCallback(() => {
    if (!streamRef.current) {
      return
    }

    for (const track of streamRef.current.getTracks()) {
      track.stop()
    }

    streamRef.current = null
  }, [])

  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current

    if (recorder && recorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        recorder.addEventListener(
          "stop",
          () => {
            resolve()
          },
          { once: true }
        )

        recorder.stop()
      })
    }

    recorderRef.current = null
    stopStream()
    setRecording(false)
  }, [stopStream])

  const startRecording = useCallback(async () => {
    if (recording || isStartingRef.current) {
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone recording is not supported in this browser")
    }

    isStartingRef.current = true

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder

      recorder.addEventListener("dataavailable", (event) => {
        if (!event.data || event.data.size === 0) {
          return
        }

        void onTranscribe(event.data)
      })

      recorder.addEventListener("stop", () => {
        setRecording(false)
        stopStream()
      })

      recorder.start(timeSlice)
      setRecording(true)
    } catch (error) {
      stopStream()
      throw error
    } finally {
      isStartingRef.current = false
    }
  }, [onTranscribe, recording, stopStream, timeSlice])

  useEffect(() => {
    return () => {
      void stopRecording()
    }
  }, [stopRecording])

  return {
    recording,
    startRecording,
    stopRecording,
  }
}

export function useScribe(options: ScribeHookOptions = {}): UseScribeReturn {
  const {
    onSessionStarted,
    onPartialTranscript,
    onCommittedTranscript,
    onCommittedTranscriptWithTimestamps,
    onError,
    onAuthError,
    onQuotaExceededError,
    onCommitThrottledError,
    onTranscriberError,
    onUnacceptedTermsError,
    onRateLimitedError,
    onInputError,
    onQueueOverflowError,
    onResourceExhaustedError,
    onSessionTimeLimitExceededError,
    onChunkSizeExceededError,
    onInsufficientAudioActivityError,
    onConnect,
    onDisconnect,
    modelId: defaultModelId,
    languageCode: defaultLanguageCode,
    autoConnect = false,
  } = options

  const [status, setStatus] = useState<ScribeStatus>("disconnected")
  const [partialTranscript, setPartialTranscript] = useState("")
  const [committedTranscripts, setCommittedTranscripts] = useState<
    TranscriptSegment[]
  >([])
  const [error, setError] = useState<string | null>(null)

  const activeSessionIdRef = useRef(0)
  const pendingTranscribeSessionIdRef = useRef<number | null>(null)
  const runtimeOptionsRef = useRef<Partial<ScribeHookOptions>>({})
  const clearRevisionRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const reportError = useCallback(
    (rawError: unknown, sessionId: number) => {
      if (activeSessionIdRef.current !== sessionId) {
        return
      }

      if (rawError instanceof DOMException && rawError.name === "AbortError") {
        return
      }

      const message = toErrorMessage(rawError)
      const payload = { error: message }

      setError(message)
      setStatus("error")

      if (rawError instanceof Event) {
        onError?.(rawError)
      } else if (rawError instanceof Error) {
        onError?.(rawError)
      } else {
        onError?.(new Error(message))
      }

      onTranscriberError?.(payload)

      const lowered = message.toLowerCase()
      if (lowered.includes("auth") || lowered.includes("401")) {
        onAuthError?.(payload)
      }
      if (lowered.includes("quota")) {
        onQuotaExceededError?.(payload)
      }
      if (lowered.includes("throttle")) {
        onCommitThrottledError?.(payload)
      }
      if (lowered.includes("rate") || lowered.includes("429")) {
        onRateLimitedError?.(payload)
      }
      if (lowered.includes("input") || lowered.includes("400")) {
        onInputError?.(payload)
      }
      if (lowered.includes("queue")) {
        onQueueOverflowError?.(payload)
      }
      if (lowered.includes("resource") || lowered.includes("503")) {
        onResourceExhaustedError?.(payload)
      }
      if (lowered.includes("session") && lowered.includes("limit")) {
        onSessionTimeLimitExceededError?.(payload)
      }
      if (lowered.includes("chunk") && lowered.includes("size")) {
        onChunkSizeExceededError?.(payload)
      }
      if (lowered.includes("insufficient audio")) {
        onInsufficientAudioActivityError?.(payload)
      }
      if (lowered.includes("terms")) {
        onUnacceptedTermsError?.(payload)
      }
    },
    [
      onAuthError,
      onChunkSizeExceededError,
      onCommitThrottledError,
      onError,
      onInputError,
      onInsufficientAudioActivityError,
      onQuotaExceededError,
      onQueueOverflowError,
      onRateLimitedError,
      onResourceExhaustedError,
      onSessionTimeLimitExceededError,
      onTranscriberError,
      onUnacceptedTermsError,
    ]
  )

  const commitTranscript = useCallback(
    (text: string, sessionId: number, clearRevisionAtStart: number) => {
      if (activeSessionIdRef.current !== sessionId) {
        return
      }

      if (clearRevisionRef.current !== clearRevisionAtStart) {
        return
      }

      const trimmed = text.trim()
      if (!trimmed) {
        return
      }

      const segment: TranscriptSegment = {
        id: `${Date.now()}-${Math.random()}`,
        text: trimmed,
        timestamp: Date.now(),
        isFinal: true,
      }

      setCommittedTranscripts((previous) => [...previous, segment])
      setPartialTranscript("")
      onCommittedTranscript?.({ text: trimmed })
      onCommittedTranscriptWithTimestamps?.({ text: trimmed })
    },
    [onCommittedTranscript, onCommittedTranscriptWithTimestamps]
  )

  const whisper = useWhisperRecorder({
    timeSlice: 1000,
    onTranscribe: async (blob: Blob) => {
      const sessionId =
        pendingTranscribeSessionIdRef.current ?? activeSessionIdRef.current
      const clearRevisionAtStart = clearRevisionRef.current
      const modelId =
        runtimeOptionsRef.current.modelId || defaultModelId || DEFAULT_MODEL_ID
      const languageCode =
        runtimeOptionsRef.current.languageCode || defaultLanguageCode

      pendingTranscribeSessionIdRef.current = null
      setStatus("transcribing")

      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const text = await transcribeBlobWithServer({
          blob,
          languageCode,
          modelId,
          onDelta: (deltaText) => {
            if (activeSessionIdRef.current !== sessionId) {
              return
            }
            if (clearRevisionRef.current !== clearRevisionAtStart) {
              return
            }
            setPartialTranscript(deltaText)
            onPartialTranscript?.({ text: deltaText })
          },
          signal: controller.signal,
        })

        commitTranscript(text, sessionId, clearRevisionAtStart)
      } catch (transcribeError) {
        reportError(transcribeError, sessionId)
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null
        }

        if (
          activeSessionIdRef.current === sessionId &&
          clearRevisionRef.current === clearRevisionAtStart
        ) {
          setPartialTranscript("")
          setStatus(whisper.recording ? "connected" : "disconnected")
        }
      }
    },
  })

  const connect = useCallback(
    async (runtimeOptions: Partial<ScribeHookOptions> = {}) => {
      if (whisper.recording || status === "connecting") {
        return
      }

      const sessionId = activeSessionIdRef.current + 1
      activeSessionIdRef.current = sessionId
      runtimeOptionsRef.current = runtimeOptions

      setError(null)
      setPartialTranscript("")
      setStatus("connecting")

      try {
        await whisper.startRecording()

        if (activeSessionIdRef.current !== sessionId) {
          await whisper.stopRecording()
          return
        }

        setStatus("connected")
        onSessionStarted?.()
        onConnect?.()
      } catch (connectError) {
        reportError(connectError, sessionId)
        throw connectError
      }
    },
    [
      onConnect,
      onSessionStarted,
      reportError,
      status,
      whisper.recording,
      whisper.startRecording,
      whisper.stopRecording,
    ]
  )

  const disconnect = useCallback(() => {
    pendingTranscribeSessionIdRef.current = activeSessionIdRef.current

    void whisper.stopRecording()

    setStatus("disconnected")
    onDisconnect?.()
  }, [onDisconnect, whisper.stopRecording])

  const sendAudio = useCallback(
    (
      audioBase64: string,
      _options?: { commit?: boolean; sampleRate?: number; previousText?: string }
    ) => {
      if (!audioBase64) {
        return
      }

      if (status === "disconnected" && !whisper.recording) {
        throw new Error("Not connected to transcription session")
      }

      const blob = base64ToBlob(audioBase64)
      const sessionId = activeSessionIdRef.current
      const clearRevisionAtStart = clearRevisionRef.current
      const modelId =
        runtimeOptionsRef.current.modelId || defaultModelId || DEFAULT_MODEL_ID
      const languageCode =
        runtimeOptionsRef.current.languageCode || defaultLanguageCode

      setStatus("transcribing")
      setError(null)

      const controller = new AbortController()
      abortControllerRef.current = controller

      void transcribeBlobWithServer({
        blob,
        languageCode,
        modelId,
        onDelta: (deltaText) => {
          if (activeSessionIdRef.current !== sessionId) {
            return
          }
          if (clearRevisionRef.current !== clearRevisionAtStart) {
            return
          }
          setPartialTranscript(deltaText)
          onPartialTranscript?.({ text: deltaText })
        },
        signal: controller.signal,
      })
        .then((text) => {
          commitTranscript(text, sessionId, clearRevisionAtStart)
        })
        .catch((transcribeError) => {
          reportError(transcribeError, sessionId)
        })
        .finally(() => {
          if (abortControllerRef.current === controller) {
            abortControllerRef.current = null
          }

          if (
            activeSessionIdRef.current === sessionId &&
            clearRevisionRef.current === clearRevisionAtStart
          ) {
            setPartialTranscript("")
            setStatus(whisper.recording ? "connected" : "disconnected")
          }
        })
    },
    [
      commitTranscript,
      defaultLanguageCode,
      defaultModelId,
      onPartialTranscript,
      reportError,
      status,
      whisper.recording,
    ]
  )

  const commit = useCallback(() => {
    // use-whisper handles commit behavior internally while streaming.
  }, [])

  const clearTranscripts = useCallback(() => {
    clearRevisionRef.current += 1
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setCommittedTranscripts([])
    setPartialTranscript("")
    setError(null)
  }, [])

  const getConnection = useCallback((): RealtimeConnection | null => {
    return null
  }, [])

  useEffect(() => {
    if (!autoConnect) {
      return
    }

    void connect()
  }, [autoConnect, connect])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
      void whisper.stopRecording()
    }
  }, [whisper.stopRecording])

  return {
    status,
    isConnected: status === "connected" || status === "transcribing",
    isTranscribing: status === "transcribing",
    partialTranscript,
    committedTranscripts,
    error,
    connect,
    disconnect,
    sendAudio,
    commit,
    clearTranscripts,
    getConnection,
  }
}
