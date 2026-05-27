import { useEffect, useState } from 'react'

/**
 * Subscribe to a CSS media query and re-render on change.
 * Used to switch the landing page between its mobile and desktop layouts.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** True on tablet/desktop widths where we show both device demos side by side. */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')
