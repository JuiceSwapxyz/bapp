export const CROSS_CHAIN_SWAPS_STORAGE_KEY = 'crossChainSwapsOverride'

export function isCrossChainSwapsEnabled(): boolean {
  const envDisabled = process.env.REACT_APP_CROSS_CHAIN_SWAPS === 'false'
  if (envDisabled) {
    return false
  }
  if (typeof window !== 'undefined') {
    const localStorageDisabled = localStorage.getItem(CROSS_CHAIN_SWAPS_STORAGE_KEY) === 'false'
    if (localStorageDisabled) {
      return false
    }
  }
  return true // Default to enabled
}
