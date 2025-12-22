import { Separator } from 'ui/src/components/layout/Separator'
import { BitcoinBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import { InvoiceLikeStringDisplay } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapLdsBridge/InvoiceLikeStringDisplay'
import {
  BitcoinLikeAddressType,
  SwapEnterBitcoinLikeAddress,
} from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapLdsBridge/SwapEnterBitcoinLikeAddress'
import { useBtcBridgeDetails } from 'uniswap/src/features/transactions/swap/review/hooks/useBtcBridgeDetails'
import { useSwapReviewStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore'
import { BitcoinBridgeBitcoinToCitreaStep } from 'uniswap/src/features/transactions/swap/steps/bitcoinBridge'

export function SwapBtcBridgeDetails(): JSX.Element {
  const { direction } = useBtcBridgeDetails()
  const currentStep = useSwapReviewStore((s) => s.currentStep)

  if (direction === BitcoinBridgeDirection.BitcoinToCitrea) {
    const bip21 = (currentStep?.step as BitcoinBridgeBitcoinToCitreaStep).bip21

    if (!bip21) {
      return <></>
    }

    return <InvoiceLikeStringDisplay invoiceLikeString={bip21} />
  }

  return (
    <>
      <Separator my="$spacing8" ml="$spacing12" mr="$spacing12" />
      <SwapEnterBitcoinLikeAddress
        type={BitcoinLikeAddressType.Bitcoin}
        placeholder="Enter a Bitcoin address"
        errorMessage="Invalid Bitcoin address format"
      />
    </>
  )
}
