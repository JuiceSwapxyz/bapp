import { useEffect, useRef, useSyncExternalStore } from 'react'
import {
  CROSS_CHAIN_SWAPS_STORAGE_KEY,
  applyCrossChainSwapsOverride,
  getCrossChainSwapsServerSnapshot,
  isCrossChainSwapsEnabled,
  subscribeCrossChainSwapsEnabled,
} from 'uniswap/src/utils/featureFlags'

function checkUrlParams(): void {
  const urlParams = new URLSearchParams(window.location.search)
  const param = urlParams.get('cross-chain-swaps')

  if (param === 'true' || param === 'false') {
    const stored = localStorage.getItem(CROSS_CHAIN_SWAPS_STORAGE_KEY)
    const currentOverride = stored === 'true' || stored === 'false' ? stored : undefined

    // Only write/notify if value changed, but always strip the param -
    // otherwise an already-matching param survives in the URL and can
    // silently re-apply a stale value on a later reload/popstate (e.g.
    // after another tab changes the override in between).
    if (param !== currentOverride) {
      applyCrossChainSwapsOverride(param === 'true')
    }

    // Remove query param from URL without full page refresh
    const url = new URL(window.location.href)
    url.searchParams.delete('cross-chain-swaps')
    window.history.replaceState({}, '', url.toString())
  }
}

/**
 * Applies a ?cross-chain-swaps=true/false URL param to localStorage and
 * notifies every subscribed useCrossChainSwapsEnabled() instance of the
 * change.
 * @internal
 */
function useApplyCrossChainSwapsUrlParam(): void {
  // Applied synchronously during the first render, not in a useEffect: a
  // component can bail to a redirect based on this same render's flag value
  // (e.g. BridgeSwaps -> <Navigate> when the flag reads false) whose own
  // effect fires *before* this component's effects - React commits child
  // effects before parent effects. A useEffect here would run too late: the
  // replace navigation already strips the URL param this is meant to apply,
  // before this component gets a chance to read it. Idempotent, so the
  // double-invoke under StrictMode/dev remount is harmless.
  const appliedRef = useRef(false)
  if (!appliedRef.current) {
    appliedRef.current = true
    checkUrlParams()
  }

  useEffect(() => {
    // Handle subsequent in-app URL changes (browser back/forward) that carry
    // the param without a full page load.
    window.addEventListener('popstate', checkUrlParams)
    return () => window.removeEventListener('popstate', checkUrlParams)
  }, [])
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
  return useSyncExternalStore(
    subscribeCrossChainSwapsEnabled,
    isCrossChainSwapsEnabled,
    getCrossChainSwapsServerSnapshot,
  )
}
