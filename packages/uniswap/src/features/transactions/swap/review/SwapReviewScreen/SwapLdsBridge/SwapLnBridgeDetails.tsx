import { Separator } from 'ui/src/components/layout/Separator'
import { LightningBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { InvoiceLikeStringDisplay } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapLdsBridge/InvoiceLikeStringDisplay'
import {
  BitcoinLikeAddressType,
  SwapEnterBitcoinLikeAddress,
} from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapLdsBridge/SwapEnterBitcoinLikeAddress'
import { useLnBrideSwapDetails } from 'uniswap/src/features/transactions/swap/review/hooks/useLnBrideSwapDetails'
import { useSwapReviewStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore'
import { LightningBridgeReverseStep } from 'uniswap/src/features/transactions/swap/steps/lightningBridge'

export function SwapLnBridgeDetails(): JSX.Element {
  const { direction } = useLnBrideSwapDetails()

  if (direction === LightningBridgeDirection.Submarine) {
    return <SubmarineLnBridgeDetails />
  }

  return <ReverseLnBridgeDetails />
}

export function SubmarineLnBridgeDetails(): JSX.Element {
  return (
    <>
      <Separator my="$spacing8" ml="$spacing12" mr="$spacing12" />
      <SwapEnterBitcoinLikeAddress
        type={BitcoinLikeAddressType.Lightning}
        placeholder="Enter a BOLT12 or LNURL"
        errorMessage="Invalid Lightning address or LNURL format"
      />
    </>
  )
}

export function ReverseLnBridgeDetails(): JSX.Element {
  const currentStep = useSwapReviewStore((s) => s.currentStep)

  const invoiceLikeString =
    currentStep?.step.type === TransactionStepType.LightningBridgeReverseStep
      ? (currentStep.step as LightningBridgeReverseStep).invoice
      : undefined

  if (!invoiceLikeString) {
    return <></>
  }

  return <InvoiceLikeStringDisplay invoiceLikeString={invoiceLikeString} />
}
