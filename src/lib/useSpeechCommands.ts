import { useEffect, useRef, useState } from 'react'

/*
 * Thin wrapper around the Web Speech API for hands-free "Spotify, add" /
 * "Spotify, skip" commands. Real recognition runs in Chromium-based browsers;
 * everywhere else `supported` is false and the UI falls back to tap buttons.
 *
 * The Web Speech types aren't in the standard DOM lib, so we declare the
 * minimum surface we use.
 */
export type VoiceCommand = 'add' | 'skip'

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as any
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const ADD_RE = /\b(add|yes|keep|save|like)\b/
const SKIP_RE = /\b(skip|next|no|pass|reject)\b/

function classify(transcript: string): VoiceCommand | null {
  const t = transcript.toLowerCase()
  // SKIP first so "no, skip" doesn't read as add.
  if (SKIP_RE.test(t)) return 'skip'
  if (ADD_RE.test(t)) return 'add'
  return null
}

interface Result {
  /** Whether the browser supports speech recognition at all. */
  supported: boolean
  /** Whether the mic is actively listening right now. */
  listening: boolean
  /** Latest error code from the API, if any (e.g. 'not-allowed'). */
  error: string | null
  /** Last transcript heard, for on-screen feedback. */
  transcript: string
}

/**
 * @param enabled    turn the mic on/off
 * @param onCommand  fired once per recognized command, debounced
 */
export function useSpeechCommands(
  enabled: boolean,
  onCommand: (cmd: VoiceCommand) => void,
): Result {
  const supported = getRecognitionCtor() !== null
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')

  // Keep the latest callback without re-subscribing recognition.
  const cmdRef = useRef(onCommand)
  cmdRef.current = onCommand
  const lastFiredRef = useRef(0)

  useEffect(() => {
    const Ctor = getRecognitionCtor()
    if (!enabled || !Ctor) {
      setListening(false)
      return
    }

    let stopped = false
    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'

    rec.onresult = (event: any) => {
      const res = event.results[event.results.length - 1]
      const text: string = res[0].transcript
      setTranscript(text)
      const cmd = classify(text)
      const now = Date.now()
      // Debounce: one command per 1.2s so a single phrase fires once.
      if (cmd && now - lastFiredRef.current > 1200) {
        lastFiredRef.current = now
        cmdRef.current(cmd)
      }
    }

    rec.onerror = (event: any) => {
      setError(event?.error ?? 'error')
    }

    // Chrome auto-stops after a pause; restart to stay continuous.
    rec.onend = () => {
      if (!stopped) {
        try {
          rec.start()
        } catch {
          /* already starting */
        }
      } else {
        setListening(false)
      }
    }

    try {
      rec.start()
      setListening(true)
      setError(null)
    } catch (e: any) {
      setError(e?.message ?? 'start-failed')
    }

    return () => {
      stopped = true
      rec.onend = null
      rec.onresult = null
      rec.onerror = null
      try {
        rec.abort()
      } catch {
        /* noop */
      }
      setListening(false)
    }
  }, [enabled])

  return { supported, listening, error, transcript }
}
