import { useState } from 'react'
import { playlists, songsForPlaylist } from '../../data/playlists'
import { songs } from '../../data/songs'
import { Artwork } from '../common/Artwork'
import { formatDuration } from '../../lib/format'
import {
  HomeIcon,
  SearchIcon,
  LibraryIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  PrevIcon,
  NextIcon,
  ShuffleIcon,
  HeartIcon,
} from '../icons'
import './DesktopApp.css'

interface DesktopAppProps {
  /**
   * Optional slot to replace the main panel when the Build Mode desktop
   * experience is built (multi-select + batch submit). Skeleton shows Home.
   */
  children?: React.ReactNode
}

/**
 * Dummy Spotify desktop app — skeleton only.
 * Fixed 1200x760 logical layout; DesktopFrame handles visual sizing.
 */
export function DesktopApp({ children }: DesktopAppProps) {
  const [playing, setPlaying] = useState(true)
  const nowPlaying = songs[2]

  return (
    <div className="dapp">
      <div className="dapp-top">
        <Sidebar />
        <main className="dapp-main no-scrollbar">
          {children ?? <HomeView />}
        </main>
      </div>
      <PlayerBar
        playing={playing}
        onToggle={() => setPlaying((p) => !p)}
        title={nowPlaying.title}
        artist={nowPlaying.artist}
        color={nowPlaying.color}
        durationMs={nowPlaying.durationMs}
      />
    </div>
  )
}

function Sidebar() {
  return (
    <aside className="dapp-sidebar">
      <nav className="dapp-nav">
        <a className="dapp-nav-item is-active">
          <HomeIcon size={24} /> Home
        </a>
        <a className="dapp-nav-item">
          <SearchIcon size={24} /> Search
        </a>
      </nav>

      <div className="dapp-library">
        <div className="dapp-library-head">
          <span className="dapp-library-title">
            <LibraryIcon size={22} /> Your Library
          </span>
          <button className="dapp-library-add" aria-label="Create playlist">
            <PlusIcon size={20} />
          </button>
        </div>
        <ul className="dapp-playlists no-scrollbar">
          {playlists.map((p) => (
            <li className="dapp-playlist-row" key={p.id}>
              <Artwork color={p.color} size={44} radius={6} />
              <div className="dapp-playlist-meta">
                <span className="dapp-playlist-name">{p.name}</span>
                <span className="dapp-playlist-sub">
                  Playlist · {p.songIds.length} songs
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

function HomeView() {
  const featured = playlists[0]
  const tracks = songsForPlaylist(featured)

  return (
    <>
      <div className="dapp-topbar">
        <div className="dapp-topbar-pills">
          <button className="dapp-pill is-active">All</button>
          <button className="dapp-pill">Music</button>
          <button className="dapp-pill">Podcasts</button>
        </div>
        <div className="dapp-avatar" />
      </div>

      <section className="dapp-section">
        <h2 className="dapp-section-title">Made for you</h2>
        <div className="dapp-cardgrid">
          {playlists.map((p) => (
            <div className="dapp-card" key={p.id}>
              <Artwork color={p.color} size={150} radius={8} className="dapp-card-art" />
              <span className="dapp-card-title">{p.name}</span>
              <span className="dapp-card-desc">{p.description}</span>
              <button className="dapp-card-play" aria-label={`Play ${p.name}`}>
                <PlayIcon size={20} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="dapp-section">
        <h2 className="dapp-section-title">{featured.name}</h2>
        <table className="dapp-tracktable">
          <thead>
            <tr>
              <th className="dapp-col-num">#</th>
              <th>Title</th>
              <th>Album</th>
              <th className="dapp-col-dur">Time</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((s, i) => (
              <tr className="dapp-track" key={s.id}>
                <td className="dapp-col-num">{i + 1}</td>
                <td>
                  <div className="dapp-track-title">
                    <Artwork color={s.color} size={40} radius={4} />
                    <div className="dapp-track-meta">
                      <span className="dapp-track-name">{s.title}</span>
                      <span className="dapp-track-artist">{s.artist}</span>
                    </div>
                  </div>
                </td>
                <td className="dapp-track-album">{s.album}</td>
                <td className="dapp-col-dur">{formatDuration(s.durationMs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  )
}

function PlayerBar({
  playing,
  onToggle,
  title,
  artist,
  color,
  durationMs,
}: {
  playing: boolean
  onToggle: () => void
  title: string
  artist: string
  color: string
  durationMs: number
}) {
  return (
    <footer className="dapp-player">
      <div className="dapp-player-left">
        <Artwork color={color} size={52} radius={6} />
        <div className="dapp-player-meta">
          <span className="dapp-player-title">{title}</span>
          <span className="dapp-player-artist">{artist}</span>
        </div>
        <button className="dapp-player-like" aria-label="Save to Liked Songs">
          <HeartIcon size={18} />
        </button>
      </div>

      <div className="dapp-player-center">
        <div className="dapp-player-controls">
          <button aria-label="Shuffle"><ShuffleIcon size={18} /></button>
          <button aria-label="Previous"><PrevIcon size={20} /></button>
          <button className="dapp-player-play" onClick={onToggle} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          </button>
          <button aria-label="Next"><NextIcon size={20} /></button>
        </div>
        <div className="dapp-player-scrubber">
          <span>1:12</span>
          <div className="dapp-progress">
            <div className="dapp-progress-fill" style={{ width: '32%' }} />
          </div>
          <span>{formatDuration(durationMs)}</span>
        </div>
      </div>

      <div className="dapp-player-right" />
    </footer>
  )
}
