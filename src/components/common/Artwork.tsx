import { artworkGradient } from '../../lib/format'

interface ArtworkProps {
  color: string
  /** Size in px (square). */
  size?: number
  radius?: number
  className?: string
}

/**
 * Album / playlist cover. We have no image files, so artwork is a branded
 * gradient built from the item's `color`. Consistent and fully self-contained.
 */
export function Artwork({ color, size = 48, radius = 4, className }: ArtworkProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: artworkGradient(color),
        flexShrink: 0,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    />
  )
}
