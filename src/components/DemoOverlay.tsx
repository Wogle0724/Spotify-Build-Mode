import { useEffect, useState } from 'react'
import { PhoneFrame, PHONE_FRAME } from './devices/PhoneFrame'
import { DesktopFrame, DESKTOP_FRAME } from './devices/DesktopFrame'
import { MobileApp } from './spotify-app/MobileApp'
import { DesktopApp } from './spotify-app/DesktopApp'
import './DemoOverlay.css'

export type Platform = 'mobile' | 'desktop'

interface DemoOverlayProps {
  platform: Platform
  onClose: () => void
}

/**
 * Fullscreen interactive demo. Renders the chosen dummy app at the largest size
 * that fits the viewport, reusing the SAME app + frame components as the
 * landing-page previews. This is where the Build Mode feature flow will live.
 */
export function DemoOverlay({ platform, onClose }: DemoOverlayProps) {
  const width = useFittedWidth(platform)

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="demo-overlay" role="dialog" aria-modal="true">
      <div className="demo-overlay-bar">
        <button className="demo-back" onClick={onClose}>
          ← Back
        </button>
        <span className="demo-overlay-title">
          Build Mode · {platform === 'mobile' ? 'Mobile' : 'Desktop'} demo
        </span>
        <span className="demo-overlay-note">
          {platform === 'mobile'
            ? 'Live · tap ＋ or a playlist’s ⋯ to enter Build Mode'
            : 'Desktop flow coming next'}
        </span>
      </div>

      <div className="demo-overlay-stage">
        {platform === 'mobile' ? (
          <PhoneFrame width={width}>
            <MobileApp initialTab="library" />
          </PhoneFrame>
        ) : (
          <DesktopFrame width={width}>
            <DesktopApp />
          </DesktopFrame>
        )}
      </div>
    </div>
  )
}

/** Largest frame width that fits the current viewport, with sane caps. */
function useFittedWidth(platform: Platform): number {
  const compute = () => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (platform === 'mobile') {
      const aspect = PHONE_FRAME.height / PHONE_FRAME.width
      const maxByH = (vh - 140) / aspect
      return Math.min(PHONE_FRAME.width, maxByH, vw - 32)
    }
    const aspect = DESKTOP_FRAME.height / DESKTOP_FRAME.width
    const maxByH = (vh - 140) / aspect
    return Math.min(DESKTOP_FRAME.width, maxByH, vw - 48)
  }

  const [width, setWidth] = useState(compute)
  useEffect(() => {
    const onResize = () => setWidth(compute())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform])

  return width
}
