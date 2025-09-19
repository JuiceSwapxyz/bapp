import { useMedia } from 'ui/src'

// When tabs are visible in the top level of nav (not in dropdown)
export function useTabsVisible(): boolean {
  const media = useMedia()
  return !media.md
}
