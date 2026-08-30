import type { Address } from 'viem'
import { buildJusdDirectPoolSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/directPool/directPoolSwapTxAndGasInfo'
import type {
  SwapTxAndGasInfoParameters,
  SwapTxAndGasInfoService,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import type { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { JusdDirectPoolTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { getJusdRouterAllowance } from 'uniswap/src/features/transactions/swap/utils/jusdDirectPool'

/**
 * Direct-pool swap service — handles the client-side JUSD-sell fallback. Unlike the Satsuma/Gateway
 * services it makes NO api call: the swap calldata is built locally from the trade's on-chain quote
 * (see directPoolSwapTxAndGasInfo), and slippage comes from the quote itself (baked from the user's
 * live setting at getTrade time). The only network read here is the JUSD→SwapRouter02 allowance,
 * used to decide whether an approve step is needed.
 */
export function createDirectPoolSwapTxAndGasInfoService(): SwapTxAndGasInfoService<JusdDirectPoolTrade> {
  const service: SwapTxAndGasInfoService<JusdDirectPoolTrade> = {
    async getSwapTxAndGasInfo(params: SwapTxAndGasInfoParameters<JusdDirectPoolTrade>): Promise<SwapTxAndGasInfo> {
      const { trade } = params
      const owner = trade.quote.quote.swapper

      // If the wallet isn't connected yet the swapper is an empty placeholder; treat as no allowance
      // so the review screen shows the approve step until the real account re-quotes.
      const allowance = owner ? await getJusdRouterAllowance(owner as Address) : BigInt(0)

      return buildJusdDirectPoolSwapTxAndGasInfo({ trade, allowance })
    },
  }

  return service
}
