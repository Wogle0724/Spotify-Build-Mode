import { useEffect, useState } from 'react'
import type { Playlist } from '../../../data/playlists'
import type { Song } from '../../../data/songs'
import { Artwork } from '../../common/Artwork'
import { CheckIcon, HeartIcon, PlusIcon } from '../../icons'
import './AddSheet.css'

const AUTO_DISMISS_MS = 5000

interface AddSheetProps {
  song: Song
  playlists: Playlist[]
  /** The playlist this Build Mode session is adding to by default. */
  targetPlaylistId: string
  likedSongIds: string[]
  /** Add/remove the song from a playlist. */
  onTogglePlaylist: (playlistId: string) => void
  /** Add/remove the song from Liked Songs. */
  onToggleLiked: () => void
  /** Called when the sheet should close (timeout, Done, or backdrop). */
  onClose: () => void
  /** When false, no countdown — the sheet only closes via Done/backdrop. */
  autoDismiss?: boolean
}

/**
 * Bottom sheet shown after the user accepts (+) a song. It confirms the song
 * is in the target playlist and lets them pile it into more playlists or Liked
 * Songs. If untouched for 5s it auto-dismisses ("goes back down").
 *
 * The 5s timer resets on every interaction. We `key` the countdown bar by an
 * incrementing token so the CSS animation restarts cleanly on each reset.
 */
export function AddSheet({
  song,
  playlists,
  targetPlaylistId,
  likedSongIds,
  onTogglePlaylist,
  onToggleLiked,
  onClose,
  autoDismiss = true,
}: AddSheetProps) {
  const [resetToken, setResetToken] = useState(0)
  const [closing, setClosing] = useState(false)
  const liked = likedSongIds.includes(song.id)

  // (Re)arm the auto-dismiss whenever the user interacts. When the timer
  // expires we play the collapse animation, then onAnimationEnd calls onClose.
  useEffect(() => {
    if (!autoDismiss || closing) return
    const id = window.setTimeout(() => setClosing(true), AUTO_DISMISS_MS)
    return () => window.clearTimeout(id)
  }, [resetToken, autoDismiss, closing])

  const bump = () => setResetToken((t) => t + 1)

  const target = playlists.find((p) => p.id === targetPlaylistId)
  const others = playlists.filter((p) => p.id !== targetPlaylistId)

  return (
    <div
      className={`addsheet-scrim${closing ? ' is-closing' : ''}`}
      onClick={onClose}
    >
      <div
        className={`addsheet${closing ? ' is-closing' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          bump()
        }}
        onAnimationEnd={(e) => {
          if (closing && e.animationName === 'addsheet-down') onClose()
        }}
      >
        <div className="addsheet-grip" />

        <div className="addsheet-head">
          <Artwork color={song.color} size={48} radius={4} />
          <div className="addsheet-head-meta">
            <span className="addsheet-added">Added to {target?.name ?? 'playlist'}</span>
            <span className="addsheet-song">
              {song.title} · {song.artist}
            </span>
          </div>
        </div>

        <div className="addsheet-list">
          {/* Liked Songs */}
          <button
            className="addsheet-row"
            data-demo="sheet-liked"
            onClick={() => {
              onToggleLiked()
              bump()
            }}
          >
            <span className="addsheet-row-icon liked">
              <HeartIcon size={18} />
            </span>
            <span className="addsheet-row-name">Liked Songs</span>
            <Toggle on={liked} />
          </button>

          {/* Target playlist (already added; can remove) */}
          {target && (
            <button
              className="addsheet-row"
              onClick={() => {
                onTogglePlaylist(target.id)
                bump()
              }}
            >
              <Artwork color={target.color} size={32} radius={4} />
              <span className="addsheet-row-name">
                {target.name} <span className="addsheet-row-tag">· new</span>
              </span>
              <Toggle on={target.songIds.includes(song.id)} />
            </button>
          )}

          {/* Add to more playlists */}
          {others.map((p) => (
            <button
              key={p.id}
              className="addsheet-row"
              data-demo="sheet-playlist"
              onClick={() => {
                onTogglePlaylist(p.id)
                bump()
              }}
            >
              <Artwork color={p.color} size={32} radius={4} />
              <span className="addsheet-row-name">{p.name}</span>
              <Toggle on={p.songIds.includes(song.id)} />
            </button>
          ))}
        </div>

        <button className="addsheet-done" onClick={onClose} data-demo="sheet-done">
          Done
        </button>

        {/* Auto-dismiss countdown; restarts on each interaction via key. */}
        {autoDismiss && (
          <div className="addsheet-countdown">
            <div key={resetToken} className="addsheet-countdown-fill" />
          </div>
        )}
      </div>
    </div>
  )
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`addsheet-toggle${on ? ' is-on' : ''}`} aria-hidden>
      {on ? <CheckIcon size={16} /> : <PlusIcon size={16} />}
    </span>
  )
}
