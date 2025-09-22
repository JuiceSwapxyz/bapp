import { useEffect } from 'react'
import { useBAppsSwapTracking as useTracking } from 'services/bappsCampaign/hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * Hook to automatically track swap transactions for bApps campaign
 * @internal - Used by swap components
 */
function useBAppsSwapTracking(txHash?: string, chainId?: UniverseChainId) {
  const { trackSwapCompletion } = useTracking()

  useEffect(() => {
    if (!txHash || chainId !== UniverseChainId.CitreaTestnet) {
      return
    }

    // Track the swap after a short delay to ensure transaction is confirmed
    const timer = setTimeout(() => {
      trackSwapCompletion(txHash).catch(() => {
        // Silently fail if tracking fails
      })
    }, 3000) // 3 second delay

    // eslint-disable-next-line consistent-return
    return () => clearTimeout(timer)
  }, [txHash, chainId, trackSwapCompletion])
}

// eslint-disable-next-line import/no-unused-modules
export { useBAppsSwapTracking }
