/*
 * Scripted Build Mode walkthroughs for the auto-playing landing preview.
 *
 * All wait-step ms values are 25% longer than "natural" for comfortable
 * viewing at demo pace.
 */

export type DemoStep =
  | { kind: 'tap'; target: string; label?: string }
  | { kind: 'type'; target: string; text: string; label?: string }
  | { kind: 'voice'; phrase: string; target: string }
  | { kind: 'wait'; ms: number; label?: string }

export interface DemoFlow {
  id: string
  title: string
  subtitle: string
  initialTab: 'home' | 'library'
  steps: DemoStep[]
}

export const FLOWS: DemoFlow[] = [
  {
    id: 'from-existing-playlist',
    title: 'From a playlist you have',
    subtitle: 'Top it up with fresh discoveries',
    initialTab: 'library',
    steps: [
      { kind: 'tap', target: 'lib-row', label: 'Open a playlist' },
      { kind: 'tap', target: 'pl-more', label: 'Open the ⋯ menu' },
      { kind: 'tap', target: 'pl-buildmode', label: 'Enter Build Mode' },
      { kind: 'tap', target: 'mode-unknown', label: 'Songs you don\'t know yet' },
      { kind: 'wait', ms: 938 },
      { kind: 'tap', target: 'bm-add', label: 'Add this one' },
      { kind: 'tap', target: 'sheet-liked', label: 'Save to Liked Songs too' },
      { kind: 'tap', target: 'sheet-playlist', label: 'Drop it in another playlist' },
      { kind: 'tap', target: 'sheet-done', label: 'Done' },
      { kind: 'wait', ms: 2250, label: 'It just keeps playing…' },
      { kind: 'tap', target: 'bm-next', label: 'Skip to the next pick' },
      { kind: 'tap', target: 'bm-reject', label: 'Not this one' },
      { kind: 'tap', target: 'bm-add', label: 'Add this one' },
      { kind: 'wait', ms: 7000, label: 'Leave it — panel closes on its own' },
      { kind: 'wait', ms: 2000, label: '…and it keeps playing' },
    ],
  },
  {
    id: 'brand-new-playlist',
    title: 'A brand-new playlist',
    subtitle: 'Mix old favorites with new finds — hands-free',
    initialTab: 'home',
    steps: [
      { kind: 'tap', target: 'nav-create', label: 'Tap ＋ to create' },
      { kind: 'tap', target: 'create-buildmode', label: 'Choose Build Mode' },
      { kind: 'type', target: 'name-input', text: 'Summer Road Trip', label: 'Name your playlist' },
      { kind: 'tap', target: 'name-confirm', label: 'Start building' },
      { kind: 'tap', target: 'mode-mix', label: 'Some old, some new' },
      { kind: 'wait', ms: 938 },
      { kind: 'tap', target: 'bm-add', label: 'Add this one' },
      { kind: 'tap', target: 'sheet-done', label: 'Done' },
      { kind: 'wait', ms: 2125, label: 'It just keeps playing…' },
      { kind: 'tap', target: 'bm-next', label: 'Next pick' },
      { kind: 'tap', target: 'bm-voice-toggle', label: 'Turn on Voice mode — go hands-free' },
      { kind: 'voice', phrase: 'Spotify, skip', target: 'bm-reject' },
      { kind: 'voice', phrase: 'Spotify, skip', target: 'bm-reject' },
      { kind: 'voice', phrase: 'Spotify, add', target: 'bm-add' },
      { kind: 'wait', ms: 7000, label: 'Leave it — it closes on its own' },
      { kind: 'wait', ms: 1875, label: '…and it keeps playing' },
    ],
  },
]
