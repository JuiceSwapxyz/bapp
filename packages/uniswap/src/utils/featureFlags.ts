import { SharedQueryClient } from 'uniswap/src/data/apiClients/SharedQueryClient'

export const CROSS_CHAIN_SWAPS_STORAGE_KEY = 'crossChainSwapsOverride'

export function isCrossChainSwapsEnabled(): boolean {
  // The swap backend and claim indexer this feature depends on have been
  // decommissioned (see JuiceSwapxyz/api#283), so it's off until a
  // replacement backend is wired up. A URL/localStorage override (see
  // apps/web/src/hooks/useCrossChainSwapsEnabled.ts) can force it either way.
  if (typeof localStorage !== 'undefined') {
    const override = localStorage.getItem(CROSS_CHAIN_SWAPS_STORAGE_KEY)
    if (override === 'true' || override === 'false') {
      return override === 'true'
    }
  }
  return process.env.REACT_APP_CROSS_CHAIN_SWAPS === 'true'
}

export function getCrossChainSwapsServerSnapshot(): boolean {
  return process.env.REACT_APP_CROSS_CHAIN_SWAPS === 'true'
}

// Shared across every subscriber (apps/web's useCrossChainSwapsEnabled(),
// packages/uniswap's useCommonBridgeTokensOptions(), ...) so a change from
// any one of them - a URL param, a cross-tab storage event - notifies all
// the others via a single useSyncExternalStore-compatible store.
const crossChainSwapsListeners = new Set<() => void>()
let crossChainSwapsStorageListenerRegistered = false

// Deferred to a microtask so a notification triggered synchronously from
// inside a render (see useApplyCrossChainSwapsUrlParam in
// apps/web/src/hooks/useCrossChainSwapsEnabled.ts, which applies a URL
// override during the first render rather than in an effect) never
// re-renders a different, already-mounted subscriber while some other
// component is still rendering.
function scheduleCrossChainSwapsRefresh(): void {
  queueMicrotask(() => {
    // Refetch already-mounted queries gated on this flag.
    // eslint-disable-next-line no-void
    void SharedQueryClient.invalidateQueries()
    crossChainSwapsListeners.forEach((listener) => listener())
  })
}

function ensureCrossChainSwapsStorageListener(): void {
  if (crossChainSwapsStorageListenerRegistered || typeof window === 'undefined') {
    return
  }
  crossChainSwapsStorageListenerRegistered = true
  window.addEventListener('storage', (e) => {
    if (e.key === CROSS_CHAIN_SWAPS_STORAGE_KEY) {
      // Another tab changed the override.
      scheduleCrossChainSwapsRefresh()
    }
  })
}

export function subscribeCrossChainSwapsEnabled(onStoreChange: () => void): () => void {
  ensureCrossChainSwapsStorageListener()
  crossChainSwapsListeners.add(onStoreChange)
  return () => crossChainSwapsListeners.delete(onStoreChange)
}

export function applyCrossChainSwapsOverride(override: boolean): void {
  if (typeof localStorage === 'undefined') {
    return
  }
  localStorage.setItem(CROSS_CHAIN_SWAPS_STORAGE_KEY, String(override))
  scheduleCrossChainSwapsRefresh()
}
