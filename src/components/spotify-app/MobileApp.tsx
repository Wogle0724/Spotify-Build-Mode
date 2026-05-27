import { useState } from 'react'
import { playlists as seedPlaylists, type Playlist } from '../../data/playlists'
import { songs, songById, type Song } from '../../data/songs'
import { formatDuration } from '../../lib/format'
import { Artwork } from '../common/Artwork'
import {
  HomeIcon,
  SearchIcon,
  LibraryIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  MoreIcon,
  BackIcon,
  PlaylistIcon,
  ShuffleIcon,
  DownloadIcon,
  ShareIcon,
  UsersIcon,
  SparkleIcon,
} from '../icons'
import { BuildMode } from './build-mode/BuildMode'
import './MobileApp.css'

type Tab = 'home' | 'search' | 'library'

const NEW_PLAYLIST_COLORS = [
  'var(--c-purple)', 'var(--c-sky)', 'var(--c-teal)', 'var(--c-pink)',
  'var(--c-orange)', 'var(--c-indigo)', 'var(--c-lime)', 'var(--c-magenta)',
]

interface MobileAppProps {
  /** Which bottom-nav tab to open on first render. */
  initialTab?: Tab
}

/**
 * Dummy Spotify mobile app, now hosting the Build Mode feature.
 *
 * This component owns the *mutable* library state (playlists + liked songs) so
 * that songs added in Build Mode actually persist and show up in the library —
 * making the demo feel real. Build Mode renders as a full-screen layer over the
 * app via the `build` session state.
 */
export function MobileApp({ initialTab = 'home' }: MobileAppProps) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [openPlaylistId, setOpenPlaylistId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [namePrompt, setNamePrompt] = useState(false)
  const [menuPlaylistId, setMenuPlaylistId] = useState<string | null>(null)
  const [playing, setPlaying] = useState(true)

  const [pls, setPls] = useState<Playlist[]>(() =>
    seedPlaylists.map((p) => ({ ...p, songIds: [...p.songIds] })),
  )
  const [liked, setLiked] = useState<string[]>([])
  const [build, setBuild] = useState<{ targetId: string; isNew: boolean } | null>(null)

  const nowPlaying = songs[0]

  /* ---- library mutations (single source of truth) ---- */
  function createPlaylist(name: string): string {
    const id = `p-${Date.now()}`
    const color = NEW_PLAYLIST_COLORS[Math.floor(Math.random() * NEW_PLAYLIST_COLORS.length)]
    setPls((prev) => [
      { id, name, description: 'Built with Build Mode', color, songIds: [] },
      ...prev,
    ])
    return id
  }
  function toggleSongInPlaylist(songId: string, playlistId: string) {
    setPls((prev) =>
      prev.map((p) =>
        p.id === playlistId
          ? {
              ...p,
              songIds: p.songIds.includes(songId)
                ? p.songIds.filter((x) => x !== songId)
                : [...p.songIds, songId],
            }
          : p,
      ),
    )
  }
  function toggleLiked(songId: string) {
    setLiked((prev) =>
      prev.includes(songId) ? prev.filter((x) => x !== songId) : [...prev, songId],
    )
  }

  /* ---- Build Mode entry / exit ---- */
  function startBuildNew() {
    // Ask for a name first, then create the playlist and enter Build Mode.
    setCreateOpen(false)
    setNamePrompt(true)
  }
  function confirmBuildName(name: string) {
    const id = createPlaylist(name.trim() || 'New Playlist')
    setBuild({ targetId: id, isNew: true })
    setNamePrompt(false)
  }
  function startBuildExisting(playlistId: string) {
    setBuild({ targetId: playlistId, isNew: false })
    setMenuPlaylistId(null)
  }
  function exitBuild() {
    // Clean up an empty auto-created playlist if the user added nothing.
    if (build?.isNew) {
      setPls((prev) => {
        const t = prev.find((p) => p.id === build.targetId)
        return t && t.songIds.length === 0
          ? prev.filter((p) => p.id !== build.targetId)
          : prev
      })
    }
    setBuild(null)
  }

  const openPlaylist = pls.find((p) => p.id === openPlaylistId)

  return (
    <div className="mapp">
      <div className="mapp-body no-scrollbar">
        {openPlaylist ? (
          <PlaylistDetail
            playlist={openPlaylist}
            onBack={() => setOpenPlaylistId(null)}
            onMenu={() => setMenuPlaylistId(openPlaylist.id)}
          />
        ) : tab === 'home' ? (
          <HomeView playlists={pls} onOpen={setOpenPlaylistId} />
        ) : tab === 'search' ? (
          <SearchView />
        ) : (
          <LibraryView
            playlists={pls}
            onOpen={setOpenPlaylistId}
            onCreate={() => setCreateOpen(true)}
          />
        )}
      </div>

      {/* Mini player */}
      <div className="mapp-miniplayer">
        <Artwork color={nowPlaying.color} size={40} />
        <div className="mapp-miniplayer-meta">
          <span className="mapp-miniplayer-title">{nowPlaying.title}</span>
          <span className="mapp-miniplayer-artist">{nowPlaying.artist}</span>
        </div>
        <button
          className="mapp-miniplayer-btn"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
        </button>
      </div>

      {/* Bottom nav */}
      <nav className="mapp-nav">
        <NavBtn label="Home" active={tab === 'home' && !openPlaylist} onClick={() => { setTab('home'); setOpenPlaylistId(null) }}>
          <HomeIcon size={24} />
        </NavBtn>
        <NavBtn label="Search" active={tab === 'search' && !openPlaylist} onClick={() => { setTab('search'); setOpenPlaylistId(null) }}>
          <SearchIcon size={24} />
        </NavBtn>
        <NavBtn label="Your Library" active={tab === 'library' && !openPlaylist} onClick={() => { setTab('library'); setOpenPlaylistId(null) }}>
          <LibraryIcon size={24} />
        </NavBtn>
        <NavBtn label="Create" active={createOpen} onClick={() => setCreateOpen(true)}>
          <PlusIcon size={26} />
        </NavBtn>
      </nav>

      {/* ＋ create menu (Build Mode lives here alongside the usual options) */}
      {createOpen && (
        <CreateMenu
          onClose={() => setCreateOpen(false)}
          onBuildMode={startBuildNew}
          onNewPlaylist={() => {
            const id = createPlaylist('My Playlist')
            setCreateOpen(false)
            setTab('library')
            setOpenPlaylistId(id)
          }}
        />
      )}

      {/* Playlist ⋯ menu (Enter Build Mode lives here too) */}
      {menuPlaylistId && (
        <PlaylistMenu
          playlist={pls.find((p) => p.id === menuPlaylistId)!}
          onClose={() => setMenuPlaylistId(null)}
          onBuildMode={() => startBuildExisting(menuPlaylistId)}
        />
      )}

      {/* Name prompt before creating a new Build Mode playlist */}
      {namePrompt && (
        <NamePrompt onCancel={() => setNamePrompt(false)} onConfirm={confirmBuildName} />
      )}

      {/* Build Mode takeover */}
      {build && (
        <BuildMode
          targetPlaylistId={build.targetId}
          playlists={pls}
          likedSongIds={liked}
          onTogglePlaylist={toggleSongInPlaylist}
          onToggleLiked={toggleLiked}
          onExit={exitBuild}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------- home view --- */

function HomeView({
  playlists,
  onOpen,
}: {
  playlists: Playlist[]
  onOpen: (id: string) => void
}) {
  return (
    <>
      <header className="mapp-header">
        <h1 className="mapp-greeting">Good evening</h1>
      </header>
      <div className="mapp-quickgrid">
        {playlists.slice(0, 6).map((p) => (
          <button className="mapp-quickcard" key={p.id} onClick={() => onOpen(p.id)}>
            <Artwork color={p.color} size={48} radius={4} />
            <span>{p.name}</span>
          </button>
        ))}
      </div>
      <Shelf title="Made for you" items={playlists.slice(0, 5)} onOpen={onOpen} />
      <Shelf title="Recently played" items={playlists.slice(1, 6)} onOpen={onOpen} />
    </>
  )
}

function Shelf({
  title,
  items,
  onOpen,
}: {
  title: string
  items: Playlist[]
  onOpen: (id: string) => void
}) {
  return (
    <section className="mapp-shelf">
      <h2 className="mapp-shelf-title">{title}</h2>
      <div className="mapp-shelf-row no-scrollbar">
        {items.map((p) => (
          <button className="mapp-shelf-card" key={p.id} onClick={() => onOpen(p.id)}>
            <Artwork color={p.color} size={130} radius={6} />
            <span className="mapp-shelf-card-title">{p.name}</span>
            <span className="mapp-shelf-card-desc">{p.description}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

/* ---------------------------------------------------------- library view --- */

function LibraryView({
  playlists,
  onOpen,
  onCreate,
}: {
  playlists: Playlist[]
  onOpen: (id: string) => void
  onCreate: () => void
}) {
  return (
    <>
      <header className="mapp-libhead">
        <h1 className="mapp-libhead-title">
          <span className="mapp-avatar-sm" /> Your Library
        </h1>
        <div className="mapp-libhead-actions">
          <button aria-label="Search library"><SearchIcon size={22} /></button>
          <button aria-label="Create" onClick={onCreate}><PlusIcon size={26} /></button>
        </div>
      </header>

      <div className="mapp-filterpills no-scrollbar">
        <span className="mapp-pill is-active">Playlists</span>
        <span className="mapp-pill">Artists</span>
        <span className="mapp-pill">Albums</span>
      </div>

      <ul className="mapp-liblist">
        {playlists.map((p) => (
          <li key={p.id}>
            <button className="mapp-librow" onClick={() => onOpen(p.id)}>
              <Artwork color={p.color} size={56} radius={6} />
              <div className="mapp-librow-meta">
                <span className="mapp-librow-name">{p.name}</span>
                <span className="mapp-librow-sub">Playlist · {p.songIds.length} songs</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

/* --------------------------------------------------------- playlist view --- */

function PlaylistDetail({
  playlist,
  onBack,
  onMenu,
}: {
  playlist: Playlist
  onBack: () => void
  onMenu: () => void
}) {
  const tracks = playlist.songIds.map(songById).filter((s): s is Song => Boolean(s))
  const totalMs = tracks.reduce((sum, s) => sum + s.durationMs, 0)

  return (
    <>
      {/* Color-bleed hero: just the back button + centered cover. */}
      <div
        className="mapp-pl-hero"
        style={{ background: `linear-gradient(180deg, ${playlist.color} -30%, transparent 92%)` }}
      >
        <div className="mapp-pl-topbar">
          <button onClick={onBack} aria-label="Back"><BackIcon size={24} /></button>
        </div>
        <Artwork color={playlist.color} size={170} radius={6} className="mapp-pl-cover" />
      </div>

      {/* Left-aligned details: name, owner, stats, then the action row. */}
      <div className="mapp-pl-info">
        <h1 className="mapp-pl-name">{playlist.name}</h1>
        {playlist.description && <p className="mapp-pl-desc">{playlist.description}</p>}

        <div className="mapp-pl-owner">
          <span className="mapp-pl-owner-avatar" />
          <span className="mapp-pl-owner-name">You</span>
        </div>

        <p className="mapp-pl-stats">
          {playlist.songIds.length} {playlist.songIds.length === 1 ? 'song' : 'songs'}
          {totalMs > 0 && <> · {formatTotalDuration(totalMs)}</>}
        </p>

        <div className="mapp-pl-actionrow">
          <div className="mapp-pl-actions-left">
            <button aria-label="Download"><DownloadIcon size={24} /></button>
            <button aria-label="Share"><ShareIcon size={22} /></button>
            <button aria-label="More options" onClick={onMenu}><MoreIcon size={24} /></button>
          </div>
          <div className="mapp-pl-actions-right">
            <button className="mapp-pl-shuffle" aria-label="Shuffle"><ShuffleIcon size={24} /></button>
            <button className="mapp-pl-play" aria-label="Play"><PlayIcon size={26} /></button>
          </div>
        </div>
      </div>

      <ul className="mapp-pl-tracks">
        {tracks.length === 0 && (
          <li className="mapp-pl-empty">No songs yet — open ⋯ and Enter Build Mode to fill it fast.</li>
        )}
        {tracks.map((s) => (
          <li className="mapp-pl-track" key={s.id}>
            <Artwork color={s.color} size={44} radius={4} />
            <div className="mapp-pl-track-meta">
              <span className="mapp-pl-track-title">{s.title}</span>
              <span className="mapp-pl-track-artist">
                {s.explicit && <span className="mapp-explicit">E</span>}
                {s.artist}
              </span>
            </div>
            <span className="mapp-pl-track-dur">{formatDuration(s.durationMs)}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

/** Total playlist length, e.g. "1 hr 23 min" or "42 min". */
function formatTotalDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000)
  const hours = Math.floor(totalMin / 60)
  const minutes = totalMin % 60
  return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`
}

/* ----------------------------------------------------------- search view --- */

function SearchView() {
  return (
    <>
      <header className="mapp-header">
        <h1 className="mapp-greeting">Search</h1>
      </header>
      <div className="mapp-searchbar">
        <SearchIcon size={20} />
        <span>What do you want to listen to?</span>
      </div>
      <p className="mapp-search-hint">Browse all — coming soon in this mock.</p>
    </>
  )
}

/* ------------------------------------------------------------- ＋ menus ---- */

function CreateMenu({
  onClose,
  onBuildMode,
  onNewPlaylist,
}: {
  onClose: () => void
  onBuildMode: () => void
  onNewPlaylist: () => void
}) {
  // The non-Build-Mode rows mirror Spotify's real mobile Create menu
  // (Playlist, Collaborative playlist, Blend, Jam, AI playlist). Build Mode is
  // our proposed addition, shown first and highlighted.
  return (
    <Sheet onClose={onClose} title="Create">
      <SheetRow
        highlight
        badge="New"
        icon={<PlusIcon size={22} />}
        title="Build Mode"
        sub="Rapidly add songs by tap or voice"
        onClick={onBuildMode}
      />
      <SheetRow
        icon={<PlaylistIcon size={22} />}
        title="Playlist"
        sub="Build a playlist with songs or episodes"
        onClick={onNewPlaylist}
      />
      <SheetRow
        icon={<UsersIcon size={22} />}
        title="Collaborative playlist"
        sub="Make a playlist with friends"
        disabled
      />
      <SheetRow
        icon={<UsersIcon size={22} />}
        title="Blend"
        sub="Combine tastes in a shared playlist"
        disabled
      />
      <SheetRow
        icon={<UsersIcon size={22} />}
        title="Jam"
        sub="Premium · Listen together in real time"
        disabled
      />
      <SheetRow
        icon={<SparkleIcon size={22} />}
        title="AI playlist"
        sub="Premium · Turn a prompt into a playlist"
        disabled
      />
    </Sheet>
  )
}

function PlaylistMenu({
  playlist,
  onClose,
  onBuildMode,
}: {
  playlist: Playlist
  onClose: () => void
  onBuildMode: () => void
}) {
  return (
    <Sheet
      onClose={onClose}
      header={
        <div className="mapp-sheet-plhead">
          <Artwork color={playlist.color} size={44} radius={4} />
          <div>
            <div className="mapp-sheet-plname">{playlist.name}</div>
            <div className="mapp-sheet-plsub">Playlist · {playlist.songIds.length} songs</div>
          </div>
        </div>
      }
    >
      <SheetRow
        highlight
        icon={<PlusIcon size={22} />}
        title="Enter Build Mode"
        sub="Add songs fast — tap or voice"
        onClick={onBuildMode}
      />
      <SheetRow icon={<PlusIcon size={22} />} title="Add to this playlist" disabled />
      <SheetRow icon={<PlaylistIcon size={22} />} title="Edit playlist" disabled />
      <SheetRow icon={<PlaylistIcon size={22} />} title="Download" disabled />
      <SheetRow icon={<PlaylistIcon size={22} />} title="Share" disabled />
    </Sheet>
  )
}

/* ------------------------------------------------------- name prompt --- */

function NamePrompt({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: (name: string) => void
}) {
  const [name, setName] = useState('')
  return (
    <div className="mapp-sheet-scrim" onClick={onCancel}>
      <div className="mapp-nameprompt" onClick={(e) => e.stopPropagation()}>
        <div className="mapp-sheet-grip" />
        <h3 className="mapp-nameprompt-title">Name your playlist</h3>
        <p className="mapp-nameprompt-sub">Build Mode will add the songs you pick here.</p>
        <input
          className="mapp-nameprompt-input"
          autoFocus
          placeholder="My Playlist"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onConfirm(name)}
        />
        <div className="mapp-nameprompt-actions">
          <button className="mapp-nameprompt-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="mapp-nameprompt-create" onClick={() => onConfirm(name)}>
            Start building
          </button>
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------- primitives --- */

function Sheet({
  onClose,
  title,
  header,
  children,
}: {
  onClose: () => void
  title?: string
  header?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mapp-sheet-scrim" onClick={onClose}>
      <div className="mapp-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mapp-sheet-grip" />
        {header}
        {title && <h3 className="mapp-sheet-title">{title}</h3>}
        <div className="mapp-sheet-rows">{children}</div>
      </div>
    </div>
  )
}

function SheetRow({
  icon,
  title,
  sub,
  badge,
  highlight,
  disabled,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  sub?: string
  badge?: string
  highlight?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      className={`mapp-sheet-row${highlight ? ' is-highlight' : ''}${disabled ? ' is-disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <span className={`mapp-sheet-row-icon${highlight ? ' is-highlight' : ''}`}>{icon}</span>
      <span className="mapp-sheet-row-text">
        <span className="mapp-sheet-row-title">
          {title}
          {badge && <span className="mapp-sheet-row-badge">{badge}</span>}
        </span>
        {sub && <span className="mapp-sheet-row-sub">{sub}</span>}
      </span>
    </button>
  )
}

function NavBtn({
  children,
  label,
  active,
  onClick,
}: {
  children: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button className={`mapp-navbtn${active ? ' is-active' : ''}`} onClick={onClick}>
      {children}
      <span>{label}</span>
    </button>
  )
}
