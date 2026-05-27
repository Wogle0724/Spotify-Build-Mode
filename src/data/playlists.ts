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

export { songs }
