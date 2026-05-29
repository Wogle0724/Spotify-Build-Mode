/*
 * Minimal inline-SVG icon set styled after Spotify's iconography.
 * Inline SVG keeps the bundle self-contained and crisp at any scale —
 * important since our device frames scale the whole UI.
 */
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const base = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'currentColor',
  'aria-hidden': true,
})

export const HomeIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3.3 3 10v10a1 1 0 0 0 1 1h5v-6h6v6h5a1 1 0 0 0 1-1V10l-9-6.7Z" />
  </svg>
)

export const SearchIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={2} {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <line x1="15.5" y1="15.5" x2="21" y2="21" strokeLinecap="round" />
  </svg>
)

export const LibraryIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M4 3h2v18H4zM8 3h2v18H8zM14.3 4.2l1.9-.5 4.6 16.4-1.9.5z" />
  </svg>
)

export const PlusIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
  </svg>
)

export const CheckIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={2.5} {...p}>
    <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const PlayIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M7 4.5 19 12 7 19.5z" />
  </svg>
)

export const PauseIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M7 4h3v16H7zM14 4h3v16h-3z" />
  </svg>
)

// Heart — Material-style symmetric path, designed to read well both as an
// outlined glyph (default `fill="none" stroke=currentColor`) and as a filled
// glyph when the wrapper sets `fill: currentColor`. We render outlined by
// default; callers that want the filled "liked" treatment add `.is-on` /
// matching CSS to flip fill+stroke to the brand green.
export const HeartIcon = ({ size = 24, ...p }: IconProps) => (
  <svg
    {...base(size)}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinejoin="round"
    {...p}
  >
    <path d="M12 21.05 10.55 19.74C5.4 15.09 2 12.04 2 8.27 2 5.2 4.42 2.8 7.5 2.8c1.74 0 3.41.81 4.5 2.09C13.09 3.61 14.76 2.8 16.5 2.8 19.58 2.8 22 5.2 22 8.27c0 3.77-3.4 6.82-8.55 11.47L12 21.05Z" />
  </svg>
)

export const MicIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
    <path
      d="M6 11a6 6 0 0 0 12 0M12 17v3M9 20h6"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </svg>
)

export const NextIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M5 4.5 14 12l-9 7.5zM16 4h2.5v16H16z" />
  </svg>
)

export const PrevIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M19 4.5 10 12l9 7.5zM5.5 4H8v16H5.5z" />
  </svg>
)

export const ShuffleIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
    <path d="M3 7h3l9 10h3M3 17h3l3-3.3M15 7h3M18 4l3 3-3 3M12.5 9.3 15 7M18 14l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const CloseIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={2.4} {...p}>
    <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
  </svg>
)

export const MoreIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
)

export const BackIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={1.9} {...p}>
    <path d="M14.5 6 8 12l6.5 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const PlaylistIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M3 6h12v2H3zM3 11h12v2H3zM3 16h8v2H3zM17 7v8.2a3 3 0 1 0 2 2.8V9l3 1V7l-5-2z" />
  </svg>
)

// Repeat — single circular arrow with one arrowhead. Reads as "loop" at a
// glance. Use the wrapper's `.is-on` to recolor green + show the underdot.
export const RepeatIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
    {/* Almost-closed circle: starts at ~2 o'clock, sweeps clockwise back to ~1 o'clock */}
    <path d="M16 6.5a7 7 0 1 0 4 6.3" strokeLinecap="round" />
    {/* Arrowhead capping the open end at the top */}
    <path d="m13 3.5 3.5 3-3.5 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const DownloadIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={1.9} {...p}>
    <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Share — outbox-style arrow rising from a tray. Spotify's mobile Now Playing
// uses an arrow-out-of-box icon to the left of the queue button.
export const ShareIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
    <path d="M12 14V3.5M8.5 7 12 3.5 15.5 7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const UsersIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" strokeLinecap="round" />
    <path d="M16 5.5a3 3 0 0 1 0 5.8M16.5 13.5a5.5 5.5 0 0 1 4 5.5" strokeLinecap="round" />
  </svg>
)

export const SparkleIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M12 2.5l1.8 5.2 5.2 1.8-5.2 1.8L12 16.5l-1.8-5.2L5 9.5l5.2-1.8L12 2.5zM18.5 15l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" />
  </svg>
)

// Two-arrow "sort" indicator used next to "Recents" in the library header.
export const SortIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={1.9} {...p}>
    <path d="M7 5v14M4 8l3-3 3 3M17 5v14M14 16l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Connect to a device — clean boombox/speaker silhouette. Matches the icon
// Spotify uses below the transport in mobile Now Playing and on the desktop
// player's right side.
export const ConnectIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
    <rect x="5" y="3.5" width="14" height="17" rx="2.2" />
    <circle cx="12" cy="15" r="2.6" fill="currentColor" stroke="none" />
    <path d="M9 7.5h6" strokeLinecap="round" />
  </svg>
)

// Queue — three stacked lines (a list) with a small play triangle nearby,
// matching Spotify's "Queue" glyph in the Now Playing bottom row.
export const QueueIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
    <path d="M3 7h13M3 12h13M3 17h7" strokeLinecap="round" />
    <path d="M14 15.5v5l4-2.5z" fill="currentColor" stroke="none" />
  </svg>
)

// 2×2 grid: the list/grid view toggle on the right of the library sort row.
export const GridViewIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1" />
    <rect x="13" y="4" width="7" height="7" rx="1" />
    <rect x="4" y="13" width="7" height="7" rx="1" />
    <rect x="13" y="13" width="7" height="7" rx="1" />
  </svg>
)

export const ChevronRightIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={1.9} {...p}>
    <path d="M9.5 6 16 12l-6.5 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const ChevronDownIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={1.9} {...p}>
    <path d="M6 9.5 12 16l6-6.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const LinkedInIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

export const SpotifyLogo = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.6 14.4a.62.62 0 0 1-.86.21c-2.35-1.44-5.3-1.76-8.8-.96a.62.62 0 1 1-.28-1.21c3.83-.88 7.1-.5 9.73 1.1a.62.62 0 0 1 .21.86Zm1.23-2.74a.78.78 0 0 1-1.07.26c-2.69-1.65-6.79-2.13-9.97-1.17a.78.78 0 1 1-.45-1.49c3.63-1.1 8.15-.56 11.24 1.33.37.23.49.71.25 1.07Zm.1-2.85C14.83 8.96 9.35 8.78 6.28 9.71a.93.93 0 1 1-.54-1.78c3.53-1.07 9.58-.86 13.36 1.38a.93.93 0 1 1-.95 1.6Z" />
  </svg>
)
