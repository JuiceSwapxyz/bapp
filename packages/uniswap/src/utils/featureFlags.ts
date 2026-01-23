
export const CROSS_CHAIN_SWAPS_STORAGE_KEY = 'crossChainSwapsOverride'

export function isCrossChainSwapsEnabled(): boolean {
  const envEnabled = process.env.REACT_APP_CROSS_CHAIN_SWAPS === 'true'
  if (typeof window !== 'undefined') {
    const localStorageOverride = localStorage.getItem(CROSS_CHAIN_SWAPS_STORAGE_KEY) === 'true'
    if (localStorageOverride) {
      return true
    }
  }
  return envEnabled
}
