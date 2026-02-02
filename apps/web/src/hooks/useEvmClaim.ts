import { useCallback } from 'react'
import { EvmLockup, getLdsBridgeManager, prefix0x } from 'uniswap/src/features/lds-bridge'
import { logger } from 'utilities/src/logger/logger'

export function useEvmClaim() {
  const executeClaim = useCallback(async (lockup: EvmLockup): Promise<string> => {
    try {
      // Get local swap to retrieve swap ID
      const swaps = await getLdsBridgeManager().getSwaps()
      const localSwap = Object.entries(swaps).find(
        ([, swap]) => prefix0x(swap.preimageHash) === prefix0x(lockup.preimageHash)
      )

      if (!localSwap) {
        throw new Error('Swap not found in local storage')
      }

      const [swapId] = localSwap

      // Use autoClaimSwap which handles ponder confirmation and claim
      const claimedSwap = await getLdsBridgeManager().autoClaimSwap(swapId)

      if (!claimedSwap.claimTx) {
        throw new Error('Claim transaction not found')
      }

      logger.info('useEvmClaim', 'executeClaim', `Claim successful: ${claimedSwap.claimTx}`)
      return claimedSwap.claimTx
    } catch (error) {
      logger.error(error, { tags: { file: 'useEvmClaim', function: 'executeClaim' } })
      throw error
    }
  }, [])

  return { executeClaim }
}
