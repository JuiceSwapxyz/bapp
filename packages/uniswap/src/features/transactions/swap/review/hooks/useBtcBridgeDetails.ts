import type { BridgeQuote } from 'uniswap/src/data/tradingApi/__generated__/models/BridgeQuote'
import { BitcoinBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import { useSwapReviewTransactionStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/useSwapReviewTransactionStore'
import { isBitcoinBridge } from 'uniswap/src/features/transactions/swap/utils/routing'

interface BtcBridgeDetails {
  direction: BitcoinBridgeDirection | undefined
  quote: BridgeQuote | undefined
}

export function useBtcBridgeDetails(): BtcBridgeDetails {
  const { derivedSwapInfo } = useSwapReviewTransactionStore((s) => ({ derivedSwapInfo: s.derivedSwapInfo }))

  const trade = derivedSwapInfo.trade.trade
  if (!trade || !isBitcoinBridge(trade)) {
    return { direction: undefined, quote: undefined }
  }

  const quote = trade.quote.quote as BridgeQuote
  const direction = quote.direction as BitcoinBridgeDirection

  return {
    direction,
    quote,
  }
}
