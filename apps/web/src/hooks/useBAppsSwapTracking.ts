import { useCallback, useEffect } from 'react'
import { useBAppsSwapTracking as useTracking } from 'services/bappsCampaign/hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * Hook to automatically track swap transactions for bApps campaign
 */
export function useBAppsSwapTracking(txHash?: string, chainId?: UniverseChainId) {
  const { trackSwapCompletion } = useTracking()

  useEffect(() => {
    if (!txHash || chainId !== UniverseChainId.CitreaTestnet) {
      return
    }

    // Track the swap after a short delay to ensure transaction is confirmed
    const timer = setTimeout(() => {
      trackSwapCompletion(txHash).catch((error) => {
        // Silently fail if tracking fails
      })
    }, 3000) // 3 second delay

    return () => clearTimeout(timer)
  }, [txHash, chainId, trackSwapCompletion])
}

/**
 * Hook to manually track a swap with token information
 */
export function useManualBAppsTracking() {
  const { trackSwapCompletion } = useTracking()

  const trackSwap = useCallback(
    async (txHash: string, inputCurrency?: string, outputCurrency?: string) => {
      try {
        // Determine token symbols for tracking
        const inputSymbol = inputCurrency === 'ETH' || inputCurrency === 'NATIVE' ? 'NATIVE' : inputCurrency
        const outputSymbol = outputCurrency

        const taskId = await trackSwapCompletion(txHash, inputSymbol, outputSymbol)

        if (taskId !== null) {
          // Task completion tracked successfully
        }

        return taskId
      } catch (error) {
        // Silently fail if tracking fails
        return null
      }
    },
    [trackSwapCompletion],
  )

  return { trackSwap }
}
