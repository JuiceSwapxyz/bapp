import { useQueryClient } from '@tanstack/react-query'
import { WebFeatureFlags } from 'constants/featureFlags'
import { useEffect, useState } from 'react'
import { CROSS_CHAIN_SWAPS_STORAGE_KEY } from 'uniswap/src/utils/featureFlags'

type CrossChainSwapsOverride = 'true' | 'false' | undefined

/**
 * Hook to handle URL-based cross-chain swaps override
 * Detects ?cross-chain-swaps=true/false and manages localStorage
 * Returns 'true'/'false' if explicitly overridden via URL/localStorage, undefined otherwise
 * @internal
 */
function useCrossChainSwapsOverride(): CrossChainSwapsOverride {
  const queryClient = useQueryClient()
  const [override, setOverride] = useState<CrossChainSwapsOverride>(() => {
    if (typeof window === 'undefined') {
      return undefined
    }
    const stored = localStorage.getItem(CROSS_CHAIN_SWAPS_STORAGE_KEY)
    return stored === 'true' || stored === 'false' ? stored : undefined
  })

  useEffect(() => {
    const checkUrlParams = (): void => {
      const urlParams = new URLSearchParams(window.location.search)
      const param = urlParams.get('cross-chain-swaps')

      if (param === 'true' || param === 'false') {
        const stored = localStorage.getItem(CROSS_CHAIN_SWAPS_STORAGE_KEY)
        const currentOverride = stored === 'true' || stored === 'false' ? stored : undefined

        // Only update if value changed
        if (param !== currentOverride) {
          localStorage.setItem(CROSS_CHAIN_SWAPS_STORAGE_KEY, param)

          // Invalidate all queries to refetch with new flag status
          queryClient.invalidateQueries()
          setOverride(param)

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
        setOverride(e.newValue === 'true' || e.newValue === 'false' ? e.newValue : undefined)
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

  return override
}

/**
 * Hook to check if cross-chain swaps are enabled
 * Checks both env variable and URL/localStorage override
 */
export function useCrossChainSwapsEnabled(): boolean {
  const override = useCrossChainSwapsOverride()

  if (override === 'true' || override === 'false') {
    return override === 'true'
  }

  return WebFeatureFlags.CROSS_CHAIN_SWAPS
}
