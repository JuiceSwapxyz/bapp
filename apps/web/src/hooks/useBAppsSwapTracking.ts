import { useEffect, useRef } from 'react'
import { useBAppsSwapTracking as useTracking } from 'services/bappsCampaign/hooks'
import { useTransaction } from 'state/transactions/hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'

/**
 * Hook to automatically track swap transactions for bApps campaign
 * @internal - Used by swap components
 */
function useBAppsSwapTracking(options: {
  txHash?: string
  chainId?: number
  inputToken?: string
  outputToken?: string
}) {
  const { txHash, chainId, inputToken, outputToken } = options
  const { trackSwapCompletion } = useTracking()
  const hasTracked = useRef(new Set<string>())

  // Get transaction status using the existing hook
  const transaction = useTransaction(txHash)

  useEffect(() => {
    // Debug logging
    console.log('[Campaign Debug] useBAppsSwapTracking:', {
      txHash,
      chainId,
      inputToken,
      outputToken,
      transactionStatus: transaction?.status,
      citreaTestnet: UniverseChainId.CitreaTestnet,
    })

    if (!txHash || chainId !== UniverseChainId.CitreaTestnet || !inputToken || !outputToken) {
      return
    }

    // Only track when transaction is confirmed as successful and not already tracked
    if (transaction?.status === TransactionStatus.Success && !hasTracked.current.has(txHash)) {
      console.log('[Campaign Debug] Transaction successful, tracking completion...')
      hasTracked.current.add(txHash)
      trackSwapCompletion({ txHash, inputToken, outputToken })
        .then(() => {
          console.log('[Campaign Debug] Tracking completed successfully')
        })
        .catch((error) => {
          console.error('[Campaign Debug] Tracking failed:', error)
          hasTracked.current.delete(txHash) // Allow retry on failure
        })
    }
  }, [txHash, chainId, inputToken, outputToken, transaction?.status, trackSwapCompletion])
}

export { useBAppsSwapTracking }