import { useEffect, useState } from 'react'
import { FeatureFlags } from 'constants/featureFlags'

const STORAGE_KEY = 'crossChainSwapsOverride'

/**
 * Hook to handle URL-based cross-chain swaps override
 * Detects ?cross-chain-swaps=true/false and manages localStorage
 * @internal
 */
function useUrlCrossChainSwapsOverride(): boolean {
  const [overrideActive, setOverrideActive] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })

  useEffect(() => {
    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const param = urlParams.get('cross-chain-swaps')

      if (param === 'true') {
        localStorage.setItem(STORAGE_KEY, 'true')
        // Hard refresh to ensure all components re-render with new state
        window.location.href = window.location.pathname
        return
      }

      if (param === 'false') {
        localStorage.removeItem(STORAGE_KEY)
        // Hard refresh to ensure all components re-render with new state
        window.location.href = window.location.pathname
        return
      }
    }

    // Check on mount
    checkUrlParams()

    // Listen for manual localStorage changes (from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setOverrideActive(e.newValue === 'true')
      }
    }

    // Listen for URL changes (navigation)
    const handlePopState = () => {
      checkUrlParams()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return overrideActive
}

/**
 * Hook to check if cross-chain swaps are enabled
 * Checks both env variable and URL override
 */
export function useCrossChainSwapsEnabled(): boolean {
  const hasUrlOverride = useUrlCrossChainSwapsOverride()

  // URL override takes priority, otherwise check env variable
  return hasUrlOverride || FeatureFlags.CROSS_CHAIN_SWAPS
}

/**
 * Non-React function to check if cross-chain swaps are enabled
 * For use in non-hook contexts (e.g., utility functions)
 */
export function isCrossChainSwapsEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const hasOverride = localStorage.getItem(STORAGE_KEY) === 'true'
    if (hasOverride) return true
  }
  return FeatureFlags.CROSS_CHAIN_SWAPS
}
