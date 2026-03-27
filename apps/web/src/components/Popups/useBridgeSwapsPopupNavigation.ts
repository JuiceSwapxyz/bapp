import { useCallback } from 'react'

export function useBridgeSwapsPopupNavigation(onClose: () => void): () => void {
  return useCallback(() => {
    window.open(`${window.location.origin}/bridge-swaps`, '_blank', 'noopener,noreferrer')
    onClose()
  }, [onClose])
}
