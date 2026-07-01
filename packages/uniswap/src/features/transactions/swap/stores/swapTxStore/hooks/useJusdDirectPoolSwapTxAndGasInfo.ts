import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { Address } from 'viem'
import { buildJusdDirectPoolSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/directPool/directPoolSwapTxAndGasInfo'
import type { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { JusdDirectPoolTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { getJusdRouterAllowance } from 'uniswap/src/features/transactions/swap/utils/jusdDirectPool'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

/**
 * Legacy-path equivalent of `createDirectPoolSwapTxAndGasInfoService`. Reads the JUSD→SwapRouter02
 * allowance on-chain, then builds the direct-pool swap tx (+ approve, if needed) entirely locally.
 * Slippage comes from the trade's quote (baked from the user's live setting at getTrade time), so
 * this path and the service path produce identical `amountOutMinimum`. Returns `undefined` when
 * `trade` is not a direct-pool trade so the caller can fall through.
 */
export function useJusdDirectPoolSwapTxAndGasInfo(trade: JusdDirectPoolTrade | undefined): SwapTxAndGasInfo | undefined {
  const owner = trade?.quote.quote.swapper as Address | undefined

  const { data: allowance } = useQuery({
    queryKey: ['jusdDirectPoolAllowance', owner, trade?.quote.quote.amountIn],
    queryFn: async (): Promise<string> => {
      if (!owner) {
        return '0'
      }
      const value = await getJusdRouterAllowance(owner)
      return value.toString()
    },
    enabled: Boolean(trade && owner),
    staleTime: 15 * ONE_SECOND_MS,
    gcTime: 60 * ONE_SECOND_MS,
  })

  return useMemo(() => {
    if (!trade) {
      return undefined
    }
    // Until the allowance read resolves, assume none so the review screen shows the approve step
    // rather than a swap that would revert; it re-renders once the real allowance arrives.
    const allowanceValue = allowance ? BigInt(allowance) : BigInt(0)
    return buildJusdDirectPoolSwapTxAndGasInfo({ trade, allowance: allowanceValue })
  }, [trade, allowance])
}
