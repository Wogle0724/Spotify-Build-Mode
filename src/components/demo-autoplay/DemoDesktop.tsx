import { useEffect, useRef, useState } from 'react'
import { DesktopFrame } from '../devices/DesktopFrame'
import { DesktopApp } from '../spotify-app/DesktopApp'
import { DESKTOP_FLOWS, type DesktopDemoStep } from './desktopFlows'
import './DemoDesktop.css'

/*
 * Auto-playing Build Mode preview for the desktop column.
 *
 * Mirrors DemoPhone but uses an arrow cursor instead of a touch finger, and
 * drives the real DesktopApp through scripted DESKTOP_FLOWS. The app remounts
 * between flows so each starts fresh. Non-interactive: a blocker overlay
 * swallows real clicks; "Try it yourself" is the way in.
 */

const SCREEN_W = 1200
const CURSOR_MOVE_MS = 850

class Cancelled extends Error {}

type Caption = { text: string; kind: 'step' | 'title'; sub?: string }

export function DemoDesktop({ width }: { width: number }) {
  const layerRef = useRef<HTMLDivElement>(null)

  const [flowIdx, setFlowIdx] = useState(0)
  const [runId, setRunId] = useState(0)
  const [cursor, setCursor] = useState({ x: SCREEN_W / 2, y: 300 })
  const [cursorShown, setCursorShown] = useState(false)
  const [clicking, setClicking] = useState(false)
  const [rippleKey, setRippleKey] = useState(0)
  const [caption, setCaption] = useState<Caption | null>(null)
  const [covered, setCovered] = useState(true)

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

    const screen = () => layerRef.current?.parentElement ?? null
    const findEl = (key: string) =>
      screen()?.querySelector<HTMLElement>(`[data-demo="${key}"]`) ?? null

    // Wait for element to exist, be in the visible portion of the screen,
    // AND have a stable (non-animating) position.
    //
    // The Discover pill slides up from behind the player bar over 340 ms.
    // Its DOM node is present throughout, so we need two checks:
    //   1. Center is above the hidden zone (≥ 96% = tucked behind player bar).
    //      Player-bar buttons live at ~94% and pass; hidden pill lives at ~98%
    //      and is rejected.
    //   2. Position is stable — two consecutive readings 60 ms apart agree to
    //      within 0.5 px. This ensures we never glide to a mid-animation rect.
    const waitFor = async (key: string, timeout = 7000): Promise<HTMLElement> => {
      const start = Date.now()
      for (;;) {
        const el = findEl(key)
        if (el) {
          const lr = layerRef.current?.getBoundingClientRect()
          if (lr) {
            const b1 = el.getBoundingClientRect()
            const centerY = b1.top + b1.height / 2
            const hiddenZoneTop = lr.top + lr.height * 0.96
            if (centerY >= lr.top && centerY < hiddenZoneTop) {
              // In the visible zone — confirm position is stable before returning.
              await sleep(60)
              const b2 = el.getBoundingClientRect()
              if (Math.abs(b2.top - b1.top) < 0.5) return el
              // Still animating — fall through to keep polling.
            }
          } else {
            return el
          }
        }
        if (Date.now() - start > timeout) throw new Error(`demo: timed out on "${key}"`)
        await sleep(80)
      }
    }

    // Convert element center → logical screen coordinates (undo frame scale).
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
      await sleep(225)
      setClicking(true)
      setRippleKey((k) => k + 1)
      await sleep(125)
      el.click()
      setClicking(false)
      await sleep(500)
    }

    // Type text into a controlled input, character by character.
    const typeInto = async (key: string, text: string) => {
      const input = (await waitFor(key)) as HTMLInputElement
      await glideTo(input)
      await sleep(200)
      setClicking(true)
      setRippleKey((k) => k + 1)
      await sleep(120)
      setClicking(false)
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
        await sleep(90)
      }
      await sleep(400)
    }

    const runStep = async (s: DesktopDemoStep) => {
      switch (s.kind) {
        case 'tap':
          if (s.label) setCaption({ text: s.label, kind: 'step' })
          await tap(await waitFor(s.target))
          break
        case 'type':
          if (s.label) setCaption({ text: s.label, kind: 'step' })
          await typeInto(s.target, s.text)
          break
        case 'wait':
          if (s.label) setCaption({ text: s.label, kind: 'step' })
          await sleep(s.ms)
          break
      }
    }

    const fade = async (on: boolean) => {
      setCovered(on)
      await sleep(675)
    }

    const loop = async () => {
      let i = 0
      while (!signal.aborted) {
        try {
          const flow = DESKTOP_FLOWS[i]
          setCaption(null)
          setCursorShown(false)
          setFlowIdx(i)
          setRunId((n) => n + 1)
          await sleep(100)

          setCaption({ text: flow.title, kind: 'title', sub: flow.subtitle })
          await fade(false)
          await sleep(1500)
          setCaption(null)

          for (const step of flow.steps) await runStep(step)

          setCursorShown(false)
          setCaption(null)
          await sleep(625)
          await fade(true)
          await sleep(375)
        } catch (err) {
          if (err instanceof Cancelled || signal.aborted) return
          setCursorShown(false)
          setCaption(null)
          try { await fade(true) } catch { return }
          await sleep(300)
        }
        i = (i + 1) % DESKTOP_FLOWS.length
      }
    }

    loop().catch(() => {})
    return () => ac.abort()
  }, [reduced])

  return (
    <DesktopFrame width={width}>
      <DesktopApp key={runId} />

      <div className="ddemo-layer" ref={layerRef} aria-hidden>
        {!reduced && <div className="ddemo-blocker" />}

        <div className={`ddemo-fade${covered ? ' is-on' : ''}`} />

        <FadeCaption caption={caption} />

        <div
          className={`ddemo-cursor${cursorShown ? ' is-shown' : ''}${clicking ? ' is-click' : ''}`}
          style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
        >
          <span className="ddemo-ripple" key={rippleKey} />
          <ArrowCursor />
        </div>
      </div>
    </DesktopFrame>
  )
}

/* Arrow cursor SVG — a pointer/hand rather than the mobile fingertip dot. */
function ArrowCursor() {
  return (
    <svg
      className="ddemo-cursor-arrow"
      width="22"
      height="28"
      viewBox="0 0 22 28"
      fill="none"
    >
      <path
        d="M2 2L2 22L7.5 16.5L11 24L14 22.5L10.5 15H18L2 2Z"
        fill="white"
        stroke="#1a1a1a"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

function FadeCaption({ caption }: { caption: Caption | null }) {
  const [shown, setShown] = useState<Caption | null>(caption)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(false)
    const t = window.setTimeout(() => {
      if (caption) {
        setShown(caption)
        requestAnimationFrame(() => setVisible(true))
      } else {
        setShown(null)
      }
    }, 180)
    return () => window.clearTimeout(t)
  }, [caption])

  if (!shown) return null

  return (
    <div className={`ddemo-caption ddemo-caption--${shown.kind}${visible ? ' is-visible' : ''}`}>
      {shown.kind === 'title' ? (
        <>
          <span className="ddemo-caption-title">{shown.text}</span>
          {shown.sub && <span className="ddemo-caption-sub">{shown.sub}</span>}
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
