import { useCallback } from 'react'
import { fetchBridgeSwapByPreimageHash } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { EvmLockup, SomeSwap, getLdsBridgeManager, helpMeClaim, prefix0x } from 'uniswap/src/features/lds-bridge'
import { logger } from 'utilities/src/logger/logger'

export function useEvmClaim() {
  const executeClaimIndexed = useCallback(async (lockup: EvmLockup): Promise<string> => {
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
  }, [])

  const executeClaimLocal = useCallback(async (swap: SomeSwap): Promise<string> => {
    const claimedSwap = await getLdsBridgeManager().autoClaimSwap(swap)

    if (!claimedSwap.claimTx) {
      throw new Error('Claim transaction not found')
    }

    logger.info('useEvmClaim', 'executeClaimLocal', `Claim successful: ${claimedSwap.claimTx}`)
    return claimedSwap.claimTx
  }, [])

  const executeClaim = useCallback(
    async (lockup: EvmLockup): Promise<string> => {
      const swap = await fetchBridgeSwapByPreimageHash({ preimageHash: lockup.preimageHash }).catch(() => null)

      if (swap) {
        return await executeClaimLocal(swap)
      }

      return await executeClaimIndexed(lockup)
    },
    [executeClaimIndexed, executeClaimLocal],
  )

  return { executeClaim }
}
