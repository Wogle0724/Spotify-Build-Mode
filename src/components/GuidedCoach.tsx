import { useEffect, useRef, useState } from 'react'
import { FLOWS, type DemoStep } from './demo-autoplay/flows'
import './GuidedCoach.css'

/**
 * Idle coach for the interactive "Try it yourself" demo.
 *
 * When the user stops interacting, it shades the whole phone screen except a
 * spotlight cut-out around the element they should tap next, with a short
 * prompt — walking them through the SAME taps as the first autoplay flow. Each
 * time they hit the highlighted control it advances to the next step. It's a
 * purely visual guide: the layer is pointer-events:none, so every real tap
 * still lands on the app underneath (through the cut-out or anywhere else).
 */

// Logical screen width — matches PhoneFrame's internal resolution.
const SCREEN_W = 390
const SCREEN_H = 844

// How long with no interaction before the coach appears / reappears.
const IDLE_MS = 2600
// Extra breathing room around the highlighted element, in logical px.
const PAD = 6

type CoachStep = { target: string; label: string }
type TapStep = Extract<DemoStep, { kind: 'tap' }>

// Walk the user through the first flow's taps, reusing its targets + labels.
const STEPS: CoachStep[] = FLOWS[0].steps
  .filter((s): s is TapStep => s.kind === 'tap')
  .map((s) => ({ target: s.target, label: s.label ?? 'Tap to continue' }))

type Rect = { x: number; y: number; w: number; h: number }

export function GuidedCoach() {
  const layerRef = useRef<HTMLDivElement>(null)
  const [stepIdx, setStepIdx] = useState(0)
  const [idle, setIdle] = useState(false)
  const [spot, setSpot] = useState<Rect | null>(null)

  const done = stepIdx >= STEPS.length
  const step = done ? null : STEPS[stepIdx]

  // Idle detection + step advancement, scoped to THIS phone screen. The layer
  // is a direct child of .phone-screen, so its parent is the interaction root.
  useEffect(() => {
    const screen = layerRef.current?.parentElement
    if (!screen) return

    let idleTimer = 0
    const arm = () => {
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => setIdle(true), IDLE_MS)
    }
    const onActivity = () => {
      setIdle(false)
      arm()
    }
    const onClickCapture = (e: Event) => {
      onActivity()
      const el = (e.target as HTMLElement)?.closest?.('[data-demo]') as HTMLElement | null
      const key = el?.getAttribute('data-demo')
      // Advance only when they tap the control we're currently pointing at.
      setStepIdx((i) => (i < STEPS.length && key === STEPS[i].target ? i + 1 : i))
    }

    screen.addEventListener('pointerdown', onActivity, true)
    screen.addEventListener('keydown', onActivity, true)
    screen.addEventListener('click', onClickCapture, true)
    arm() // start the first countdown right away

    return () => {
      window.clearTimeout(idleTimer)
      screen.removeEventListener('pointerdown', onActivity, true)
      screen.removeEventListener('keydown', onActivity, true)
      screen.removeEventListener('click', onClickCapture, true)
    }
  }, [])

  // While idle on a step, keep the spotlight pinned to the target element
  // (polling handles the target appearing late, scrolling, and layout shifts).
  useEffect(() => {
    if (!idle || !step) {
      setSpot(null)
      return
    }
    const root = layerRef.current
    const screen = root?.parentElement
    if (!root || !screen) return

    const measure = () => {
      const el = screen.querySelector<HTMLElement>(`[data-demo="${step.target}"]`)
      if (!el) {
        setSpot(null)
        return
      }
      const r = root.getBoundingClientRect()
      const scale = r.width / SCREEN_W // undo the frame's CSS scale
      const b = el.getBoundingClientRect()
      setSpot({
        x: (b.left - r.left) / scale,
        y: (b.top - r.top) / scale,
        w: b.width / scale,
        h: b.height / scale,
      })
    }

    measure()
    const id = window.setInterval(measure, 120)
    return () => window.clearInterval(id)
  }, [idle, step])

  const show = !done && idle && !!spot && !!step

  // Place the prompt below the spotlight, or above it when near the bottom.
  let tipStyle: React.CSSProperties | undefined
  if (spot) {
    const below = spot.y + spot.h + PAD < SCREEN_H * 0.62
    tipStyle = below
      ? { top: spot.y + spot.h + PAD + 14 }
      : { top: Math.max(12, spot.y - PAD - 14 - 66) }
  }

  return (
    <div className="coach-layer" ref={layerRef} aria-hidden>
      {show && spot && step && (
        <>
          <div
            className="coach-spot"
            style={{
              transform: `translate(${spot.x - PAD}px, ${spot.y - PAD}px)`,
              width: spot.w + PAD * 2,
              height: spot.h + PAD * 2,
            }}
          />
          <div className="coach-tip" style={tipStyle}>
            <span className="coach-tip-step">
              Step {stepIdx + 1} of {STEPS.length}
            </span>
            <span className="coach-tip-label">{step.label}</span>
          </div>
        </>
      )}
    </div>
  )
}
