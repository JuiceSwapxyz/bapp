import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { FeatureFlags } from 'constants/featureFlags'
import { CROSS_CHAIN_SWAPS_STORAGE_KEY } from 'uniswap/src/utils/featureFlags'

/**
 * Hook to handle URL-based cross-chain swaps override
 * Detects ?cross-chain-swaps=true/false and manages localStorage
 * @internal
 */
function useUrlCrossChainSwapsOverride(): boolean {
  const queryClient = useQueryClient()
  const [overrideActive, setOverrideActive] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(CROSS_CHAIN_SWAPS_STORAGE_KEY) === 'true'
  })

  useEffect(() => {
    const checkUrlParams = (): void => {
      const urlParams = new URLSearchParams(window.location.search)
      const param = urlParams.get('cross-chain-swaps')

      if (param === 'true' || param === 'false') {
        const newValue = param === 'true'
        const currentValue = localStorage.getItem(CROSS_CHAIN_SWAPS_STORAGE_KEY) === 'true'

        // Only update if value changed
        if (newValue !== currentValue) {
          if (newValue) {
            localStorage.setItem(CROSS_CHAIN_SWAPS_STORAGE_KEY, 'true')
          } else {
            localStorage.removeItem(CROSS_CHAIN_SWAPS_STORAGE_KEY)
          }

          // Invalidate all queries to refetch with new flag status
          queryClient.invalidateQueries()
          setOverrideActive(newValue)

          // Remove query param from URL without full page refresh
          const url = new URL(window.location.href)
          url.searchParams.delete('cross-chain-swaps')
          window.history.replaceState({}, '', url.toString())
        }
      }
    }

    // Check on mount
    checkUrlParams()

    // Listen for manual localStorage changes (from other tabs/windows)
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === CROSS_CHAIN_SWAPS_STORAGE_KEY) {
        const newValue = e.newValue === 'true'
        setOverrideActive(newValue)
        // Invalidate queries when another tab changes the setting
        queryClient.invalidateQueries()
      }
    }

    // Listen for URL changes (navigation)
    const handlePopState = (): void => {
      checkUrlParams()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [queryClient])

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
