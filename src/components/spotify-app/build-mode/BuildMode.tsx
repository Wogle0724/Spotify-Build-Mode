import { useEffect, useState } from 'react'
import type { Playlist } from '../../../data/playlists'
import { songById, type Song } from '../../../data/songs'
import {
  BUILD_MODES,
  buildRecommendationQueue,
  type BuildModeType,
} from '../../../lib/buildMode'
import { useSpeechCommands } from '../../../lib/useSpeechCommands'
import { formatDuration } from '../../../lib/format'
import { Artwork } from '../../common/Artwork'
import {
  CloseIcon,
  PlusIcon,
  MicIcon,
  CheckIcon,
  ShuffleIcon,
  PrevIcon,
  NextIcon,
  PlayIcon,
  PauseIcon,
  RepeatIcon,
} from '../../icons'
import { AddSheet } from './AddSheet'
import './BuildMode.css'

interface BuildModeProps {
  targetPlaylistId: string
  playlists: Playlist[]
  likedSongIds: string[]
  onTogglePlaylist: (songId: string, playlistId: string) => void
  onToggleLiked: (songId: string) => void
  onExit: () => void
}

type Step = 'mode' | 'building' | 'done'

/**
 * While "building", a song is in one of two phases:
 *  - 'deciding' : a fresh recommendation awaiting a call — big X / ＋ buttons.
 *  - 'playing'  : the user added it, so it just keeps playing under the normal
 *                 Spotify Now Playing UI. Next fetches a new recommendation.
 */
type Phase = 'deciding' | 'playing'

const TICK_MS = 250

export function BuildMode({
  targetPlaylistId,
  playlists,
  likedSongIds,
  onTogglePlaylist,
  onToggleLiked,
  onExit,
}: BuildModeProps) {
  const target = playlists.find((p) => p.id === targetPlaylistId)

  const [step, setStep] = useState<Step>('mode')
  const [mode, setMode] = useState<BuildModeType | null>(null)
  const [queue, setQueue] = useState<Song[]>([])
  const [index, setIndex] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [voiceOn, setVoiceOn] = useState(false)
  const [phase, setPhase] = useState<Phase>('deciding')
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [exitConfirm, setExitConfirm] = useState(false)
  // Target's songs at session start, so we can report just what was added.
  const [initialTargetIds, setInitialTargetIds] = useState<string[]>([])

  const current: Song | undefined = queue[index]
  const inTarget = !!(current && target?.songIds.includes(current.id))

  // Songs added during this session (net), newest first.
  const addedSongs: Song[] = (target?.songIds ?? [])
    .filter((id) => !initialTargetIds.includes(id))
    .map(songById)
    .filter((s): s is Song => Boolean(s))
    .reverse()

  function chooseMode(m: BuildModeType) {
    const q = buildRecommendationQueue(m, target?.songIds ?? [], playlists)
    setMode(m)
    setQueue(q)
    setIndex(0)
    setInitialTargetIds(target?.songIds ?? [])
    setPhase('deciding')
    setSheetOpen(false)
    setPaused(false)
    setElapsed(0)
    setStep(q.length > 0 ? 'building' : 'done')
  }

  /** Move to a recommendation index and reset to the deciding phase. */
  function goToSong(next: number) {
    setSheetOpen(false)
    if (next >= queue.length) {
      setStep('done')
      return
    }
    setIndex(next)
    setPhase('deciding')
    setPaused(false)
    setElapsed(0)
  }

  function accept() {
    if (!current) return
    onTogglePlaylist(current.id, targetPlaylistId) // add to target playlist
    setSheetOpen(true)
  }

  /** Sheet dismissed: keep this song playing under the normal player UI. */
  function dismissSheet() {
    setSheetOpen(false)
    setPhase('playing')
  }

  function reject() {
    goToSong(index + 1) // discard + jump to the next recommendation
  }

  function nextPick() {
    goToSong(index + 1) // already-added song: advance to a new pick
  }

  // Simulated playback clock — drives both the progress bar and the time
  // labels. Paused while the add sheet is up so it can't reset the sheet timer.
  useEffect(() => {
    if (!current || paused || sheetOpen || step !== 'building') return
    const id = window.setInterval(() => {
      setElapsed((e) => Math.min(e + TICK_MS, current.durationMs))
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [current, paused, sheetOpen, step])

  // When an added song plays out, advance to the next recommendation.
  useEffect(() => {
    if (phase === 'playing' && current && elapsed >= current.durationMs) {
      nextPick()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed])

  // Voice stays armed during the building step; behavior depends on phase.
  const speech = useSpeechCommands(voiceOn && step === 'building', (cmd) => {
    if (sheetOpen) {
      dismissSheet()
      return
    }
    if (phase === 'deciding') {
      cmd === 'add' ? accept() : reject()
    } else {
      cmd === 'skip' ? nextPick() : setSheetOpen(true)
    }
  })

  function requestExit() {
    if (addedSongs.length > 0 || step === 'building') setExitConfirm(true)
    else onExit()
  }

  if (step === 'mode') {
    return <ModeSelect target={target} onPick={chooseMode} onExit={onExit} />
  }

  if (step === 'done') {
    return (
      <SummaryScreen
        heading={addedSongs.length > 0 ? 'Nice work' : 'All caught up'}
        addedSongs={addedSongs}
        target={target}
        primaryLabel="Done"
        onPrimary={onExit}
        secondaryLabel="Keep building"
        onSecondary={() => setStep('mode')}
      />
    )
  }

  const pct = current ? (elapsed / current.durationMs) * 100 : 0
  const remaining = current ? Math.max(0, current.durationMs - elapsed) : 0

  return (
    <div className="bm">
      <Header
        target={target}
        modeLabel={BUILD_MODES.find((m) => m.type === mode)?.title ?? ''}
        addedCount={addedSongs.length}
        onExit={requestExit}
      />

      {current && (
        <div className="bm-now">
          <div className="bm-cover" key={current.id}>
            <Artwork color={current.color} size={330} radius={8} />
            <div className={`bm-eq${paused ? ' is-paused' : ''}`} aria-hidden>
              <span /><span /><span /><span />
            </div>
          </div>

          {/* Title/artist left-aligned with the add control on the right. */}
          <div className="bm-songbar">
            <div className="bm-songmeta">
              <h2 className="bm-title">{current.title}</h2>
              <p className="bm-artist">
                {current.explicit && <span className="bm-explicit">E</span>}
                {current.artist}
              </p>
            </div>
            {phase === 'playing' && (
              <button
                className={`bm-addmore${inTarget ? ' is-added' : ''}`}
                onClick={() => setSheetOpen(true)}
                aria-label="Add to more playlists"
              >
                {inTarget ? <CheckIcon size={22} /> : <PlusIcon size={26} />}
              </button>
            )}
          </div>

          <div className="bm-progress">
            <div className="bm-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="bm-times">
            <span>{formatDuration(elapsed)}</span>
            <span>-{formatDuration(remaining)}</span>
          </div>
        </div>
      )}

      {/* Controls swap by phase; everything above stays put. */}
      {phase === 'deciding' ? (
        <div className="bm-actions">
          <button className="bm-btn bm-reject" onClick={reject} aria-label="Skip this song">
            <CloseIcon size={48} />
            <span>Skip</span>
          </button>
          <button className="bm-btn bm-add" onClick={accept} aria-label="Add this song">
            <PlusIcon size={48} />
            <span>Add</span>
          </button>
        </div>
      ) : (
        <div className="bm-transport">
          <button className="bm-iconbtn" aria-label="Shuffle"><ShuffleIcon size={22} /></button>
          <button className="bm-iconbtn" aria-label="Previous" disabled><PrevIcon size={28} /></button>
          <button className="bm-playpause" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Play' : 'Pause'}>
            {paused ? <PlayIcon size={26} /> : <PauseIcon size={26} />}
          </button>
          <button className="bm-iconbtn" onClick={nextPick} aria-label="Next"><NextIcon size={28} /></button>
          <button className="bm-iconbtn" aria-label="Repeat"><RepeatIcon size={22} /></button>
        </div>
      )}

      <VoicePanel
        voiceOn={voiceOn}
        onToggle={() => setVoiceOn((v) => !v)}
        supported={speech.supported}
        listening={speech.listening}
        error={speech.error}
        transcript={speech.transcript}
        phase={phase}
        onSimulate={(cmd) =>
          phase === 'deciding'
            ? cmd === 'add'
              ? accept()
              : reject()
            : cmd === 'skip'
              ? nextPick()
              : setSheetOpen(true)
        }
      />

      {sheetOpen && current && (
        <AddSheet
          song={current}
          playlists={playlists}
          targetPlaylistId={targetPlaylistId}
          likedSongIds={likedSongIds}
          onTogglePlaylist={(pid) => onTogglePlaylist(current.id, pid)}
          onToggleLiked={() => onToggleLiked(current.id)}
          onClose={dismissSheet}
        />
      )}

      {exitConfirm && (
        <SummaryScreen
          overlay
          heading="Leave Build Mode?"
          addedSongs={addedSongs}
          target={target}
          primaryLabel="Leave"
          onPrimary={onExit}
          secondaryLabel="Keep building"
          onSecondary={() => setExitConfirm(false)}
        />
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- header --- */

function Header({
  target,
  modeLabel,
  addedCount,
  onExit,
}: {
  target?: Playlist
  modeLabel: string
  addedCount: number
  onExit: () => void
}) {
  return (
    <header className="bm-header">
      <button className="bm-header-btn" onClick={onExit} aria-label="Exit Build Mode">
        <CloseIcon size={22} />
      </button>
      <div className="bm-header-center">
        <span className="bm-header-eyebrow">Build Mode · {modeLabel}</span>
        <span className="bm-name">{target?.name ?? 'Playlist'}</span>
      </div>
      <span className="bm-added-chip">{addedCount} added</span>
    </header>
  )
}

/* ----------------------------------------------------------- mode select --- */

function ModeSelect({
  target,
  onPick,
  onExit,
}: {
  target?: Playlist
  onPick: (m: BuildModeType) => void
  onExit: () => void
}) {
  return (
    <div className="bm bm-modeselect">
      <header className="bm-header">
        <button className="bm-header-btn" onClick={onExit} aria-label="Exit Build Mode">
          <CloseIcon size={22} />
        </button>
        <div className="bm-header-center">
          <span className="bm-header-eyebrow">Build Mode</span>
          <span className="bm-name">{target?.name ?? 'Playlist'}</span>
        </div>
        <span style={{ width: 36 }} />
      </header>

      <div className="bm-mode-intro">
        <h1>What should we play?</h1>
        <p>Pick a source. Then just tap Add or Skip — hands-free works too.</p>
      </div>

      <div className="bm-mode-list">
        {BUILD_MODES.map((m) => (
          <button key={m.type} className="bm-mode-card" onClick={() => onPick(m.type)}>
            <span className="bm-mode-title">{m.title}</span>
            <span className="bm-mode-blurb">{m.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------ summary / exit confirm --- */

function SummaryScreen({
  overlay,
  heading,
  addedSongs,
  target,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  /** Render as a modal over the building screen rather than a full screen. */
  overlay?: boolean
  heading: string
  addedSongs: Song[]
  target?: Playlist
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel: string
  onSecondary: () => void
}) {
  const count = addedSongs.length
  const preview = addedSongs.slice(0, 4)
  const more = count - preview.length

  const body = (
    <div className="bm-summary-card">
      <div className="bm-done-badge">
        {count > 0 ? <CheckIcon size={40} /> : <CloseIcon size={36} />}
      </div>
      <h1>{heading}</h1>
      <p className="bm-summary-sub">
        {count > 0 ? (
          <>
            Added <strong>{count}</strong> {count === 1 ? 'song' : 'songs'} to{' '}
            <strong>{target?.name ?? 'your playlist'}</strong>.
          </>
        ) : (
          <>No songs added to {target?.name ?? 'your playlist'} yet.</>
        )}
      </p>

      {count > 0 && (
        <ul className="bm-summary-list">
          {preview.map((s) => (
            <li key={s.id}>
              <Artwork color={s.color} size={34} radius={4} />
              <span className="bm-summary-song">
                <span className="bm-summary-title">{s.title}</span>
                <span className="bm-summary-artist">{s.artist}</span>
              </span>
            </li>
          ))}
          {more > 0 && <li className="bm-summary-more">+{more} more</li>}
        </ul>
      )}

      <div className="bm-done-actions">
        <button className="bm-done-secondary" onClick={onSecondary}>
          {secondaryLabel}
        </button>
        <button className="bm-done-primary" onClick={onPrimary}>
          {primaryLabel}
        </button>
      </div>
    </div>
  )

  if (overlay) return <div className="bm-summary-scrim">{body}</div>
  return <div className="bm bm-done">{body}</div>
}

/* ------------------------------------------------------------ voice panel --- */

function VoicePanel({
  voiceOn,
  onToggle,
  supported,
  listening,
  error,
  transcript,
  phase,
  onSimulate,
}: {
  voiceOn: boolean
  onToggle: () => void
  supported: boolean
  listening: boolean
  error: string | null
  transcript: string
  phase: Phase
  onSimulate: (cmd: 'add' | 'skip') => void
}) {
  const realActive = voiceOn && supported && !error
  return (
    <div className={`bm-voice${voiceOn ? ' is-on' : ''}`}>
      <button className="bm-voice-toggle" onClick={onToggle}>
        <MicIcon size={18} />
        {voiceOn ? 'Voice on' : 'Voice mode'}
        {voiceOn && realActive && listening && <span className="bm-voice-dot" />}
      </button>

      {voiceOn && (
        <div className="bm-voice-body">
          {realActive ? (
            <span className="bm-voice-hint">
              Listening — say “Spotify, add” or “Spotify, skip”.
              {transcript && <em> “{transcript}”</em>}
            </span>
          ) : (
            <div className="bm-voice-sim">
              <span className="bm-voice-hint">
                {supported
                  ? 'Mic unavailable — tap to simulate:'
                  : 'Voice isn’t supported here — tap to simulate:'}
              </span>
              <div className="bm-voice-sim-btns">
                <button onClick={() => onSimulate('skip')}>“Skip”</button>
                <button onClick={() => onSimulate('add')}>
                  {phase === 'deciding' ? '“Add”' : '“Add more”'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
