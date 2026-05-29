import { useEffect, useRef, useState } from 'react'
import { PhoneFrame } from '../devices/PhoneFrame'
import { MobileApp } from '../spotify-app/MobileApp'
import { MicIcon } from '../icons'
import { FLOWS, type DemoStep } from './flows'
import './DemoPhone.css'

/**
 * Auto-playing Build Mode preview.
 *
 * Drives the *real* MobileApp through the scripted FLOWS with a visible touch
 * cursor — finding each control by its `data-demo` key, gliding to it and
 * tapping it — so every path through the feature is demonstrated hands-off.
 * Between flows the screen fades to black and the next one starts from scratch
 * (the app is remounted via `key`). It loops forever and is non-interactive: a
 * transparent blocker swallows real taps, "Try it yourself" is the way in.
 *
 * Honors prefers-reduced-motion by showing a static first screen instead.
 */

// Logical screen size — matches PhoneFrame's internal resolution. The frame is
// CSS-scaled, so we convert element rects back into this space for the cursor.
const SCREEN_W = 390

// Cursor glide duration; MUST match the CSS transition on .demo-cursor.
const CURSOR_MOVE_MS = 975

class Cancelled extends Error {}

type Caption = { text: string; kind: 'step' | 'voice' | 'title'; sub?: string }

export function DemoPhone({ width }: { width: number }) {
  const layerRef = useRef<HTMLDivElement>(null)

  const [flowIdx, setFlowIdx] = useState(0)
  const [runId, setRunId] = useState(0) // bump to remount MobileApp fresh
  const [cursor, setCursor] = useState({ x: SCREEN_W / 2, y: 540 })
  const [cursorShown, setCursorShown] = useState(false)
  const [pressing, setPressing] = useState(false)
  const [rippleKey, setRippleKey] = useState(0)
  const [caption, setCaption] = useState<Caption | null>(null)
  const [covered, setCovered] = useState(true) // black fade cover

  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) {
      setCovered(false)
      return
    }

    const ac = new AbortController()
    const { signal } = ac

    const sleep = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        if (signal.aborted) return reject(new Cancelled())
        const t = window.setTimeout(() => {
          signal.removeEventListener('abort', onAbort)
          resolve()
        }, ms)
        const onAbort = () => {
          window.clearTimeout(t)
          reject(new Cancelled())
        }
        signal.addEventListener('abort', onAbort)
      })

    // The layer is a direct child of .phone-screen, so its parent scopes our
    // element lookups to THIS phone (the page may host more than one).
    const screen = () => layerRef.current?.parentElement ?? null
    const findEl = (key: string) =>
      screen()?.querySelector<HTMLElement>(`[data-demo="${key}"]`) ?? null

    const waitFor = async (key: string, timeout = 5000): Promise<HTMLElement> => {
      const start = Date.now()
      for (;;) {
        const el = findEl(key)
        if (el) return el
        if (Date.now() - start > timeout) throw new Error(`demo: timed out on "${key}"`)
        await sleep(70)
      }
    }

    // Element center → logical screen coordinates (undo the frame's scale).
    const toLocal = (el: HTMLElement) => {
      const root = layerRef.current!
      const r = root.getBoundingClientRect()
      const scale = r.width / SCREEN_W
      const b = el.getBoundingClientRect()
      return {
        x: (b.left + b.width / 2 - r.left) / scale,
        y: (b.top + b.height / 2 - r.top) / scale,
      }
    }

    const glideTo = async (el: HTMLElement) => {
      setCursor(toLocal(el))
      setCursorShown(true)
      await sleep(CURSOR_MOVE_MS)
    }

    const tap = async (el: HTMLElement) => {
      await glideTo(el)
      await sleep(300)
      setPressing(true)
      setRippleKey((k) => k + 1)
      await sleep(188)
      el.click()
      setPressing(false)
      await sleep(600)
    }

    const typeInto = async (key: string, text: string) => {
      const input = (await waitFor(key)) as HTMLInputElement
      await glideTo(input)
      await sleep(250)
      setPressing(true)
      setRippleKey((k) => k + 1)
      await sleep(200)
      setPressing(false)
      input.focus()
      const setValue = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      )?.set
      let acc = ''
      for (const ch of text) {
        acc += ch
        setValue?.call(input, acc)
        input.dispatchEvent(new Event('input', { bubbles: true }))
        await sleep(94)
      }
      await sleep(525)
    }

    const runVoice = async (phrase: string, target: string) => {
      setCursorShown(false)
      setCaption({ text: phrase, kind: 'voice' })
      await sleep(1813)
      ;(await waitFor(target)).click()
      await sleep(1313)
      setCaption(null)
      await sleep(875)
    }

    const runStep = async (s: DemoStep) => {
      switch (s.kind) {
        case 'tap':
          if (s.label) setCaption({ text: s.label, kind: 'step' })
          await tap(await waitFor(s.target))
          break
        case 'type':
          if (s.label) setCaption({ text: s.label, kind: 'step' })
          await typeInto(s.target, s.text)
          break
        case 'voice':
          await runVoice(s.phrase, s.target)
          break
        case 'wait':
          if (s.label) setCaption({ text: s.label, kind: 'step' })
          await sleep(s.ms)
          break
      }
    }

    const fade = async (on: boolean) => {
      setCovered(on)
      await sleep(775)
    }

    const loop = async () => {
      let i = 0
      while (!signal.aborted) {
        try {
          const flow = FLOWS[i]
          setCaption(null)
          setCursorShown(false)
          setFlowIdx(i)
          setRunId((n) => n + 1)
          await sleep(100)

          setCaption({ text: flow.title, kind: 'title', sub: flow.subtitle })
          await fade(false)
          await sleep(1625)
          setCaption(null)

          for (const step of flow.steps) await runStep(step)

          setCursorShown(false)
          setCaption(null)
          await sleep(688)
          await fade(true)
          await sleep(438)
        } catch (err) {
          if (err instanceof Cancelled || signal.aborted) return
          // A selector timed out (UI changed?). Recover: cover and move on.
          setCursorShown(false)
          setCaption(null)
          try {
            await fade(true)
          } catch {
            return
          }
          await sleep(300)
        }
        i = (i + 1) % FLOWS.length
      }
    }

    loop().catch(() => {})
    return () => ac.abort()
  }, [reduced])

  return (
    <PhoneFrame width={width}>
      <MobileApp key={runId} initialTab={FLOWS[flowIdx].initialTab} autoplay />

      <div className="demo-layer" ref={layerRef} aria-hidden>
        {!reduced && <div className="demo-blocker" />}

        <div className={`demo-fade${covered ? ' is-on' : ''}`} />

        <FadeCaption caption={caption} />

        <div
          className={`demo-cursor${cursorShown ? ' is-shown' : ''}${pressing ? ' is-press' : ''}`}
          style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
        >
          <span className="demo-ripple" key={rippleKey} />
          <span className="demo-cursor-dot" />
        </div>
      </div>
    </PhoneFrame>
  )
}

/**
 * Caption that cross-fades: any change fades the old text out, swaps, fades the
 * new one in. Voice captions carry an animated sound-wave to read as "spoken".
 */
function FadeCaption({ caption }: { caption: Caption | null }) {
  const [shown, setShown] = useState<Caption | null>(caption)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(false) // fade current out
    const t = window.setTimeout(() => {
      if (caption) {
        setShown(caption)
        requestAnimationFrame(() => setVisible(true)) // then fade next in
      } else {
        setShown(null)
      }
    }, 200)
    return () => window.clearTimeout(t)
  }, [caption])

  if (!shown) return null

  return (
    <div
      className={`demo-caption demo-caption--${shown.kind}${visible ? ' is-visible' : ''}`}
    >
      {shown.kind === 'voice' && (
        <>
          <MicIcon size={18} />
          <span className="demo-soundwave" aria-hidden>
            <i /><i /><i /><i /><i />
          </span>
        </>
      )}
      {shown.kind === 'title' ? (
        <>
          <span className="demo-caption-title">{shown.text}</span>
          {shown.sub && <span className="demo-caption-sub">{shown.sub}</span>}
        </>
      ) : (
        <span>{shown.text}</span>
      )}
    </div>
  )
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}
