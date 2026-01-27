import { useQueryClient } from '@tanstack/react-query'
import { FeatureFlags } from 'constants/featureFlags'
import { useEffect, useState } from 'react'
import { CROSS_CHAIN_SWAPS_STORAGE_KEY } from 'uniswap/src/utils/featureFlags'

/**
 * Hook to handle URL-based cross-chain swaps override
 * Detects ?cross-chain-swaps=true/false and manages localStorage
 * Returns true if explicitly disabled via URL/localStorage, false otherwise
 * @internal
 */
function useUrlCrossChainSwapsDisabled(): boolean {
  const queryClient = useQueryClient()
  const [overrideDisabled, setOverrideDisabled] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return localStorage.getItem(CROSS_CHAIN_SWAPS_STORAGE_KEY) === 'false'
  })

  useEffect(() => {
    const checkUrlParams = (): void => {
      const urlParams = new URLSearchParams(window.location.search)
      const param = urlParams.get('cross-chain-swaps')

      if (param === 'true' || param === 'false') {
        const shouldDisable = param === 'false'
        const currentlyDisabled = localStorage.getItem(CROSS_CHAIN_SWAPS_STORAGE_KEY) === 'false'

        // Only update if value changed
        if (shouldDisable !== currentlyDisabled) {
          if (shouldDisable) {
            localStorage.setItem(CROSS_CHAIN_SWAPS_STORAGE_KEY, 'false')
          } else {
            localStorage.removeItem(CROSS_CHAIN_SWAPS_STORAGE_KEY)
          }

          // Invalidate all queries to refetch with new flag status
          queryClient.invalidateQueries()
          setOverrideDisabled(shouldDisable)

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
        const isDisabled = e.newValue === 'false'
        setOverrideDisabled(isDisabled)
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

  return overrideDisabled
}

/**
 * Hook to check if cross-chain swaps are enabled
 * Checks both env variable and URL override
 */
export function useCrossChainSwapsEnabled(): boolean {
  const isUrlDisabled = useUrlCrossChainSwapsDisabled()

  // URL override to disable takes priority, otherwise check env variable
  return !isUrlDisabled && FeatureFlags.CROSS_CHAIN_SWAPS
}
