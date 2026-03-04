import { useCallback } from 'react'
import { fetchBridgeSwapByPreimageHash } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import {
  EvmLockup,
  HelpMeClaimResponse,
  SomeSwap,
  getLdsBridgeManager,
  helpMeClaim,
  prefix0x,
} from 'uniswap/src/features/lds-bridge'

export function useEvmClaim() {
  const executeClaimIndexed = useCallback(async (lockup: EvmLockup): Promise<HelpMeClaimResponse> => {
    const preimage = lockup.knownPreimage?.preimage
    if (!preimage) {
      throw new Error('Preimage not found')
    }
    return helpMeClaim({
      preimage: prefix0x(preimage),
      preimageHash: prefix0x(lockup.preimageHash),
      chainId: Number(lockup.chainId),
    })
  }, [])

  const executeClaimLocal = useCallback(async (swap: SomeSwap): Promise<HelpMeClaimResponse> => {
    const claimResponse = await getLdsBridgeManager().autoClaimSwap(swap)
    return claimResponse
  }, [])

  const executeClaim = useCallback(
    async (lockup: EvmLockup): Promise<HelpMeClaimResponse> => {
      const swap = await fetchBridgeSwapByPreimageHash({ preimageHash: lockup.preimageHash }).catch(() => null)

      if (swap) {
        return executeClaimLocal(swap)
      }

      return executeClaimIndexed(lockup)
    },
    [executeClaimIndexed, executeClaimLocal],
  )

  return { executeClaim }
}
