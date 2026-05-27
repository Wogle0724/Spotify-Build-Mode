/** Format a millisecond duration as m:ss (e.g. 201000 -> "3:21"). */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/** Build the diagonal gradient used for album / playlist artwork. */
export function artworkGradient(color: string): string {
  return `linear-gradient(135deg, ${color} 0%, rgba(0,0,0,0.65) 130%)`
}
