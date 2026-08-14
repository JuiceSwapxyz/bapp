export const CROSS_CHAIN_SWAPS_STORAGE_KEY = 'crossChainSwapsOverride'

export function isCrossChainSwapsEnabled(): boolean {
  // The swap backend and claim indexer this feature depends on have been
  // decommissioned (see JuiceSwapxyz/api#283), so it's off until a
  // replacement backend is wired up. A URL/localStorage override (see
  // apps/web/src/hooks/useCrossChainSwapsEnabled.ts) can force it either way.
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem(CROSS_CHAIN_SWAPS_STORAGE_KEY)
    if (override === 'true' || override === 'false') {
      return override === 'true'
    }
  }
  return process.env.REACT_APP_CROSS_CHAIN_SWAPS === 'true'
}
