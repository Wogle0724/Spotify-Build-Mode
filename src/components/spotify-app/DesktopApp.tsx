import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  playlists as seedPlaylists,
  externalPlaylists,
  searchExternalPlaylists,
  songsForPlaylist,
  type Playlist,
  type ExternalPlaylist,
} from '../../data/playlists'
import { songs, songById, type Song } from '../../data/songs'
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
  CheckIcon,
  CloseIcon,
  BackIcon,
  PlaylistIcon,
  SparkleIcon,
  UsersIcon,
  MoreIcon,
  DownloadIcon,
} from '../icons'
import {
  BrowseCart,
  DesktopBuildModeSelect,
  DesktopDiscoverSidebar,
  DesktopDiscoverWorkspace,
  type CartItem,
  type DesktopBuildKind,
} from './build-mode/DesktopBuildMode'
import './DesktopApp.css'

/* ============================================================================
 * Desktop Spotify mock — now stateful, hosts Build Mode.
 *
 * Mirrors MobileApp's responsibility split:
 *  - owns playlists + liked-songs library state
 *  - hosts a Build Mode session (target playlists + chosen kind)
 *  - swaps the main panel between Home / Search / Playlist detail / Build Mode
 *    workspaces, while keeping the sidebar + player chrome consistent so the
 *    user never loses orientation
 *
 * The `children` slot is preserved for the landing-page demo column, which
 * just shows Home as a static screenshot.
 * ========================================================================= */

type Tab = 'home' | 'search'

const NEW_PLAYLIST_COLORS = [
  'var(--c-purple)', 'var(--c-sky)', 'var(--c-teal)', 'var(--c-pink)',
  'var(--c-orange)', 'var(--c-indigo)', 'var(--c-lime)', 'var(--c-magenta)',
]

interface BuildSession {
  /** Targets the user picked at session start (1+, includes any new). */
  defaultTargetIds: string[]
  /** Subset that we freshly created on entry — used to garbage-collect on exit. */
  newPlaylistIds: string[]
  /** Snapshot of every song that was already in any target at session start.
   *  Lets the right-sidebar compute "added this session" as
   *  (current target songs) − (this set) without needing to read internal
   *  state out of the Discover controller. */
  initialSongIds: string[]
  /** null = mode-select screen; otherwise the picked workspace kind. */
  kind: DesktopBuildKind | null
}

interface DesktopAppProps {
  /** Static demo override for the landing column. */
  children?: React.ReactNode
}

export function DesktopApp({ children }: DesktopAppProps) {
  /* -------------------------------------------- mutable library state ---- */
  const [pls, setPls] = useState<Playlist[]>(() =>
    seedPlaylists.map((p) => ({ ...p, songIds: [...p.songIds] })),
  )
  const [liked, setLiked] = useState<string[]>([])

  /* ----------------------------------------------- navigation state ---- */
  const [tab, setTab] = useState<Tab>('home')
  const [openPlaylistId, setOpenPlaylistId] = useState<string | null>(null)
  const [openExternalId, setOpenExternalId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  /* ---------------------------------------------------- pop-ups ---- */
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [targetPicker, setTargetPicker] = useState<{
    /** Pre-checked targets (e.g. when entered from a specific playlist). */
    initial: string[]
  } | null>(null)

  /* ------------------------------------------------ build session ---- */
  const [build, setBuild] = useState<BuildSession | null>(null)
  /** Cart of selections during a browse-mode batch (cleared on Add/Cancel). */
  const [cart, setCart] = useState<CartItem[]>([])
  /** When true the target picker opens in "edit targets" mode (mid-session). */
  const [editingTargets, setEditingTargets] = useState(false)

  /* ----------------------------------- mock player bar ("Now Playing") - */
  const [playing, setPlaying] = useState(true)
  const [playerSongIndex, setPlayerSongIndex] = useState(2)
  const [elapsed, setElapsed] = useState(0)
  /** When Discover sets this, the bottom player bar shows the candidate song. */
  const [discoverCurrent, setDiscoverCurrent] = useState<Song | null>(null)
  const nowPlaying = discoverCurrent ?? songs[playerSongIndex]

  /** Stable ref to the Discover workspace's skip function (set by onRegisterSkip). */
  const discoverSkipRef = useRef<(() => void) | null>(null)
  const handleRegisterSkip = useCallback((fn: () => void) => {
    discoverSkipRef.current = fn
  }, [])

  useEffect(() => {
    if (!playing || !nowPlaying) return
    const id = window.setInterval(() => {
      setElapsed((e) => {
        if (e + 250 >= nowPlaying.durationMs) {
          // Auto-advance to next song
          setPlayerSongIndex((i) => (i + 1) % songs.length)
          return 0
        }
        return e + 250
      })
    }, 250)
    return () => window.clearInterval(id)
  }, [playing, nowPlaying])

  // Reset elapsed when song changes
  useEffect(() => { setElapsed(0) }, [playerSongIndex, discoverCurrent])

  /* ============================================ library mutations ===== */
  function createPlaylist(name: string): string {
    const id = `p-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
    const color = NEW_PLAYLIST_COLORS[Math.floor(Math.random() * NEW_PLAYLIST_COLORS.length)]
    setPls((prev) => [
      { id, name, description: 'Built with Build Mode', color, songIds: [] },
      ...prev,
    ])
    return id
  }
  function toggleSongInPlaylist(songId: string, playlistId: string, force?: boolean) {
    setPls((prev) =>
      prev.map((p) => {
        if (p.id !== playlistId) return p
        const has = p.songIds.includes(songId)
        const shouldHave = force ?? !has
        if (shouldHave === has) return p
        return {
          ...p,
          songIds: shouldHave ? [...p.songIds, songId] : p.songIds.filter((x) => x !== songId),
        }
      }),
    )
  }
  function toggleLiked(songId: string) {
    setLiked((prev) =>
      prev.includes(songId) ? prev.filter((x) => x !== songId) : [...prev, songId],
    )
  }

  /* ============================================ build mode entry ====== */
  function openTargetPicker(initial: string[] = []) {
    setCreateMenuOpen(false)
    setTargetPicker({ initial })
  }

  /** Confirm the target picker: kick off the Build Mode session. */
  function startBuild(targetIds: string[], newPlaylistName: string | null) {
    let newPlaylistIds: string[] = []
    let finalTargets = [...targetIds]
    if (newPlaylistName !== null) {
      const id = createPlaylist(newPlaylistName.trim() || 'New Playlist')
      newPlaylistIds = [id]
      finalTargets = [id, ...finalTargets]
    }
    // Snapshot every song already in any target so the sidebar's
    // "added this session" tally starts at zero — even when the user picked
    // a populated playlist as a target. A fresh playlist contributes nothing.
    const initialSongIds = Array.from(
      new Set(
        finalTargets.flatMap(
          (id) => pls.find((p) => p.id === id)?.songIds ?? [],
        ),
      ),
    )
    setTargetPicker(null)
    setBuild({
      defaultTargetIds: finalTargets,
      newPlaylistIds,
      initialSongIds,
      kind: null,
    })
    setCart([])
  }

  function exitBuild() {
    if (build) {
      setPls((prev) =>
        prev.filter((p) => {
          if (!build.newPlaylistIds.includes(p.id)) return true
          return p.songIds.length > 0
        }),
      )
    }
    setBuild(null)
    setCart([])
    setEditingTargets(false)
    discoverSkipRef.current = null
  }

  /** Update which playlists songs go into mid-session. */
  function updateTargets(targetIds: string[]) {
    setBuild((b) => b ? { ...b, defaultTargetIds: targetIds } : b)
    setEditingTargets(false)
  }

  /** Remove a song from all session target playlists. */
  function removeFromTargets(songId: string) {
    if (!build) return
    for (const tid of build.defaultTargetIds) {
      toggleSongInPlaylist(songId, tid)
    }
  }

  /* ============================================== build commits ======== */
  function commitBatch(songIds: string[], targetIds: string[]) {
    for (const sid of songIds) {
      for (const tid of targetIds) toggleSongInPlaylist(sid, tid, true)
    }
    setCart([])
  }
  function commitOne(songId: string, targetIds: string[]) {
    for (const tid of targetIds) toggleSongInPlaylist(songId, tid, true)
  }

  /* ============================================ derived view data ===== */
  const openPlaylist = pls.find((p) => p.id === openPlaylistId)
  const openExternal = externalPlaylists.find((p) => p.id === openExternalId)
  const inBuild = build !== null
  const inBrowse = build?.kind === 'browse'
  const inDiscover = build && (build.kind === 'known' || build.kind === 'unknown' || build.kind === 'mix')

  /* ============================================ render =============== */
  const handleNext = useCallback(() => {
    if (discoverSkipRef.current) {
      discoverSkipRef.current()
    } else {
      setPlayerSongIndex((i) => (i + 1) % songs.length)
      setElapsed(0)
    }
  }, [])

  const handlePrev = useCallback(() => {
    setPlayerSongIndex((i) => (i - 1 + songs.length) % songs.length)
    setElapsed(0)
  }, [])

  // Static demo override (used by the landing page column).
  if (children) {
    return (
      <DesktopShell
        playerSong={nowPlaying}
        playing={playing}
        elapsed={elapsed}
        onTogglePlay={() => setPlaying((p) => !p)}
        onPrev={handlePrev}
        onNext={handleNext}
        sidebar={<Sidebar pls={pls} openPlaylistId={openPlaylistId} onOpen={() => {}} onClickHome={() => {}} onClickSearch={() => {}} onOpenCreate={() => {}} build={null} onExitBuild={() => {}} createMenuOpen={false} />}
      >
        {children}
      </DesktopShell>
    )
  }

  return (
    <DesktopShell
      playerSong={nowPlaying}
      playing={playing}
      elapsed={elapsed}
      onTogglePlay={() => setPlaying((p) => !p)}
      onPrev={handlePrev}
      onNext={handleNext}
      sidebar={
        <Sidebar
          pls={pls}
          openPlaylistId={openPlaylistId}
          onOpen={(id) => {
            setOpenPlaylistId(id)
            setOpenExternalId(null)
          }}
          onClickHome={() => {
            setTab('home')
            setOpenPlaylistId(null)
            setOpenExternalId(null)
          }}
          onClickSearch={() => {
            setTab('search')
            setOpenPlaylistId(null)
            setOpenExternalId(null)
          }}
          onOpenCreate={() => setCreateMenuOpen((v) => !v)}
          createMenuOpen={createMenuOpen && !build}
          onCloseCreate={() => setCreateMenuOpen(false)}
          onBuildMode={() => { setCreateMenuOpen(false); openTargetPicker([]) }}
          build={build}
          onExitBuild={exitBuild}
        />
      }
      rightPanel={
        inBrowse ? (
          <BrowseCart
            items={cart}
            defaultTargetIds={build!.defaultTargetIds}
            playlists={pls}
            onRemove={(sid) => setCart((c) => c.filter((it) => it.song.id !== sid))}
            onClear={() => setCart([])}
            onCommit={(targetIds) =>
              commitBatch(cart.map((it) => it.song.id), targetIds)
            }
            onCancel={exitBuild}
          />
        ) : inDiscover ? (
          <DesktopDiscoverSidebar
            session={build!}
            playlists={pls}
            current={discoverCurrent}
            onExit={exitBuild}
            onEditTargets={() => setEditingTargets(true)}
            onRemoveSong={removeFromTargets}
          />
        ) : null
      }
    >
      {/* --- Build Mode panes --- */}
      {build && build.kind === null && (
        <DesktopBuildModeSelect
          session={build}
          playlists={pls}
          onPickMode={(kind) => setBuild((b) => (b ? { ...b, kind } : b))}
          onExit={exitBuild}
        />
      )}
      {inDiscover && (
        <DesktopDiscoverWorkspace
          kind={build!.kind as Exclude<DesktopBuildKind, 'browse'>}
          session={build!}
          playlists={pls}
          onCommitOne={commitOne}
          onCurrentChange={setDiscoverCurrent}
          onRegisterSkip={handleRegisterSkip}
        />
      )}

      {/* --- Normal app surfaces ---
          Shown whenever we're not on the mode-select screen — that means
          outside Build Mode entirely, in browse mode (as the selection
          backdrop), AND in discover mode (so the user can keep navigating
          the catalog while recommendations play in the player bar). */}
      {(!build || inBrowse || inDiscover) && (
        <>
          {openPlaylist ? (
            <PlaylistDetail
              playlist={openPlaylist}
              onBack={() => setOpenPlaylistId(null)}
              build={build}
              cartIds={new Set(cart.map((c) => c.song.id))}
              onAddToCart={(song) =>
                setCart((c) =>
                  c.some((it) => it.song.id === song.id)
                    ? c.filter((it) => it.song.id !== song.id)
                    : [...c, { song, fromPlaylistName: openPlaylist.name }],
                )
              }
              onStartBuildHere={() => openTargetPicker([openPlaylist.id])}
            />
          ) : openExternal ? (
            <ExternalPlaylistDetail
              playlist={openExternal}
              onBack={() => setOpenExternalId(null)}
              build={build}
              cartIds={new Set(cart.map((c) => c.song.id))}
              onAddToCart={(song) =>
                setCart((c) =>
                  c.some((it) => it.song.id === song.id)
                    ? c.filter((it) => it.song.id !== song.id)
                    : [...c, { song, fromPlaylistName: openExternal.name }],
                )
              }
            />
          ) : tab === 'search' ? (
            <SearchView
              query={searchQuery}
              onQuery={setSearchQuery}
              onOpenExternal={(id) => {
                setOpenExternalId(id)
                setOpenPlaylistId(null)
              }}
            />
          ) : (
            <HomeView pls={pls} onOpen={(id) => setOpenPlaylistId(id)} />
          )}

          {build && inBrowse && <BrowseBanner targets={pls.filter((p) => build.defaultTargetIds.includes(p.id))} />}
        </>
      )}

      {/* --- Pop-ups --- */}
      {targetPicker && (
        <TargetPicker
          playlists={pls}
          initialSelected={targetPicker.initial}
          onCancel={() => setTargetPicker(null)}
          onStart={startBuild}
        />
      )}

      {editingTargets && build && (
        <TargetPicker
          playlists={pls}
          initialSelected={build.defaultTargetIds}
          onCancel={() => setEditingTargets(false)}
          onStart={(ids) => updateTargets(ids)}
          editMode
        />
      )}
    </DesktopShell>
  )
}

/* ===================================================================== Shell */

/**
 * The fixed 3-pane chrome: sidebar | main | optional right rail, then the
 * player bar at the bottom. Build Mode hijacks `rightPanel` and the main
 * content, but the shell itself never changes shape so the screen stays calm.
 */
function DesktopShell({
  sidebar,
  rightPanel,
  children,
  playerSong,
  playing,
  elapsed,
  onTogglePlay,
  onPrev,
  onNext,
}: {
  sidebar: React.ReactNode
  rightPanel?: React.ReactNode
  children: React.ReactNode
  playerSong: Song
  playing: boolean
  elapsed: number
  onTogglePlay: () => void
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="dapp">
      <div className="dapp-top">
        {sidebar}
        <main className="dapp-main no-scrollbar">{children}</main>
        {rightPanel}
      </div>
      <PlayerBar
        playing={playing}
        elapsed={elapsed}
        onToggle={onTogglePlay}
        onPrev={onPrev}
        onNext={onNext}
        title={playerSong.title}
        artist={playerSong.artist}
        color={playerSong.color}
        durationMs={playerSong.durationMs}
      />
    </div>
  )
}

/* =================================================================== Sidebar */

function Sidebar({
  pls,
  openPlaylistId,
  onOpen,
  onClickHome,
  onClickSearch,
  onOpenCreate,
  createMenuOpen,
  onCloseCreate,
  onBuildMode,
  build,
  onExitBuild,
}: {
  pls: Playlist[]
  openPlaylistId: string | null
  onOpen: (id: string) => void
  onClickHome: () => void
  onClickSearch: () => void
  onOpenCreate: () => void
  createMenuOpen?: boolean
  onCloseCreate?: () => void
  onBuildMode?: () => void
  build: BuildSession | null
  onExitBuild: () => void
}) {
  return (
    <aside className="dapp-sidebar">
      <nav className="dapp-nav">
        <button className="dapp-nav-item" onClick={onClickHome}>
          <HomeIcon size={24} /> Home
        </button>
        <button className="dapp-nav-item" data-demo="dapp-nav-search" onClick={onClickSearch}>
          <SearchIcon size={24} /> Search
        </button>
      </nav>

      <div className="dapp-library">
        <div className="dapp-library-head">
          <span className="dapp-library-title">
            <LibraryIcon size={22} /> Your Library
          </span>
          <div className="dapp-create-wrap">
            <button className="dapp-library-add" data-demo="dapp-library-add" aria-label="Create" onClick={onOpenCreate}>
              <PlusIcon size={20} />
            </button>
            {createMenuOpen && onCloseCreate && onBuildMode && (
              <CreateMenuDropdown onClose={onCloseCreate} onBuildMode={onBuildMode} />
            )}
          </div>
        </div>
        <ul className="dapp-playlists no-scrollbar">
          {pls.map((p, i) => {
            const isOpen = p.id === openPlaylistId
            const isTarget = build?.defaultTargetIds.includes(p.id)
            return (
              <li
                key={p.id}
                data-demo={i === 0 ? 'dapp-playlist-row' : undefined}
                className={`dapp-playlist-row${isOpen ? ' is-open' : ''}${isTarget ? ' is-target' : ''}`}
                onClick={() => onOpen(p.id)}
              >
                <Artwork color={p.color} size={44} radius={6} />
                <div className="dapp-playlist-meta">
                  <span className="dapp-playlist-name">{p.name}</span>
                  <span className="dapp-playlist-sub">
                    Playlist · {p.songIds.length} songs
                  </span>
                </div>
                {isTarget && <span className="dapp-playlist-targetdot" aria-hidden />}
              </li>
            )
          })}
        </ul>
      </div>

      {build && (
        <button className="dapp-build-exit" onClick={onExitBuild}>
          <CloseIcon size={16} /> Exit Build Mode
        </button>
      )}
    </aside>
  )
}

/* ============================================================ Home / Search */

function HomeView({
  pls,
  onOpen,
}: {
  pls: Playlist[]
  onOpen: (id: string) => void
}) {
  const featured = pls[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

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

      <h2 className="dapp-greeting">{greeting}</h2>

      <div className="dapp-quickgrid">
        {pls.slice(0, 6).map((p) => (
          <button key={p.id} className="dapp-quickcard" onClick={() => onOpen(p.id)}>
            <Artwork color={p.color} size={48} radius={4} className="dapp-quickcard-art" />
            <span className="dapp-quickcard-name">{p.name}</span>
            <span className="dapp-quickcard-play" aria-label={`Play ${p.name}`}>
              <PlayIcon size={18} />
            </span>
          </button>
        ))}
      </div>

      <section className="dapp-section">
        <h2 className="dapp-section-title">Your playlists</h2>
        <div className="dapp-cardgrid">
          {pls.map((p) => (
            <button className="dapp-card" key={p.id} onClick={() => onOpen(p.id)}>
              <Artwork color={p.color} size={150} radius={8} className="dapp-card-art" />
              <span className="dapp-card-title">{p.name}</span>
              <span className="dapp-card-desc">{p.description}</span>
              <span className="dapp-card-play" aria-label={`Play ${p.name}`}>
                <PlayIcon size={20} />
              </span>
            </button>
          ))}
        </div>
      </section>

      {featured && (
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
              {songsForPlaylist(featured).map((s, i) => (
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
      )}
    </>
  )
}

function SearchView({
  query,
  onQuery,
  onOpenExternal,
}: {
  query: string
  onQuery: (q: string) => void
  onOpenExternal: (id: string) => void
}) {
  const results = useMemo(
    () => (query.trim() ? searchExternalPlaylists(query) : externalPlaylists),
    [query],
  )
  return (
    <>
      <div className="dapp-topbar dapp-topbar--search">
        <div className="dapp-searchbar">
          <SearchIcon size={18} />
          <input
            autoFocus
            data-demo="dapp-search-input"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search for playlists out on Spotify"
          />
        </div>
        <div className="dapp-avatar" />
      </div>

      <section className="dapp-section">
        <h2 className="dapp-section-title">
          {query.trim() ? `Results for "${query.trim()}"` : 'Popular on Spotify'}
        </h2>
        {results.length === 0 ? (
          <p className="dapp-search-empty">
            Nothing matched. Try "2000s" to find <em>All Out 2000s</em>.
          </p>
        ) : (
          <div className="dapp-cardgrid">
            {results.map((p, i) => (
              <button
                className="dapp-card"
                key={p.id}
                data-demo={i === 0 ? 'dapp-search-card' : undefined}
                onClick={() => onOpenExternal(p.id)}
              >
                <Artwork color={p.color} size={150} radius={8} className="dapp-card-art" />
                <span className="dapp-card-title">{p.name}</span>
                <span className="dapp-card-desc">
                  {p.curator} · {p.followers.toLocaleString()} followers
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

/* ========================================================== Playlist detail */

function PlaylistDetail({
  playlist,
  onBack,
  build,
  cartIds,
  onAddToCart,
  onStartBuildHere,
}: {
  playlist: Playlist
  onBack: () => void
  build: BuildSession | null
  cartIds: Set<string>
  onAddToCart: (s: Song) => void
  onStartBuildHere: () => void
}) {
  const tracks = playlist.songIds
    .map(songById)
    .filter((s): s is Song => Boolean(s))
  const inBrowse = build?.kind === 'browse'
  const totalMs = tracks.reduce((sum, s) => sum + s.durationMs, 0)

  return (
    <PlaylistDetailShell
      coverColor={playlist.color}
      name={playlist.name}
      eyebrow="Playlist"
      ownerLabel="You"
      stats={statsLine(playlist.songIds.length, totalMs)}
      onBack={onBack}
      onEnterBuildMode={!build ? onStartBuildHere : undefined}
      hint={inBrowse ? 'In Build Mode — tick songs to add them to your batch.' : null}
    >
      {tracks.length === 0 ? (
        <p className="dapp-pl-empty">
          No songs yet — open the ⋯ menu and choose <strong>Enter Build Mode</strong> to fill it fast.
        </p>
      ) : (
        <SelectableTrackList
          tracks={tracks}
          showCheckboxes={!!inBrowse}
          cartIds={cartIds}
          onToggle={onAddToCart}
        />
      )}
    </PlaylistDetailShell>
  )
}

function ExternalPlaylistDetail({
  playlist,
  onBack,
  build,
  cartIds,
  onAddToCart,
}: {
  playlist: ExternalPlaylist
  onBack: () => void
  build: BuildSession | null
  cartIds: Set<string>
  onAddToCart: (s: Song) => void
}) {
  const tracks = playlist.songIds
    .map(songById)
    .filter((s): s is Song => Boolean(s))
  const inBrowse = build?.kind === 'browse'
  const totalMs = tracks.reduce((sum, s) => sum + s.durationMs, 0)

  return (
    <PlaylistDetailShell
      coverColor={playlist.color}
      name={playlist.name}
      eyebrow="Public Playlist"
      ownerLabel={playlist.curator}
      stats={`${playlist.followers.toLocaleString()} likes · ${statsLine(playlist.songIds.length, totalMs)}`}
      onBack={onBack}
      hint={
        inBrowse
          ? 'Tick songs to drop into your batch — no need to follow this playlist.'
          : null
      }
    >
      <SelectableTrackList
        tracks={tracks}
        showCheckboxes={!!inBrowse}
        cartIds={cartIds}
        onToggle={onAddToCart}
      />
    </PlaylistDetailShell>
  )
}

/** "9 songs, 49 min 4 sec" — matches Spotify's stats line. */
function statsLine(count: number, totalMs: number): string {
  const base = `${count} ${count === 1 ? 'song' : 'songs'}`
  if (totalMs === 0) return base
  const totalSec = Math.round(totalMs / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const dur = h > 0 ? `${h} hr ${m} min` : `${m} min ${s} sec`
  return `${base}, ${dur}`
}

/**
 * Spotify-faithful playlist detail shell.
 *
 * Layout matches the real desktop client:
 *  - tinted hero with cover on the left + (eyebrow, name, owner-line)
 *  - toolbar of [▶ play (big green)] [shuffle] [＋/✓] [↓] [⋯] · spacer · sort/view
 *  - the track table renders below in the page background
 *
 * Build Mode lives inside the ⋯ menu (mirrors mobile's "Enter Build Mode" entry
 * in the playlist sheet). When provided, `onEnterBuildMode` puts a highlighted
 * row at the top of the popover; the rest of the items are conventional
 * Spotify actions, disabled in this mock.
 */
function PlaylistDetailShell({
  coverColor,
  name,
  eyebrow,
  ownerLabel,
  stats,
  onBack,
  onEnterBuildMode,
  hint,
  children,
}: {
  coverColor: string
  name: string
  eyebrow: string
  ownerLabel: string
  stats: string
  onBack: () => void
  onEnterBuildMode?: () => void
  hint?: string | null
  children: React.ReactNode
}) {
  const [moreOpen, setMoreOpen] = useState(false)
  // Spotify auto-scales the title with character count; this rough tier
  // mirrors that so short names get the giant "Arlo" treatment.
  const nameSize = name.length <= 6 ? 96 : name.length <= 16 ? 72 : name.length <= 28 ? 56 : 44

  return (
    <div className="dapp-pl">
      <div
        className="dapp-pl-hero"
        style={{ background: `linear-gradient(180deg, ${coverColor} 0%, rgba(0,0,0,0.25) 100%)` }}
      >
        <button className="dapp-pl-back" onClick={onBack} aria-label="Back">
          <BackIcon size={18} />
        </button>
        <Artwork color={coverColor} size={192} radius={4} className="dapp-pl-cover" />
        <div className="dapp-pl-headmeta">
          <span className="dapp-pl-eyebrow">{eyebrow}</span>
          <h1 className="dapp-pl-name" style={{ fontSize: nameSize }}>{name}</h1>
          <div className="dapp-pl-ownerline">
            <span className="dapp-pl-ownerav" aria-hidden />
            <span className="dapp-pl-owner">{ownerLabel}</span>
            <span className="dapp-pl-dot">·</span>
            <span className="dapp-pl-stats">{stats}</span>
          </div>
        </div>
      </div>

      <div className="dapp-pl-toolbar">
        <button className="dapp-pl-playbtn" aria-label="Play">
          <PlayIcon size={22} />
        </button>
        <button className="dapp-pl-iconbtn" aria-label="Shuffle" title="Shuffle">
          <ShuffleIcon size={22} />
        </button>
        <button className="dapp-pl-iconbtn" aria-label="Save to Your Library" title="Save">
          <span className="dapp-pl-circle"><PlusIcon size={14} /></span>
        </button>
        <button className="dapp-pl-iconbtn" aria-label="Download" title="Download">
          <DownloadIcon size={22} />
        </button>
        <div className="dapp-pl-morewrap">
          <button
            className="dapp-pl-iconbtn dapp-pl-morebtn"
            data-demo="dapp-more-btn"
            aria-label="More options"
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((v) => !v)}
          >
            <MoreIcon size={22} />
          </button>
          {moreOpen && (
            <PlaylistMorePopover
              onClose={() => setMoreOpen(false)}
              onEnterBuildMode={
                onEnterBuildMode &&
                (() => {
                  setMoreOpen(false)
                  onEnterBuildMode()
                })
              }
            />
          )}
        </div>

        <span className="dapp-pl-spacer" />
        {hint && <span className="dapp-pl-hint">{hint}</span>}
        <button className="dapp-pl-listbtn" aria-label="Change view">
          List
        </button>
      </div>

      {children}
    </div>
  )
}

/**
 * The ⋯ popover from the playlist toolbar. "Enter Build Mode" sits at the top,
 * highlighted, when the parent supplies a handler — mirrors mobile's
 * `PlaylistMenu`. Other rows are conventional Spotify actions, mocked disabled.
 *
 * Rendered as a sibling of the trigger inside the toolbar's `.morewrap`
 * (which is `position: relative`), so the popover anchors directly to the ⋯
 * button. Click-outside is handled via a document listener instead of a
 * full-screen scrim, since the scrim would steal clicks meant for the cart.
 */
function PlaylistMorePopover({
  onClose,
  onEnterBuildMode,
}: {
  onClose: () => void
  onEnterBuildMode?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickAway(e: MouseEvent) {
      if (!ref.current) return
      const target = e.target as Node | null
      if (target && ref.current.contains(target)) return
      // Click on the trigger itself shouldn't immediately re-close: that path
      // goes through the trigger's own onClick toggle, which fires before this
      // listener runs because we attach next tick.
      onClose()
    }
    const id = window.setTimeout(
      () => document.addEventListener('mousedown', handleClickAway),
      0,
    )
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('mousedown', handleClickAway)
    }
  }, [onClose])

  return (
    <div ref={ref} className="dapp-popover dapp-popover--more" role="menu">
      {onEnterBuildMode && (
        <button className="dapp-popover-row is-highlight" data-demo="dapp-enter-buildmode" onClick={onEnterBuildMode}>
          <span className="dapp-popover-icon"><PlusIcon size={18} /></span>
          <span>
            <span className="dapp-popover-row-title">
              Enter Build Mode <span className="dapp-popover-badge">New</span>
            </span>
            <span className="dapp-popover-row-sub">Fill this playlist fast — batch or one-by-one</span>
          </span>
        </button>
      )}
      <button className="dapp-popover-row" disabled>
        <span className="dapp-popover-icon"><PlusIcon size={18} /></span>
        <span><span className="dapp-popover-row-title">Add to other playlist</span></span>
      </button>
      <button className="dapp-popover-row" disabled>
        <span className="dapp-popover-icon"><PlaylistIcon size={18} /></span>
        <span><span className="dapp-popover-row-title">Add to queue</span></span>
      </button>
      <button className="dapp-popover-row" disabled>
        <span className="dapp-popover-icon"><PlaylistIcon size={18} /></span>
        <span><span className="dapp-popover-row-title">Edit details</span></span>
      </button>
      <button className="dapp-popover-row" disabled>
        <span className="dapp-popover-icon"><DownloadIcon size={18} /></span>
        <span><span className="dapp-popover-row-title">Download</span></span>
      </button>
      <button className="dapp-popover-row" disabled>
        <span className="dapp-popover-icon"><UsersIcon size={18} /></span>
        <span><span className="dapp-popover-row-title">Share</span></span>
      </button>
    </div>
  )
}

/**
 * Track list used by both library and external playlists. When `showCheckboxes`
 * is on (browse-mode build session), the row becomes a clickable selector.
 */
function SelectableTrackList({
  tracks,
  showCheckboxes,
  cartIds,
  onToggle,
}: {
  tracks: Song[]
  showCheckboxes: boolean
  cartIds: Set<string>
  onToggle: (s: Song) => void
}) {
  return (
    <table className={`dapp-tracktable${showCheckboxes ? ' dapp-tracktable--select' : ''}`}>
      <thead>
        <tr>
          <th className="dapp-col-num">{showCheckboxes ? '' : '#'}</th>
          <th>Title</th>
          <th>Album</th>
          <th className="dapp-col-dur">Time</th>
        </tr>
      </thead>
      <tbody>
        {tracks.map((s, i) => {
          const checked = cartIds.has(s.id)
          const demoKeys = ['dapp-track-row', 'dapp-track-row-2', 'dapp-track-row-3']
          return (
            <tr
              key={s.id}
              data-demo={showCheckboxes && i < 3 ? demoKeys[i] : undefined}
              className={`dapp-track${showCheckboxes ? ' is-selectable' : ''}${checked ? ' is-checked' : ''}`}
              onClick={showCheckboxes ? () => onToggle(s) : undefined}
            >
              <td className="dapp-col-num">
                {showCheckboxes ? (
                  <span className={`dapp-check${checked ? ' is-checked' : ''}`} aria-hidden>
                    {checked && <CheckIcon size={14} />}
                  </span>
                ) : (
                  i + 1
                )}
              </td>
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
          )
        })}
      </tbody>
    </table>
  )
}

/** A sticky banner shown over the browse workspace so the user always sees
 *  which playlist(s) their batch is heading into. */
function BrowseBanner({ targets }: { targets: Playlist[] }) {
  if (targets.length === 0) return null
  const label =
    targets.length === 1
      ? targets[0].name
      : `${targets[0].name} + ${targets.length - 1} more`
  return (
    <div className="dapp-buildbanner" role="status">
      <span className="dapp-buildbanner-dot" />
      Building <strong>{label}</strong> — tick songs to add them to your batch.
    </div>
  )
}

/* ============================================================== + Create menu */

function CreateMenuDropdown({
  onClose,
  onBuildMode,
}: {
  onClose: () => void
  onBuildMode: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickAway(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    const id = window.setTimeout(
      () => document.addEventListener('mousedown', handleClickAway), 0
    )
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('mousedown', handleClickAway)
    }
  }, [onClose])

  return (
    <div ref={ref} className="dapp-popover dapp-popover--create" role="menu">
        <button className="dapp-popover-row is-highlight" data-demo="dapp-create-buildmode" onClick={onBuildMode}>
          <span className="dapp-popover-icon"><PlusIcon size={18} /></span>
          <span>
            <span className="dapp-popover-row-title">
              Build Mode <span className="dapp-popover-badge">New</span>
            </span>
            <span className="dapp-popover-row-sub">Cherry-pick songs across playlists</span>
          </span>
        </button>
        <button className="dapp-popover-row" disabled>
          <span className="dapp-popover-icon"><PlaylistIcon size={18} /></span>
          <span>
            <span className="dapp-popover-row-title">New playlist</span>
            <span className="dapp-popover-row-sub">Start with an empty playlist</span>
          </span>
        </button>
        <button className="dapp-popover-row" disabled>
          <span className="dapp-popover-icon"><UsersIcon size={18} /></span>
          <span>
            <span className="dapp-popover-row-title">Blend</span>
            <span className="dapp-popover-row-sub">Combine tastes in a shared playlist</span>
          </span>
        </button>
        <button className="dapp-popover-row" disabled>
          <span className="dapp-popover-icon"><SparkleIcon size={18} /></span>
          <span>
            <span className="dapp-popover-row-title">AI playlist</span>
            <span className="dapp-popover-row-sub">Premium · Turn a prompt into a playlist</span>
          </span>
        </button>
      </div>
  )
}

/* =========================================================== Target picker */

function TargetPicker({
  playlists,
  initialSelected,
  onCancel,
  onStart,
  editMode = false,
}: {
  playlists: Playlist[]
  initialSelected: string[]
  onCancel: () => void
  onStart: (existingIds: string[], newPlaylistName: string | null) => void
  editMode?: boolean
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSelected))
  const [createNew, setCreateNew] = useState(false)
  const [newName, setNewName] = useState('')

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const totalTargets = selected.size + (createNew ? 1 : 0)
  const canStart = totalTargets > 0

  return (
    <div className="dapp-modal-scrim" onClick={onCancel}>
      <div className="dapp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dapp-modal-head">
          <div>
            <h2>{editMode ? 'Edit playlists' : 'Build Mode'}</h2>
            <p className="dapp-modal-sub">
              {editMode
                ? 'Change which playlists you\'re adding songs to.'
                : 'Which playlist(s) are you filling? Pick one or pile songs into many at once.'}
            </p>
          </div>
          <button className="dapp-modal-close" onClick={onCancel} aria-label="Close">
            <CloseIcon size={18} />
          </button>
        </div>

        <ul className="dapp-target-list no-scrollbar">
          {!editMode && (
            <li>
              <button
                className={`dapp-target-row${createNew ? ' is-on' : ''}`}
                onClick={() => setCreateNew((v) => !v)}
              >
                <span className="dapp-target-newbadge"><PlusIcon size={18} /></span>
                <span className="dapp-target-name">Create a new playlist</span>
                <span className="dapp-target-toggle" aria-hidden>
                  {createNew ? <CheckIcon size={16} /> : <PlusIcon size={16} />}
                </span>
              </button>
              {createNew && (
                <input
                  className="dapp-target-newinput"
                  autoFocus
                  value={newName}
                  maxLength={40}
                  placeholder="Playlist name"
                  onChange={(e) => setNewName(e.target.value)}
                />
              )}
            </li>
          )}
          {playlists.map((p, i) => {
            const on = selected.has(p.id)
            return (
              <li key={p.id}>
                <button
                  className={`dapp-target-row${on ? ' is-on' : ''}`}
                  data-demo={i === 0 ? 'dapp-target-row' : undefined}
                  onClick={() => toggle(p.id)}
                >
                  <Artwork color={p.color} size={36} radius={4} />
                  <span className="dapp-target-name">
                    {p.name}
                    <span className="dapp-target-meta">Playlist · {p.songIds.length} songs</span>
                  </span>
                  <span className="dapp-target-toggle" aria-hidden>
                    {on ? <CheckIcon size={16} /> : <PlusIcon size={16} />}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <footer className="dapp-modal-foot">
          <span className="dapp-modal-targetcount">
            {totalTargets === 0
              ? 'Pick at least one playlist'
              : totalTargets === 1
                ? '1 playlist selected'
                : `${totalTargets} playlists selected`}
          </span>
          <div className="dapp-modal-actions">
            <button className="dbm-btn-ghost" onClick={onCancel}>
              Cancel
            </button>
            <button
              className="dbm-btn-primary"
              data-demo="dapp-start-build"
              disabled={!canStart}
              onClick={() => onStart([...selected], createNew ? newName : null)}
            >
              {editMode ? 'Update' : 'Start building'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

/* =============================================================== Player bar */

/** Bottom Spotify player bar — cover + meta + heart on the left, transport +
 *  scrubber in the center, right rail reserved for Connect/Share/Queue. */
function PlayerBar({
  playing,
  elapsed,
  onToggle,
  onPrev,
  onNext,
  title,
  artist,
  color,
  durationMs,
}: {
  playing: boolean
  elapsed: number
  onToggle: () => void
  onPrev: () => void
  onNext: () => void
  title: string
  artist: string
  color: string
  durationMs: number
}) {
  const pct = durationMs > 0 ? Math.min((elapsed / durationMs) * 100, 100) : 0

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
          <button aria-label="Previous" onClick={onPrev}><PrevIcon size={20} /></button>
          <button className="dapp-player-play" onClick={onToggle} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          </button>
          <button aria-label="Next" data-demo="dapp-player-next" onClick={onNext}><NextIcon size={20} /></button>
        </div>
        <div className="dapp-player-scrubber">
          <span>{formatDuration(elapsed)}</span>
          <div className="dapp-progress">
            <div className="dapp-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span>{formatDuration(durationMs)}</span>
        </div>
      </div>

      <div className="dapp-player-right" />
    </footer>
  )
}
