import { useCallback } from 'react'
import { fetchBridgeSwapByPreimageHash } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { EvmLockup, SomeSwap, getLdsBridgeManager, helpMeClaim, prefix0x } from 'uniswap/src/features/lds-bridge'

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
    const { txHash, success } = await getLdsBridgeManager().autoClaimSwap(swap)

    if (txHash && success) {
      return txHash
    }

    throw new Error('Claim failed')
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
