import type { BridgeQuote } from 'uniswap/src/data/tradingApi/__generated__/models/BridgeQuote'
import type { LightningBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import { useSwapReviewTransactionStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/useSwapReviewTransactionStore'
import { isLightningBridge } from 'uniswap/src/features/transactions/swap/utils/routing'

interface LnBridgeSwapDetails {
  quote: BridgeQuote | undefined
  direction: LightningBridgeDirection | undefined
}

export function useLnBrideSwapDetails(): LnBridgeSwapDetails {
  const { derivedSwapInfo } = useSwapReviewTransactionStore((s) => ({ derivedSwapInfo: s.derivedSwapInfo }))

  const trade = derivedSwapInfo.trade.trade
  if (!trade || !isLightningBridge(trade)) {
    return { quote: undefined, direction: undefined }
  }

  const quote = trade.quote.quote as BridgeQuote

  return {
    quote,
    direction: quote.direction,
  }
}
