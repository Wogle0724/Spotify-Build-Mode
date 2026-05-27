import type { ReactNode } from 'react'
import './PhoneFrame.css'

/**
 * Resizable phone frame.
 *
 * The screen always renders at a fixed logical resolution (SCREEN_W x SCREEN_H)
 * so the app UI inside never has to be responsive — it's drawn once at "iPhone"
 * dimensions and the whole frame is CSS-scaled to whatever visual `width` the
 * caller asks for. This is what lets the same MobileApp shrink into the landing
 * preview and then grow into the full interactive demo.
 */
const SCREEN_W = 390
const SCREEN_H = 844
const BEZEL = 14
const FRAME_W = SCREEN_W + BEZEL * 2 // 418
const FRAME_H = SCREEN_H + BEZEL * 2 // 872

export const PHONE_SCREEN = { width: SCREEN_W, height: SCREEN_H }
export const PHONE_FRAME = { width: FRAME_W, height: FRAME_H }

interface PhoneFrameProps {
  /** Visual width of the whole frame in px. Height follows automatically. */
  width?: number
  children: ReactNode
  className?: string
}

export function PhoneFrame({ width = FRAME_W, children, className }: PhoneFrameProps) {
  const scale = width / FRAME_W

  return (
    // Wrapper reserves the *scaled* footprint in layout (transforms don't).
    <div
      className={`phone-wrap${className ? ` ${className}` : ''}`}
      style={{ width, height: FRAME_H * scale }}
    >
      <div
        className="phone-frame"
        style={{
          width: FRAME_W,
          height: FRAME_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <div className="phone-screen no-scrollbar" style={PHONE_SCREEN}>
          <div className="phone-notch" />
          {children}
        </div>
      </div>
    </div>
  )
}
