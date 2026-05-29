/*
 * Scripted Build Mode walkthroughs for the auto-playing desktop preview.
 *
 * Browse flow: enters via + library button (nothing pre-selected), goes to
 * Search, opens an external playlist, ticks 3 songs, adds them all.
 *
 * Discover flows: enter via playlist ⋯ menu (playlist pre-selected, go
 * straight to Start building). After each Add, click the player Next button
 * (wired to discoverSkipRef so it advances the recommendation queue) to bring
 * up the next song's pill. This avoids waiting for the full song to play out.
 *
 * All wait-step ms values are already 25% longer than "natural."
 */

export type DesktopDemoStep =
  | { kind: 'tap'; target: string; label?: string }
  | { kind: 'type'; target: string; text: string; label?: string }
  | { kind: 'wait'; ms: number; label?: string }

export interface DesktopDemoFlow {
  id: string
  title: string
  subtitle: string
  steps: DesktopDemoStep[]
}

export const DESKTOP_FLOWS: DesktopDemoFlow[] = [
  {
    id: 'browse-select',
    title: 'Browse & select',
    subtitle: 'Cherry-pick songs from anywhere, add them all at once',
    steps: [
      // Enter Build Mode from the + library button (nothing pre-selected)
      { kind: 'tap', target: 'dapp-library-add', label: 'Add to your library' },
      { kind: 'wait', ms: 500 },
      { kind: 'tap', target: 'dapp-create-buildmode', label: 'Choose Build Mode' },
      { kind: 'wait', ms: 500 },
      // Target picker opens with nothing selected — click to SELECT the first playlist
      { kind: 'tap', target: 'dapp-target-row', label: 'Pick a playlist to fill' },
      { kind: 'wait', ms: 500 },
      { kind: 'tap', target: 'dapp-start-build', label: 'Start building' },
      { kind: 'wait', ms: 750 },
      { kind: 'tap', target: 'dbm-mode-browse', label: 'Browse & select' },
      { kind: 'wait', ms: 875 },
      // Search for an external playlist to cherry-pick from
      { kind: 'tap', target: 'dapp-nav-search', label: 'Search Spotify' },
      { kind: 'wait', ms: 625 },
      { kind: 'type', target: 'dapp-search-input', text: '2000', label: 'Search for playlists' },
      { kind: 'wait', ms: 750 },
      { kind: 'tap', target: 'dapp-search-card', label: 'Open a playlist' },
      { kind: 'wait', ms: 875 },
      // Tick 3 songs to add them to the batch
      { kind: 'tap', target: 'dapp-track-row', label: 'Tick song 1' },
      { kind: 'wait', ms: 375 },
      { kind: 'tap', target: 'dapp-track-row-2', label: 'Tick song 2' },
      { kind: 'wait', ms: 375 },
      { kind: 'tap', target: 'dapp-track-row-3', label: 'Tick song 3' },
      { kind: 'wait', ms: 500 },
      // Add the whole batch
      { kind: 'tap', target: 'dbm-cart-add', label: 'Add all 3 to playlist' },
      { kind: 'wait', ms: 500 },
      { kind: 'tap', target: 'dbm-confirm-add', label: 'Confirm' },
      { kind: 'wait', ms: 2250, label: '3 songs added at once' },
    ],
  },
  {
    id: 'discover-known',
    title: 'Discover — songs you know',
    subtitle: 'Rediscover old favorites, decide in one click',
    steps: [
      // Enter from playlist ⋯ menu — playlist is already pre-selected
      { kind: 'tap', target: 'dapp-playlist-row', label: 'Open a playlist' },
      { kind: 'wait', ms: 750 },
      { kind: 'tap', target: 'dapp-more-btn', label: 'Open options' },
      { kind: 'wait', ms: 500 },
      { kind: 'tap', target: 'dapp-enter-buildmode', label: 'Enter Build Mode' },
      { kind: 'wait', ms: 500 },
      // Already pre-selected — go straight to Start
      { kind: 'tap', target: 'dapp-start-build', label: 'Start building' },
      { kind: 'wait', ms: 750 },
      { kind: 'tap', target: 'dbm-mode-known', label: 'Songs you already know' },
      // Wait for pill to animate in, then Add
      { kind: 'wait', ms: 1875, label: 'Song playing…' },
      { kind: 'tap', target: 'dbm-pill-add', label: 'Add it' },
      { kind: 'wait', ms: 1000, label: 'Added to playlist' },
      // Use player Next to advance (pill is now hidden after Add)
      { kind: 'tap', target: 'dapp-player-next', label: 'Next recommendation' },
      { kind: 'wait', ms: 1250, label: 'Next song…' },
      { kind: 'tap', target: 'dbm-pill-skip', label: 'Skip this one' },
      { kind: 'wait', ms: 1250, label: 'Next song…' },
      { kind: 'tap', target: 'dbm-pill-add', label: 'Add it' },
      { kind: 'wait', ms: 2000, label: 'Playlist is growing' },
    ],
  },
  {
    id: 'discover-unknown',
    title: 'Discover — new finds',
    subtitle: 'Fresh recommendations, one click to add',
    steps: [
      { kind: 'tap', target: 'dapp-playlist-row', label: 'Open a playlist' },
      { kind: 'wait', ms: 750 },
      { kind: 'tap', target: 'dapp-more-btn', label: 'Open options' },
      { kind: 'wait', ms: 500 },
      { kind: 'tap', target: 'dapp-enter-buildmode', label: 'Enter Build Mode' },
      { kind: 'wait', ms: 500 },
      { kind: 'tap', target: 'dapp-start-build', label: 'Start building' },
      { kind: 'wait', ms: 750 },
      { kind: 'tap', target: 'dbm-mode-unknown', label: 'Discover new songs' },
      { kind: 'wait', ms: 1875, label: 'Song playing…' },
      // First song: skip via pill (pill is visible immediately after mode select)
      { kind: 'tap', target: 'dbm-pill-skip', label: 'Not this one' },
      { kind: 'wait', ms: 1250, label: 'Next song…' },
      // Second song: add via pill
      { kind: 'tap', target: 'dbm-pill-add', label: 'Add it' },
      { kind: 'wait', ms: 1000, label: 'Added' },
      // Use player Next to get next song
      { kind: 'tap', target: 'dapp-player-next', label: 'Next recommendation' },
      { kind: 'wait', ms: 1375, label: 'Next song…' },
      { kind: 'tap', target: 'dbm-pill-add', label: 'Add this one too' },
      { kind: 'wait', ms: 2250, label: 'Playlist is growing' },
    ],
  },
]
