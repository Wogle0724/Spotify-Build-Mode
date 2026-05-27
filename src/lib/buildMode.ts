/*
 * Build Mode recommendation logic.
 *
 * We don't build a real recommender — Spotify's already exists. Here we just
 * partition the mock catalog the way the three modes describe and shuffle:
 *
 *  - "known"   : songs in *some* playlist on the device, but NOT the target one.
 *  - "unknown" : songs in *no* playlist (the discovery pool).
 *  - "mix"     : the two interleaved.
 *
 * Songs already in the target playlist are always excluded so we never
 * recommend something the user already has there.
 */
import type { Playlist } from '../data/playlists'
import { songs, type Song } from '../data/songs'

export type BuildModeType = 'known' | 'unknown' | 'mix'

export interface BuildModeChoice {
  type: BuildModeType
  title: string
  blurb: string
}

export const BUILD_MODES: BuildModeChoice[] = [
  {
    type: 'known',
    title: 'Songs you know',
    blurb: 'Pulled from your other playlists — favorites that aren’t in this one yet.',
  },
  {
    type: 'unknown',
    title: 'Songs you don’t know',
    blurb: 'Fresh recommendations you haven’t saved anywhere. Pure discovery.',
  },
  {
    type: 'mix',
    title: 'A mix of both',
    blurb: 'Familiar picks and new finds, shuffled together.',
  },
]

/** Set of every song id that appears in at least one playlist. */
function songIdsInAnyPlaylist(playlists: Playlist[]): Set<string> {
  const ids = new Set<string>()
  for (const p of playlists) for (const id of p.songIds) ids.add(id)
  return ids
}

/** Fisher–Yates shuffle (returns a new array). */
function shuffle<T>(input: T[]): T[] {
  const arr = [...input]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Interleave two arrays a,b,a,b… keeping leftovers at the end. */
function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = []
  const max = Math.max(a.length, b.length)
  for (let i = 0; i < max; i++) {
    if (i < a.length) out.push(a[i])
    if (i < b.length) out.push(b[i])
  }
  return out
}

/**
 * Build the ordered queue of recommended songs for a Build Mode session.
 *
 * @param mode            which of the three modes the user picked
 * @param targetSongIds   songs already in the playlist being built
 * @param playlists       all playlists currently on the device
 */
export function buildRecommendationQueue(
  mode: BuildModeType,
  targetSongIds: string[],
  playlists: Playlist[],
): Song[] {
  const inAny = songIdsInAnyPlaylist(playlists)
  const target = new Set(targetSongIds)

  const known = songs.filter((s) => inAny.has(s.id) && !target.has(s.id))
  const unknown = songs.filter((s) => !inAny.has(s.id) && !target.has(s.id))

  if (mode === 'known') return shuffle(known)
  if (mode === 'unknown') return shuffle(unknown)
  return interleave(shuffle(known), shuffle(unknown))
}
