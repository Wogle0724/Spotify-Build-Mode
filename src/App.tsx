import { useEffect, useState } from 'react'
import { useIsDesktop } from './lib/useMediaQuery'
import { DemoPhone } from './components/demo-autoplay/DemoPhone'
import { DemoDesktop } from './components/demo-autoplay/DemoDesktop'
import { DemoOverlay, type Platform } from './components/DemoOverlay'
import { SpotifyLogo, LinkedInIcon } from './components/icons'
import './App.css'

export default function App() {
  const isDesktop = useIsDesktop()
  const [demo, setDemo] = useState<Platform | null>(null)

  function openDemo(platform: Platform) {
    window.history.pushState({ demo: platform }, '')
    setDemo(platform)
  }
  function closeDemo() {
    setDemo(null)
  }

  useEffect(() => {
    const onPop = () => setDemo(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Lock body scroll when overlay is open to prevent scrollbar-width layout shift.
  useEffect(() => {
    document.body.style.overflow = demo ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [demo])

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
                onTry={() => openDemo('mobile')}
              >
                <DemoPhone width={260} />
              </DemoColumn>

              <DemoColumn
                kind="desktop"
                caption="On desktop — select, then submit"
                blurb="Cherry-pick songs across the app, then add them all in one click."
                onTry={() => openDemo('desktop')}
              >
                <DemoDesktop width={620} />
              </DemoColumn>
            </div>
          ) : (
            <div className="showcase-mobile">
              <DemoPhone width={300} />
              <button className="cta-primary" onClick={() => openDemo('mobile')}>
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

      {demo && <DemoOverlay platform={demo} onClose={closeDemo} />}
    </div>
  )
}

function SiteHeader() {
  return (
    <header className="site-header">
      <div className="brand">
        <SpotifyLogo size={28} />
        <span className="brand-name">Build Mode</span>
        <span className="brand-tag">Spotify Product concept</span>
      </div>
      <div className="header-actions">
        {/* TODO: replace href with your LinkedIn profile URL */}
        <a
          className="header-link header-link--linkedin"
          href="https://www.linkedin.com/in/wyattogle28"
          target="_blank"
          rel="noopener noreferrer"
        >
          <LinkedInIcon size={16} />
          <span className="header-link-label">LinkedIn</span>
        </a>
        {/* TODO: replace href with your write-up URL (PDF, Notion, etc.) */}
        <a
          className="header-link header-link--writeup"
          href="#writeup-placeholder"
          target="_blank"
          rel="noopener noreferrer"
        >
          Write-up ↗
        </a>
      </div>
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
        Build Mode makes finding and adding songs effortless — a single tap or your voice on
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
