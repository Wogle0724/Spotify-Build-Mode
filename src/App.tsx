import { useState } from 'react'
import { useIsDesktop } from './lib/useMediaQuery'
import { PhoneFrame } from './components/devices/PhoneFrame'
import { DesktopFrame } from './components/devices/DesktopFrame'
import { MobileApp } from './components/spotify-app/MobileApp'
import { DesktopApp } from './components/spotify-app/DesktopApp'
import { DemoOverlay, type Platform } from './components/DemoOverlay'
import { SpotifyLogo } from './components/icons'
import './App.css'

export default function App() {
  const isDesktop = useIsDesktop()
  const [demo, setDemo] = useState<Platform | null>(null)

  return (
    <div className="page">
      <SiteHeader />

      <main>
        <Hero />

        <section className="showcase" id="demo">
          {isDesktop ? (
            <div className="showcase-grid">
              <DemoColumn
                kind="mobile"
                caption="On mobile — one tap to add"
                blurb="Find a song, tap once, it's in the playlist. Or just say it out loud."
                onTry={() => setDemo('mobile')}
              >
                <PhoneFrame width={260}>
                  <MobileApp initialTab="library" />
                </PhoneFrame>
              </DemoColumn>

              <DemoColumn
                kind="desktop"
                caption="On desktop — select, then submit"
                blurb="Cherry-pick songs across the catalog, then add them all in one click."
                onTry={() => setDemo('desktop')}
              >
                <DesktopFrame width={620}>
                  <DesktopApp />
                </DesktopFrame>
              </DemoColumn>
            </div>
          ) : (
            <div className="showcase-mobile">
              <PhoneFrame width={300}>
                <MobileApp initialTab="library" />
              </PhoneFrame>
              <button className="cta-primary" onClick={() => setDemo('mobile')}>
                Try it yourself
              </button>
              <p className="showcase-hint">
                Tap to open the interactive Build Mode demo.
              </p>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />

      {demo && <DemoOverlay platform={demo} onClose={() => setDemo(null)} />}
    </div>
  )
}

function SiteHeader() {
  return (
    <header className="site-header">
      <div className="brand">
        <SpotifyLogo size={28} />
        <span className="brand-name">Build Mode</span>
        <span className="brand-tag">Product concept</span>
      </div>
      <a className="header-link" href="#demo">
        See the demo
      </a>
    </header>
  )
}

function Hero() {
  return (
    <section className="hero">
      <span className="hero-eyebrow">A Spotify feature concept</span>
      <h1 className="hero-title">
        Build playlists at the
        <span className="hero-accent"> speed of thought.</span>
      </h1>
      <p className="hero-sub">
        Build Mode makes adding songs effortless — a single tap or your voice on
        mobile, and batch-select-then-submit on desktop. Same idea, tuned to each
        device.
      </p>
    </section>
  )
}

function DemoColumn({
  caption,
  blurb,
  onTry,
  children,
}: {
  kind: Platform
  caption: string
  blurb: string
  onTry: () => void
  children: React.ReactNode
}) {
  return (
    <div className="demo-col">
      <div className="demo-col-stage">{children}</div>
      <h2 className="demo-col-caption">{caption}</h2>
      <p className="demo-col-blurb">{blurb}</p>
      <button className="cta-primary" onClick={onTry}>
        Try it yourself
      </button>
    </div>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>Build Mode — product pitch concept. Not affiliated with Spotify.</span>
    </footer>
  )
}
