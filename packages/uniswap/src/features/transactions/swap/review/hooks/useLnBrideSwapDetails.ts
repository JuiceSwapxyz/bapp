import { isLightningBridge } from '../../utils/routing'
import { useSwapReviewTransactionStore } from '../stores/swapReviewTransactionStore/useSwapReviewTransactionStore'

export function useLnBrideSwapDetails() {
  const { derivedSwapInfo } = useSwapReviewTransactionStore((s) => ({ derivedSwapInfo: s.derivedSwapInfo }))
  
  const quote =
    (derivedSwapInfo?.trade?.trade &&
      isLightningBridge(derivedSwapInfo.trade.trade) &&
      derivedSwapInfo.trade.trade.quote.quote) ||
    {}

  return {
    quote,
    direction: quote.direction,
  }
}
