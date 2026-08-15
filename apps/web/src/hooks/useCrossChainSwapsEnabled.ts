import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useSyncExternalStore } from 'react'
import { CROSS_CHAIN_SWAPS_STORAGE_KEY, isCrossChainSwapsEnabled } from 'uniswap/src/utils/featureFlags'

// Shared across every useCrossChainSwapsEnabled() instance so that whichever
// one processes a change (a URL param, a cross-tab storage event) notifies
// all the others - a plain per-instance useState cannot do this, since
// history.replaceState synchronously strips the URL param, so only the
// first instance's effect to run ever sees it and the rest never re-render.
const listeners = new Set<() => void>()

function notifyListeners(): void {
  listeners.forEach((listener) => listener())
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange)

  const handleStorageChange = (e: StorageEvent): void => {
    if (e.key === CROSS_CHAIN_SWAPS_STORAGE_KEY) {
      onStoreChange()
    }
  }
  window.addEventListener('storage', handleStorageChange)

  return () => {
    listeners.delete(onStoreChange)
    window.removeEventListener('storage', handleStorageChange)
  }
}

function getServerSnapshot(): boolean {
  return process.env.REACT_APP_CROSS_CHAIN_SWAPS === 'true'
}

/**
 * Applies a ?cross-chain-swaps=true/false URL param to localStorage (once
 * per navigation, idempotent across co-mounted instances) and notifies
 * every subscribed useCrossChainSwapsEnabled() instance of the change.
 * @internal
 */
function useApplyCrossChainSwapsUrlParam(): void {
  const queryClient = useQueryClient()

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
          notifyListeners()

          // Remove query param from URL without full page refresh
          const url = new URL(window.location.href)
          url.searchParams.delete('cross-chain-swaps')
          window.history.replaceState({}, '', url.toString())
        }
      }
    }

    // Check on mount
    checkUrlParams()

    // Listen for URL changes (navigation)
    const handlePopState = (): void => {
      checkUrlParams()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [queryClient])
}

/**
 * Hook to check if cross-chain swaps are enabled.
 * Checks both env variable and URL/localStorage override. Backed by
 * useSyncExternalStore so every co-mounted instance (nav, page body, etc.)
 * re-renders together on any change, instead of each holding independent
 * local state that only the "winning" instance's effect would update.
 */
export function useCrossChainSwapsEnabled(): boolean {
  useApplyCrossChainSwapsUrlParam()
  return useSyncExternalStore(subscribe, isCrossChainSwapsEnabled, getServerSnapshot)
}
