export const CROSS_CHAIN_SWAPS_STORAGE_KEY = 'crossChainSwapsOverride'

export function isCrossChainSwapsEnabled(): boolean {
  // The swap backend and claim indexer this feature depends on have been
  // decommissioned (see JuiceSwapxyz/api#283), so it's off until a
  // replacement backend is wired up.
  const envEnabled = process.env.REACT_APP_CROSS_CHAIN_SWAPS === 'true'
  if (!envEnabled) {
    return false
  }
  if (typeof window !== 'undefined') {
    const localStorageDisabled = localStorage.getItem(CROSS_CHAIN_SWAPS_STORAGE_KEY) === 'false'
    if (localStorageDisabled) {
      return false
    }
  }
  return true
}
