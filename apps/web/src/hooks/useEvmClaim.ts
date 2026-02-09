import { useCallback } from 'react'
import { EvmLockup, getLdsBridgeManager, helpMeClaim, prefix0x } from 'uniswap/src/features/lds-bridge'
import { logger } from 'utilities/src/logger/logger'

export function useEvmClaim() {
  const executeClaimIndexed = useCallback(async (lockup: EvmLockup): Promise<string> => {
    try {
      const preimage = lockup.knownPreimage?.preimage
      if (!preimage) {
        throw new Error('Preimage not found')
      }
      const { txHash } = await helpMeClaim({
        preimage: prefix0x(preimage),
        preimageHash: prefix0x(lockup.preimageHash),
        chainId: Number(lockup.chainId),
      })

      return txHash
    } catch (error) {
      logger.error(error, { tags: { file: 'useEvmClaim', function: 'executeClaimIndexed' } })
      throw error
    }
  }, [])

  const executeClaimLocal = useCallback(async (lockup: EvmLockup): Promise<string> => {
    try {
      const swaps = await getLdsBridgeManager().getSwaps()
      const localSwap = Object.entries(swaps).find(
        ([, swap]) => prefix0x(swap.preimageHash) === prefix0x(lockup.preimageHash),
      )

      if (!localSwap) {
        throw new Error('Swap not found in local storage')
      }

      const [swapId] = localSwap

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

  const executeClaim = useCallback(async (lockup: EvmLockup): Promise<string> => {
    try {
      return await executeClaimLocal(lockup)
    } catch (error) {
      logger.error(error, { tags: { file: 'useEvmClaim', function: 'executeClaim' } })
      return await executeClaimIndexed(lockup)
    }
  }, [])

  return { executeClaim }
}
