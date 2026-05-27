import type { ReactNode } from 'react'
import './DesktopFrame.css'

/**
 * Resizable desktop ("app window") frame. Same scaling trick as PhoneFrame:
 * the window contents render at a fixed logical resolution and the whole frame
 * is CSS-scaled to the requested visual `width`.
 */
const SCREEN_W = 1200
const SCREEN_H = 760
const CHROME_H = 36 // title bar with traffic-light buttons
const FRAME_W = SCREEN_W
const FRAME_H = SCREEN_H + CHROME_H

export const DESKTOP_SCREEN = { width: SCREEN_W, height: SCREEN_H }
export const DESKTOP_FRAME = { width: FRAME_W, height: FRAME_H }

interface DesktopFrameProps {
  /** Visual width of the whole window in px. Height follows automatically. */
  width?: number
  children: ReactNode
  className?: string
}

export function DesktopFrame({ width = FRAME_W, children, className }: DesktopFrameProps) {
  const scale = width / FRAME_W

  return (
    <div
      className={`desktop-wrap${className ? ` ${className}` : ''}`}
      style={{ width, height: FRAME_H * scale }}
    >
      <div
        className="desktop-frame"
        style={{
          width: FRAME_W,
          height: FRAME_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <div className="desktop-titlebar" style={{ height: CHROME_H }}>
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>
        <div className="desktop-screen no-scrollbar" style={DESKTOP_SCREEN}>
          {children}
        </div>
      </div>
    </div>
  )
}
