/*
 * Dummy song "database" — lives entirely in the repo, no backend required.
 * Artwork is rendered as a CSS gradient from `color` so we ship zero images
 * while still feeling like a real catalog. Treat this file as the data layer;
 * swap it for a fetch later without touching the UI.
 *
 * The demo catalog spans three recognizable genres — classic rock, 2000s hits,
 * and 2010s pop — so a presenter building a single-genre playlist can show off
 * the accept/skip flow: most recommendations fit, the occasional one doesn't.
 * `genre` is metadata only; the recommendation logic in lib/buildMode.ts still
 * partitions purely by "in a playlist" vs. "not in a playlist".
 */

export type Genre = 'classic-rock' | '2000s-hits' | '2010s-pop'

export interface Song {
  id: string
  title: string
  artist: string
  album: string
  /** Track length in milliseconds. */
  durationMs: number
  /** Base color used to generate the album artwork gradient. */
  color: string
  /** Which demo genre this track belongs to. Data only — see file header. */
  genre: Genre
  explicit?: boolean
}

export const songs: Song[] = [
  /* ---- Classic Rock ----
   * Seeds the "Classic Rock Essentials" playlist (p1) below. Because these
   * already sit in a playlist, Build Mode treats them as "songs you know". */
  { id: 's1', title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', durationMs: 354000, color: 'var(--c-purple)', genre: 'classic-rock' },
  { id: 's2', title: 'Hotel California', artist: 'Eagles', album: 'Hotel California', durationMs: 391000, color: 'var(--c-yellow)', genre: 'classic-rock' },
  { id: 's3', title: 'Sweet Child O’ Mine', artist: 'Guns N’ Roses', album: 'Appetite for Destruction', durationMs: 356000, color: 'var(--c-orange)', genre: 'classic-rock' },
  { id: 's4', title: 'Go Your Own Way', artist: 'Fleetwood Mac', album: 'Rumours', durationMs: 218000, color: 'var(--c-teal)', genre: 'classic-rock' },
  { id: 's5', title: 'Don’t Stop Believin’', artist: 'Journey', album: 'Escape', durationMs: 251000, color: 'var(--c-blue)', genre: 'classic-rock' },
  { id: 's6', title: 'Back in Black', artist: 'AC/DC', album: 'Back in Black', durationMs: 255000, color: 'var(--c-slate)', genre: 'classic-rock' },
  { id: 's7', title: 'More Than a Feeling', artist: 'Boston', album: 'Boston', durationMs: 285000, color: 'var(--c-red)', genre: 'classic-rock' },

  /* ---- 2010s Pop ----
   * Seeds the "2010s Pop Throwbacks" playlist (p2). Also "songs you know". */
  { id: 's8', title: 'Rolling in the Deep', artist: 'Adele', album: '21', durationMs: 228000, color: 'var(--c-mauve)', genre: '2010s-pop' },
  { id: 's9', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', album: 'Uptown Special', durationMs: 270000, color: 'var(--c-magenta)', genre: '2010s-pop' },
  { id: 's10', title: 'Shake It Off', artist: 'Taylor Swift', album: '1989', durationMs: 219000, color: 'var(--c-sky)', genre: '2010s-pop' },
  { id: 's11', title: 'Happy', artist: 'Pharrell Williams', album: 'G I R L', durationMs: 233000, color: 'var(--c-yellow)', genre: '2010s-pop' },
  { id: 's12', title: 'Shape of You', artist: 'Ed Sheeran', album: '÷ (Divide)', durationMs: 234000, color: 'var(--c-lime)', genre: '2010s-pop' },
  { id: 's13', title: 'Royals', artist: 'Lorde', album: 'Pure Heroine', durationMs: 190000, color: 'var(--c-indigo)', genre: '2010s-pop' },
  { id: 's14', title: 'Counting Stars', artist: 'OneRepublic', album: 'Native', durationMs: 257000, color: 'var(--c-forest)', genre: '2010s-pop' },

  /* ---- Discovery pool ----
   * These songs are intentionally NOT in any playlist below, so Build Mode's
   * "Songs you don't know" mode recommends from here and "Songs you know"
   * never does. The pool is deliberately cross-genre: building a single-genre
   * playlist from it surfaces both on-genre picks to add and off-genre ones to
   * skip — the core accept/reject moment of the demo.
   *
   * 2000s hits live entirely here (no seed playlist of their own); a handful of
   * extra classic-rock and 2010s-pop tracks round it out so each existing
   * playlist also has fresh on-genre songs to discover. */

  // 2000s hits
  { id: 's15', title: 'Mr. Brightside', artist: 'The Killers', album: 'Hot Fuss', durationMs: 222000, color: 'var(--c-blue)', genre: '2000s-hits' },
  { id: 's16', title: 'Hey Ya!', artist: 'OutKast', album: 'Speakerboxxx/The Love Below', durationMs: 235000, color: 'var(--c-lime)', genre: '2000s-hits' },
  { id: 's17', title: 'Crazy in Love', artist: 'Beyoncé', album: 'Dangerously in Love', durationMs: 236000, color: 'var(--c-magenta)', genre: '2000s-hits' },
  { id: 's18', title: 'Seven Nation Army', artist: 'The White Stripes', album: 'Elephant', durationMs: 232000, color: 'var(--c-red)', genre: '2000s-hits' },
  { id: 's19', title: 'Clocks', artist: 'Coldplay', album: 'A Rush of Blood to the Head', durationMs: 307000, color: 'var(--c-sky)', genre: '2000s-hits' },
  { id: 's20', title: 'Since U Been Gone', artist: 'Kelly Clarkson', album: 'Breakaway', durationMs: 188000, color: 'var(--c-pink)', genre: '2000s-hits' },
  { id: 's21', title: 'Boulevard of Broken Dreams', artist: 'Green Day', album: 'American Idiot', durationMs: 260000, color: 'var(--c-slate)', genre: '2000s-hits' },
  { id: 's22', title: 'Feel Good Inc.', artist: 'Gorillaz', album: 'Demon Days', durationMs: 222000, color: 'var(--c-forest)', genre: '2000s-hits' },
  { id: 's23', title: 'In da Club', artist: '50 Cent', album: 'Get Rich or Die Tryin’', durationMs: 193000, color: 'var(--c-orange)', genre: '2000s-hits', explicit: true },
  { id: 's24', title: 'Yeah!', artist: 'Usher', album: 'Confessions', durationMs: 250000, color: 'var(--c-purple)', genre: '2000s-hits' },

  // More classic rock (on-genre discovery for the Classic Rock playlist)
  { id: 's25', title: 'Dream On', artist: 'Aerosmith', album: 'Aerosmith', durationMs: 268000, color: 'var(--c-indigo)', genre: 'classic-rock' },
  { id: 's26', title: 'Free Bird', artist: 'Lynyrd Skynyrd', album: 'Pronounced ’Lĕh-’nérd ’Skin-’nérd', durationMs: 549000, color: 'var(--c-rust)', genre: 'classic-rock' },
  { id: 's27', title: 'Carry On Wayward Son', artist: 'Kansas', album: 'Leftoverture', durationMs: 321000, color: 'var(--c-teal)', genre: 'classic-rock' },
  { id: 's28', title: 'Born to Run', artist: 'Bruce Springsteen', album: 'Born to Run', durationMs: 270000, color: 'var(--c-rust)', genre: 'classic-rock' },

  // More 2010s pop (on-genre discovery for the 2010s Pop playlist)
  { id: 's29', title: 'Get Lucky', artist: 'Daft Punk ft. Pharrell Williams', album: 'Random Access Memories', durationMs: 369000, color: 'var(--c-yellow)', genre: '2010s-pop' },
  { id: 's30', title: 'Call Me Maybe', artist: 'Carly Rae Jepsen', album: 'Kiss', durationMs: 193000, color: 'var(--c-pink)', genre: '2010s-pop' },
  { id: 's31', title: 'Can’t Stop the Feeling!', artist: 'Justin Timberlake', album: 'Trolls', durationMs: 236000, color: 'var(--c-sky)', genre: '2010s-pop' },
  { id: 's32', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', durationMs: 200000, color: 'var(--c-indigo)', genre: '2010s-pop' },
]

/** Look up a single song by id. */
export const songById = (id: string): Song | undefined =>
  songs.find((s) => s.id === id)

/** All songs in a given genre (handy for filtering/labels in the UI). */
export const songsByGenre = (genre: Genre): Song[] =>
  songs.filter((s) => s.genre === genre)
