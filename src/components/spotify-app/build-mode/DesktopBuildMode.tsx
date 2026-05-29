import { useEffect, useMemo, useRef, useState } from 'react'
import type { Playlist } from '../../../data/playlists'
import { songById, type Song } from '../../../data/songs'
import {
  BUILD_MODES,
  buildRecommendationQueue,
  type BuildModeType,
} from '../../../lib/buildMode'
import { formatDuration } from '../../../lib/format'
import { Artwork } from '../../common/Artwork'
import {
  CheckIcon,
  CloseIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  NextIcon,
} from '../../icons'
import './DesktopBuildMode.css'

/* ============================================================================
 * Desktop Build Mode — workspace + flows.
 *
 * Unlike mobile (decide one song at a time), desktop is a selection-driven
 * workspace. Two flavors:
 *
 *   1. Browse  — cherry-pick across any playlist (own library OR external
 *      playlists surfaced by search); selections accumulate in a right-side
 *      cart; one Add commits the batch.
 *
 *   2. Discover (3 sub-modes mirroring mobile: known / unknown / mix) — songs
 *      play one at a time in the player bar; a floating Add/Skip pill above
 *      the player drives the decision. Adding pops a tiny "added to…" toast
 *      with a multi-playlist override.
 *
 * Both flavors support multi-target playlists: chosen upfront (the picker
 * modal) and overridable per batch from the Add-confirm popup.
 *
 * This file exports the workspace surfaces only. DesktopApp owns the library
 * mutations and supplies them via props.
 * ============================================================================ */

/** A single song queued in the browse cart, with the row it came from. */
export interface CartItem {
  song: Song
  /** Where this song was picked from — only used for visual grouping. */
  fromPlaylistName?: string
}

export type DesktopBuildKind = 'browse' | BuildModeType

interface DesktopBuildSession {
  /** Targets the user picked at session start (1+, includes any freshly created). */
  defaultTargetIds: string[]
  /** Subset of defaultTargetIds that we auto-created and should garbage-collect
   *  on exit if nothing was added to them. */
  newPlaylistIds: string[]
  /** Snapshot of every song already in any target at session start. The
   *  sidebar computes "added this session" against this baseline. */
  initialSongIds: string[]
  /** Selected mode (null until the user picks one on the mode-select screen). */
  kind: DesktopBuildKind | null
}

export interface DesktopBuildModeProps {
  session: DesktopBuildSession
  playlists: Playlist[]
  onPickMode: (kind: DesktopBuildKind) => void
  /** Commit a batch: add every (songId, playlistId) pair to the library. */
  onCommitBatch: (songIds: string[], playlistIds: string[]) => void
  /** Add a single song to a set of playlists (used by Discover). */
  onCommitOne: (songId: string, playlistIds: string[]) => void
  onExit: () => void
}

/** Report which song the workspace would like the parent's player bar to
 *  show — so the bottom chrome stays in sync with whatever's actually playing
 *  inside Build Mode (Discover candidate, etc.). */
export type CurrentSongReporter = (song: Song | null) => void

/* -------------------------------------------------------------------------- */

/**
 * Mode-select screen — picks Browse or one of the three Discover sub-modes.
 * Rendered as a centered card stack over the workspace background.
 */
export function DesktopBuildModeSelect({
  session,
  playlists,
  onPickMode,
  onExit,
}: Pick<DesktopBuildModeProps, 'session' | 'playlists' | 'onPickMode' | 'onExit'>) {
  const targets = session.defaultTargetIds
    .map((id) => playlists.find((p) => p.id === id))
    .filter((p): p is Playlist => Boolean(p))

  return (
    <div className="dbm-modeselect">
      <header className="dbm-modeselect-head">
        <div>
          <span className="dbm-eyebrow">Build Mode</span>
          <h1 className="dbm-modeselect-title">How do you want to add?</h1>
          <p className="dbm-modeselect-sub">
            Filling{' '}
            {targets.length === 1 ? (
              <strong>{targets[0].name}</strong>
            ) : (
              <strong>
                {targets[0]?.name}
                {targets.length > 1 && ` + ${targets.length - 1} more`}
              </strong>
            )}
            . You can add to others on the fly.
          </p>
        </div>
        <button className="dbm-exit" onClick={onExit} aria-label="Exit Build Mode">
          <CloseIcon size={20} />
        </button>
      </header>

      {/* Two-section layout: Build Mode (browse-and-pick) is one big card; the
          three Discover sub-modes live under "Build and Discover" so the
          top-level split is obvious. */}
      <section className="dbm-modeselect-group">
        <h2 className="dbm-modeselect-group-title">Build Mode</h2>
        <p className="dbm-modeselect-group-sub">
          Cherry-pick songs across any playlist or album — yours or out on Spotify.
          Selections collect in the sidebar; add the whole batch at once.
        </p>
        <div className="dbm-modeselect-grid dbm-modeselect-grid--single">
          <ModeCard
            accent="browse"
            title="Browse & select"
            blurb="Open any playlist, tick the songs you want, and add them all in one go."
            onClick={() => onPickMode('browse')}
          />
        </div>
      </section>

      <section className="dbm-modeselect-group">
        <h2 className="dbm-modeselect-group-title">Build and Discover</h2>
        <p className="dbm-modeselect-group-sub">
          Recommendations come up one at a time. Add or skip with the pill above
          the player bar; the sidebar tracks what you've added.
        </p>
        <div className="dbm-modeselect-grid">
          {BUILD_MODES.map((m) => (
            <ModeCard
              key={m.type}
              accent={m.type}
              title={m.title}
              blurb={m.blurb}
              onClick={() => onPickMode(m.type)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function ModeCard({
  accent,
  title,
  blurb,
  onClick,
}: {
  accent: string
  title: string
  blurb: string
  onClick: () => void
}) {
  return (
    <button className={`dbm-modecard dbm-modecard--${accent}`} data-demo={`dbm-mode-${accent}`} onClick={onClick}>
      <span className="dbm-modecard-title">{title}</span>
      <span className="dbm-modecard-blurb">{blurb}</span>
    </button>
  )
}

/* ============================================================== Browse cart */

interface BrowseCartProps {
  items: CartItem[]
  defaultTargetIds: string[]
  playlists: Playlist[]
  onRemove: (songId: string) => void
  onClear: () => void
  onCommit: (selectedPlaylistIds: string[]) => void
  onCancel: () => void
}

/**
 * Right-side selection cart shown while the browse workspace is active.
 * Listed in pick order; Cancel asks for confirmation; Add opens a confirm
 * popup that lets the user toggle other playlists for this batch.
 */
export function BrowseCart({
  items,
  defaultTargetIds,
  playlists,
  onRemove,
  onClear,
  onCommit,
  onCancel,
}: BrowseCartProps) {
  const [confirmAddOpen, setConfirmAddOpen] = useState(false)
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)

  const targets = playlists.filter((p) => defaultTargetIds.includes(p.id))
  const targetLabel =
    targets.length === 0
      ? 'your playlist'
      : targets.length === 1
        ? targets[0].name
        : `${targets[0].name} + ${targets.length - 1} more`

  const handleExit = () => {
    if (items.length === 0) {
      onCancel()
      return
    }
    setConfirmCancelOpen(true)
  }

  return (
    <aside className="dbm-cart">
      <div className="dbm-cart-target" role="status" title={`Adding to: ${targetLabel}`}>
        <span className="dbm-cart-target-dot" />
        <span className="dbm-cart-target-label">
          Adding to <strong>{targetLabel}</strong>
        </span>
      </div>

      <header className="dbm-cart-head">
        <span className="dbm-cart-count">
          {items.length === 0 ? 'Nothing selected' : `${items.length} selected`}
        </span>
        {items.length > 0 && (
          <button className="dbm-cart-clear" onClick={onClear}>
            Clear
          </button>
        )}
      </header>

      <ul className="dbm-cart-list no-scrollbar">
        {items.length === 0 ? (
          <li className="dbm-cart-empty">
            Tick any song in a playlist on the left to start building your batch.
          </li>
        ) : (
          items.map((it) => (
            <li className="dbm-cart-item" key={it.song.id}>
              <Artwork color={it.song.color} size={36} radius={4} />
              <div className="dbm-cart-meta">
                <span className="dbm-cart-title">{it.song.title}</span>
                <span className="dbm-cart-sub">
                  {it.song.artist}
                  {it.fromPlaylistName && <> · {it.fromPlaylistName}</>}
                </span>
              </div>
              <button
                className="dbm-cart-remove"
                onClick={() => onRemove(it.song.id)}
                aria-label={`Remove ${it.song.title}`}
              >
                <CloseIcon size={14} />
              </button>
            </li>
          ))
        )}
      </ul>

      <div className="dbm-cart-actions">
        <button className="dbm-btn-ghost" onClick={handleExit}>
          Exit
        </button>
        <button
          className="dbm-btn-primary"
          data-demo="dbm-cart-add"
          onClick={() => setConfirmAddOpen(true)}
          disabled={items.length === 0}
        >
          Add {items.length > 0 && <span className="dbm-btn-badge">{items.length}</span>}
        </button>
      </div>

      {confirmAddOpen && (
        <BatchConfirmModal
          items={items}
          defaultTargetIds={defaultTargetIds}
          playlists={playlists}
          onClose={() => setConfirmAddOpen(false)}
          onConfirm={(ids) => {
            onCommit(ids)
            setConfirmAddOpen(false)
          }}
        />
      )}

      {confirmCancelOpen && (
        <CancelConfirmModal
          count={items.length}
          onKeepBuilding={() => setConfirmCancelOpen(false)}
          onDiscard={() => {
            setConfirmCancelOpen(false)
            onCancel()
          }}
        />
      )}
    </aside>
  )
}

/* ========================================== Discover sidebar (right panel) */

interface DiscoverSidebarProps {
  session: DesktopBuildSession
  playlists: Playlist[]
  current: Song | null
  onExit: () => void
  onEditTargets?: () => void
  /** Remove a song from all session target playlists. */
  onRemoveSong?: (songId: string) => void
}

/**
 * Right-rail panel shown while a Build-and-Discover session is active.
 *
 * Mirrors `BrowseCart`'s slot so the chrome stays consistent across modes,
 * but the content is a running tally of what the user has committed this
 * session (not a pending selection). The Add control lives on the floating
 * pill above the player bar, not here — this panel is read-only plus an
 * Exit button to wrap the session.
 */
export function DesktopDiscoverSidebar({
  session,
  playlists,
  current,
  onExit,
  onEditTargets,
  onRemoveSong,
}: DiscoverSidebarProps) {
  const initial = useMemo(() => new Set(session.initialSongIds), [session.initialSongIds])

  // Walk every target in order, pull any song that wasn't there at session
  // start, newest-first. Deduped so a song added to two targets shows once.
  const addedSongs = useMemo(() => {
    const seen = new Set<string>()
    const out: Song[] = []
    for (const id of session.defaultTargetIds) {
      const p = playlists.find((x) => x.id === id)
      if (!p) continue
      for (let i = p.songIds.length - 1; i >= 0; i--) {
        const sid = p.songIds[i]
        if (initial.has(sid) || seen.has(sid)) continue
        seen.add(sid)
        const s = songById(sid)
        if (s) out.push(s)
      }
    }
    return out
  }, [playlists, session.defaultTargetIds, initial])

  const targets = playlists.filter((p) => session.defaultTargetIds.includes(p.id))
  const targetLabel =
    targets.length === 0
      ? 'your playlist'
      : targets.length === 1
        ? targets[0].name
        : `${targets[0].name} + ${targets.length - 1} more`

  const targetCount = session.defaultTargetIds.length

  return (
    <aside className="dbm-cart">
      <header className="dbm-cart-head">
        <span className="dbm-cart-count">
          {addedSongs.length === 0
            ? 'Nothing added yet'
            : `${addedSongs.length} added`}
        </span>
        <button
          className="dbm-cart-targetbtn"
          onClick={onEditTargets}
          title={`Adding to: ${targetLabel}`}
        >
          {targetCount} {targetCount === 1 ? 'playlist' : 'playlists'}
        </button>
      </header>

      {current && (
        <div className="dbm-cart-current">
          <Artwork color={current.color} size={36} radius={4} />
          <div className="dbm-cart-meta">
            <span className="dbm-cart-current-eyebrow">Now considering</span>
            <span className="dbm-cart-title">{current.title}</span>
            <span className="dbm-cart-sub">{current.artist}</span>
          </div>
        </div>
      )}

      <ul className="dbm-cart-list no-scrollbar">
        {addedSongs.length === 0 ? (
          <li className="dbm-cart-empty">
            Hit <strong>Add</strong> on the pill above the player to drop the
            current song into {targetLabel}.
          </li>
        ) : (
          addedSongs.map((s) => (
            <li className="dbm-cart-item" key={s.id}>
              <Artwork color={s.color} size={36} radius={4} />
              <div className="dbm-cart-meta">
                <span className="dbm-cart-title">{s.title}</span>
                <span className="dbm-cart-sub">{s.artist}</span>
              </div>
              {onRemoveSong ? (
                <button
                  className="dbm-cart-remove"
                  onClick={() => onRemoveSong(s.id)}
                  aria-label={`Remove ${s.title}`}
                >
                  <CloseIcon size={14} />
                </button>
              ) : (
                <span className="dbm-cart-addedtick" aria-hidden>
                  <CheckIcon size={14} />
                </span>
              )}
            </li>
          ))
        )}
      </ul>

      <div className="dbm-cart-actions">
        <button className="dbm-btn-ghost" onClick={onExit}>
          Exit
        </button>
        <button className="dbm-btn-primary" onClick={onExit}>
          Done
        </button>
      </div>
    </aside>
  )
}

/* ====================================================== Confirmation modals */

interface BatchConfirmModalProps {
  items: CartItem[]
  defaultTargetIds: string[]
  playlists: Playlist[]
  onClose: () => void
  onConfirm: (playlistIds: string[]) => void
}

/**
 * Add-confirm popup — final review of the songs about to be added and which
 * playlists they're going to. Defaults to the session targets but every
 * playlist is toggleable so the user can fan out (or narrow) per batch.
 */
function BatchConfirmModal({
  items,
  defaultTargetIds,
  playlists,
  onClose,
  onConfirm,
}: BatchConfirmModalProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(defaultTargetIds))

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const targetNames = playlists
    .filter((p) => selected.has(p.id))
    .map((p) => p.name)

  return (
    <Modal onClose={onClose}>
      <div className="dbm-modal-head">
        <h2>Add to playlists</h2>
        <button className="dbm-modal-close" onClick={onClose} aria-label="Close">
          <CloseIcon size={18} />
        </button>
      </div>

      <div className="dbm-modal-body">
        <section className="dbm-modal-section">
          <div className="dbm-modal-section-head">
            <span className="dbm-modal-section-title">{items.length} songs</span>
            <span className="dbm-modal-section-sub">Review before adding</span>
          </div>
          <ul className="dbm-modal-songs no-scrollbar">
            {items.map((it) => (
              <li key={it.song.id}>
                <Artwork color={it.song.color} size={32} radius={4} />
                <div className="dbm-modal-song-meta">
                  <span className="dbm-modal-song-title">{it.song.title}</span>
                  <span className="dbm-modal-song-sub">{it.song.artist}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="dbm-modal-section">
          <div className="dbm-modal-section-head">
            <span className="dbm-modal-section-title">
              {selected.size === 0
                ? 'Pick at least one playlist'
                : selected.size === 1
                  ? `Adding to ${targetNames[0]}`
                  : `Adding to ${selected.size} playlists`}
            </span>
            <span className="dbm-modal-section-sub">Defaults checked</span>
          </div>
          <ul className="dbm-modal-targets no-scrollbar">
            {playlists.map((p) => {
              const on = selected.has(p.id)
              return (
                <li key={p.id}>
                  <button
                    className={`dbm-target-row${on ? ' is-on' : ''}`}
                    onClick={() => toggle(p.id)}
                  >
                    <Artwork color={p.color} size={32} radius={4} />
                    <span className="dbm-target-name">{p.name}</span>
                    <span className="dbm-target-toggle" aria-hidden>
                      {on ? <CheckIcon size={16} /> : <PlusIcon size={16} />}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <footer className="dbm-modal-foot">
        <button className="dbm-btn-ghost" onClick={onClose}>
          Keep editing
        </button>
        <button
          className="dbm-btn-primary"
          data-demo="dbm-confirm-add"
          disabled={selected.size === 0}
          onClick={() => onConfirm([...selected])}
        >
          Add {items.length} {items.length === 1 ? 'song' : 'songs'}
        </button>
      </footer>
    </Modal>
  )
}

function CancelConfirmModal({
  count,
  onKeepBuilding,
  onDiscard,
}: {
  count: number
  onKeepBuilding: () => void
  onDiscard: () => void
}) {
  return (
    <Modal onClose={onKeepBuilding} narrow>
      <div className="dbm-confirm">
        <h2>Exit Build Mode?</h2>
        <p>
          You have <strong>{count}</strong> {count === 1 ? 'song' : 'songs'} selected that haven't
          been added yet. Leaving now discards them.
        </p>
        <div className="dbm-confirm-actions">
          <button className="dbm-btn-ghost" onClick={onKeepBuilding}>
            Keep building
          </button>
          <button className="dbm-btn-danger" onClick={onDiscard}>
            Exit
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ============================================================== Discover UI */

interface DiscoverWorkspaceProps {
  kind: BuildModeType
  session: DesktopBuildSession
  playlists: Playlist[]
  onCommitOne: (songId: string, playlistIds: string[]) => void
  onCurrentChange?: CurrentSongReporter
  /** Call this whenever the user wants to externally trigger a Skip (e.g. Next in player bar). */
  onRegisterSkip?: (skipFn: () => void) => void
}

const DISCOVER_TICK_MS = 250

/**
 * Discover controller (the "workspace" is mostly invisible now).
 *
 * Owns queue + index + elapsed state, drives the candidate song into the
 * parent's player bar via `onCurrentChange`, and renders ONLY the Add/Skip
 * drawer (`DiscoverPill`) that rises from behind the player bar.
 *
 * Per-song decision model:
 *   - A "decided" flag is the current `index` once the user has hit either
 *     Add or Skip for the song at that index. When `index !== decidedIndex`,
 *     the pill is visible. Either button drops it.
 *   - Skip = clear decision + advance immediately. Pill re-rises for the
 *     next candidate.
 *   - Add  = commit to the session's default targets + mark decided. The
 *     same song keeps playing (user explicitly didn't want Add to skip);
 *     pill stays hidden until the song ends and the queue auto-advances.
 *
 * The main area in Discover is rendered by the parent (normal Spotify
 * surfaces — Home / Search / Playlist detail), and the running added-songs
 * tally lives in the right sidebar (`DesktopDiscoverSidebar`). When the
 * queue is exhausted the pill simply disappears; the user wraps the session
 * via the sidebar's Done button.
 */
export function DesktopDiscoverWorkspace({
  kind,
  session,
  playlists,
  onCommitOne,
  onCurrentChange,
  onRegisterSkip,
}: DiscoverWorkspaceProps) {
  const queue = useMemo(
    () => buildRecommendationQueue(kind, session.initialSongIds, playlists),
    // initialSongIds is a snapshot frozen at session start, so we intentionally
    // re-derive the queue only when the kind changes (not on every playlists tick).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kind],
  )

  const [index, setIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  /** Which index has already been Added/Skipped — drives pill visibility. */
  const [decidedIndex, setDecidedIndex] = useState<number | null>(null)
  /** False while the 2-second "song intro" delay is running after each advance. */
  const [pillReady, setPillReady] = useState(false)

  const current = queue[index]
  const pillVisible = !!current && decidedIndex !== index && pillReady

  // Whenever the active song changes, drop the pill and reveal it after 2 s.
  useEffect(() => {
    setPillReady(false)
    if (!queue[index]) return
    const id = window.setTimeout(() => setPillReady(true), 2000)
    return () => window.clearTimeout(id)
  }, [index]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the parent's player bar in sync with whatever song is up for decision.
  useEffect(() => {
    onCurrentChange?.(current ?? null)
    return () => onCurrentChange?.(null)
  }, [current, onCurrentChange])

  // Simulated playback clock for the current candidate.
  useEffect(() => {
    if (!current) return
    const id = window.setInterval(() => {
      setElapsed((e) => Math.min(e + DISCOVER_TICK_MS, current.durationMs))
    }, DISCOVER_TICK_MS)
    return () => window.clearInterval(id)
  }, [current])

  // Auto-advance when a song plays out — same effect as Skip.
  useEffect(() => {
    if (current && elapsed >= current.durationMs) skip()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed])

  function skip() {
    setDecidedIndex(null)
    setElapsed(0)
    setIndex((i) => i + 1)
  }

  // Keep a stable ref so the registered callback always calls the latest skip.
  const skipRef = useRef(skip)
  skipRef.current = skip

  useEffect(() => {
    onRegisterSkip?.(() => skipRef.current())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterSkip])

  /** Add: commit to the session's default targets, mark this index decided,
   *  drop the pill. The song keeps playing — no advance. */
  function add() {
    if (!current) return
    onCommitOne(current.id, session.defaultTargetIds)
    setDecidedIndex(index)
  }

  if (!current) return null

  return (
    <DiscoverPill visible={pillVisible} onSkip={skip} onAdd={add} />
  )
}

/**
 * Add/Skip drawer that rises from behind the player bar.
 *
 * Visibility is driven by the parent: `visible` true → translate to the
 * resting position above the player; false → translate down to be tucked
 * behind the player bar (z-index ordered so the bar visually covers the
 * drawer during its slide). Either button drops the pill via the parent
 * setting `visible` to false.
 */
function DiscoverPill({
  visible,
  onSkip,
  onAdd,
}: {
  visible: boolean
  onSkip: () => void
  onAdd: () => void
}) {
  return (
    <div
      className={`dbm-pill${visible ? ' is-visible' : ''}`}
      aria-hidden={!visible}
    >
      <span className="dbm-pill-eyebrow">What about this one?</span>
      <div className="dbm-pill-row">
        <button
          className="dbm-pill-btn dbm-pill-btn--skip"
          data-demo="dbm-pill-skip"
          onClick={onSkip}
          tabIndex={visible ? 0 : -1}
        >
          <CloseIcon size={20} />
          <span>Skip</span>
        </button>
        <button
          className="dbm-pill-btn dbm-pill-btn--add"
          data-demo="dbm-pill-add"
          onClick={onAdd}
          tabIndex={visible ? 0 : -1}
        >
          <PlusIcon size={20} />
          <span>Add</span>
        </button>
      </div>
    </div>
  )
}

/* ===================================================================== Modal */

function Modal({
  children,
  onClose,
  narrow,
}: {
  children: React.ReactNode
  onClose: () => void
  narrow?: boolean
}) {
  return (
    <div className="dbm-modal-scrim" onClick={onClose}>
      <div
        className={`dbm-modal${narrow ? ' dbm-modal--narrow' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
