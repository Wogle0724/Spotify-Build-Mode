/*
 * Dummy playlists referencing songs by id. Also lives in the repo.
 *
 * The demo starts with exactly two pre-made playlists — one Classic Rock, one
 * 2010s Pop — each genre-pure. Their songs are the entire "songs you know" pool
 * that Build Mode draws from; everything else in songs.ts is "songs you don't
 * know" (the discovery pool). 2000s hits intentionally have no starter playlist
 * so the user can build one during the demo.
 */
import { songs, type Song, songById } from './songs'

export interface Playlist {
  id: string
  name: string
  description: string
  /** Gradient base color for the playlist cover. */
  color: string
  songIds: string[]
}

export const playlists: Playlist[] = [
  {
    id: 'p1',
    name: 'Classic Rock Essentials',
    description: 'Riffs, anthems, and air-guitar solos.',
    color: 'var(--c-rust)',
    songIds: ['s1', 's2', 's3', 's4', 's5', 's6', 's7'],
  },
  {
    id: 'p2',
    name: '2010s Pop Throwbacks',
    description: 'The decade’s biggest pop singles.',
    color: 'var(--c-pink)',
    songIds: ['s8', 's9', 's10', 's11', 's12', 's13', 's14'],
  },
]

/** Resolve a playlist's song ids to full Song objects. */
export const songsForPlaylist = (playlist: Playlist): Song[] =>
  playlist.songIds
    .map(songById)
    .filter((s): s is Song => Boolean(s))

/*
 * "Out on Spotify" playlists — NOT in the user's library, but discoverable via
 * search the way any popular editorial or community playlist is. Desktop Build
 * Mode surfaces these so a presenter can pull up an existing internet playlist
 * and cherry-pick songs out of it in one batch, without having to follow it
 * first. Kept separate from `playlists` (your library) so the sidebar stays
 * clean and the mobile app — which doesn't have the multi-select flow — never
 * accidentally renders them.
 */
export interface ExternalPlaylist extends Playlist {
  /** Curator label shown under the title (editorial brand or username). */
  curator: string
  /** Follower count used as social proof in search result rows. */
  followers: number
}

export const externalPlaylists: ExternalPlaylist[] = [
  {
    id: 'ext-all-out-2000s',
    name: 'All Out 2000s',
    description: 'The biggest songs of the 2000s.',
    color: 'var(--c-magenta)',
    curator: 'Spotify',
    followers: 7_842_109,
    songIds: ['s15', 's16', 's17', 's18', 's19', 's20', 's21', 's22', 's23', 's24'],
  },
]

/**
 * Case-insensitive name/curator match against external playlists. Intended for
 * the desktop search bar only — mobile shouldn't call this.
 */
export const searchExternalPlaylists = (query: string): ExternalPlaylist[] => {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return externalPlaylists.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.curator.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q),
  )
}

export { songs }
