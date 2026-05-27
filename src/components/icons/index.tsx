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

export const HeartIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={2} {...p}>
    <path d="M12 20s-7-4.5-9.5-9C1 8 2.5 4.5 6 4.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 15.5 12 20 12 20Z" />
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
  <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={2.2} {...p}>
    <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const PlaylistIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M3 6h12v2H3zM3 11h12v2H3zM3 16h8v2H3zM17 7v8.2a3 3 0 1 0 2 2.8V9l3 1V7l-5-2z" />
  </svg>
)

export const RepeatIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={1.9} {...p}>
    <path d="M7 7h9a3 3 0 0 1 3 3v1M17 17H8a3 3 0 0 1-3-3v-1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 4.5 19 7l-3 2.5M8 19.5 5 17l3-2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const DownloadIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={1.9} {...p}>
    <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const ShareIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={1.9} {...p}>
    <path d="M12 15V4M8.5 7.5 12 4l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1" strokeLinecap="round" strokeLinejoin="round" />
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

export const SpotifyLogo = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.6 14.4a.62.62 0 0 1-.86.21c-2.35-1.44-5.3-1.76-8.8-.96a.62.62 0 1 1-.28-1.21c3.83-.88 7.1-.5 9.73 1.1a.62.62 0 0 1 .21.86Zm1.23-2.74a.78.78 0 0 1-1.07.26c-2.69-1.65-6.79-2.13-9.97-1.17a.78.78 0 1 1-.45-1.49c3.63-1.1 8.15-.56 11.24 1.33.37.23.49.71.25 1.07Zm.1-2.85C14.83 8.96 9.35 8.78 6.28 9.71a.93.93 0 1 1-.54-1.78c3.53-1.07 9.58-.86 13.36 1.38a.93.93 0 1 1-.95 1.6Z" />
  </svg>
)
