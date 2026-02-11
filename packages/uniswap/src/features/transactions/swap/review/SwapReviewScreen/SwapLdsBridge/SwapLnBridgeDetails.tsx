import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { Separator } from 'ui/src/components/layout/Separator'
import { LightningBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { InvoiceLikeStringDisplay } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapLdsBridge/InvoiceLikeStringDisplay'
import {
  BitcoinLikeAddressType,
  SwapEnterBitcoinLikeAddress,
} from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapLdsBridge/SwapEnterBitcoinLikeAddress'
import { getStepStatus, StepItem } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapLdsBridge/StepItem'
import { useLnBrideSwapDetails } from 'uniswap/src/features/transactions/swap/review/hooks/useLnBrideSwapDetails'
import { useSwapReviewStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore'
import {
  LightningBridgeReverseStep,
  LightningBridgeSubmarineStep,
  LnReverseSubStep,
  LnSubmarineSubStep,
} from 'uniswap/src/features/transactions/swap/steps/lightningBridge'

const LN_SUBMARINE_ORDER = [
  LnSubmarineSubStep.CheckingAuth,
  LnSubmarineSubStep.WaitingForAuth,
  LnSubmarineSubStep.Authenticating,
  LnSubmarineSubStep.LockingTokens,
  LnSubmarineSubStep.WaitingForBridge,
  LnSubmarineSubStep.Complete,
]

const LN_REVERSE_ORDER = [
  LnReverseSubStep.CheckingAuth,
  LnReverseSubStep.WaitingForAuth,
  LnReverseSubStep.Authenticating,
  LnReverseSubStep.ShowingInvoice,
  LnReverseSubStep.Claiming,
  LnReverseSubStep.Complete,
]

function LnReverseSteps({ subStep }: { subStep: LnReverseSubStep | undefined }): JSX.Element | null {
  const { t } = useTranslation()

  const authSubSteps = [
    LnReverseSubStep.CheckingAuth,
    LnReverseSubStep.WaitingForAuth,
    LnReverseSubStep.Authenticating,
  ]
  const invoiceSubSteps = [LnReverseSubStep.ShowingInvoice]
  const claimSubSteps = [LnReverseSubStep.Claiming, LnReverseSubStep.Complete]

  const status = (steps: LnReverseSubStep[]) => getStepStatus(LN_REVERSE_ORDER, steps, subStep)

  // Hide steps while showing the invoice
  if (subStep === LnReverseSubStep.ShowingInvoice) {
    return null
  }

  return (
    <Flex gap="$spacing12" px="$spacing12" py="$spacing8">
      <Flex gap="$spacing8" pl="$spacing4">
        <StepItem label={t('swap.crossChain.step.authorize')} status={status(authSubSteps)} />
        <StepItem label={t('swap.crossChain.step.invoice')} status={status(invoiceSubSteps)} />
        <StepItem label={t('swap.crossChain.step.claim')} status={status(claimSubSteps)} />
      </Flex>
    </Flex>
  )
}

export function SwapLnBridgeDetails(): JSX.Element {
  const { direction } = useLnBrideSwapDetails()

  if (direction === LightningBridgeDirection.Submarine) {
    return <SubmarineLnBridgeDetails />
  }

  return <ReverseLnBridgeDetails />
}

function LnSubmarineSteps({ subStep }: { subStep: LnSubmarineSubStep | undefined }): JSX.Element {
  const { t } = useTranslation()

  const authSubSteps = [
    LnSubmarineSubStep.CheckingAuth,
    LnSubmarineSubStep.WaitingForAuth,
    LnSubmarineSubStep.Authenticating,
  ]
  const lockSubSteps = [LnSubmarineSubStep.LockingTokens]
  const bridgeSubSteps = [LnSubmarineSubStep.WaitingForBridge, LnSubmarineSubStep.Complete]

  const status = (steps: LnSubmarineSubStep[]) => getStepStatus(LN_SUBMARINE_ORDER, steps, subStep)

  return (
    <Flex gap="$spacing12" px="$spacing12" py="$spacing8">
      <Flex gap="$spacing8" pl="$spacing4">
        <StepItem label={t('swap.crossChain.step.authorize')} status={status(authSubSteps)} />
        <StepItem label={t('swap.crossChain.step.lock')} status={status(lockSubSteps)} />
        <StepItem label={t('swap.crossChain.step.bridge')} status={status(bridgeSubSteps)} />
      </Flex>
    </Flex>
  )
}

export function SubmarineLnBridgeDetails(): JSX.Element {
  const currentStep = useSwapReviewStore((s) => s.currentStep)

  const subStep =
    currentStep?.step.type === TransactionStepType.LightningBridgeSubmarineStep
      ? (currentStep.step as LightningBridgeSubmarineStep).subStep
      : undefined

  // Show address input before the swap starts
  if (!subStep) {
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

  return <LnSubmarineSteps subStep={subStep} />
}

export function ReverseLnBridgeDetails(): JSX.Element {
  const currentStep = useSwapReviewStore((s) => s.currentStep)

  const lnStep =
    currentStep?.step.type === TransactionStepType.LightningBridgeReverseStep
      ? (currentStep.step as LightningBridgeReverseStep)
      : undefined

  const subStep = lnStep?.subStep
  const invoice = lnStep?.invoice

  // During invoice step, show the lightning invoice
  if (subStep === LnReverseSubStep.ShowingInvoice && invoice) {
    return <InvoiceLikeStringDisplay invoiceLikeString={invoice} />
  }

  // For other steps, show the step progress
  return <LnReverseSteps subStep={subStep} />
}
