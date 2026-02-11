import { useTranslation } from 'react-i18next'
import { Flex, SpinningLoader, Text } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { TimePast } from 'ui/src/components/icons/TimePast'
import { Separator } from 'ui/src/components/layout/Separator'
import { iconSizes } from 'ui/src/theme'
import { LightningBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { InvoiceLikeStringDisplay } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapLdsBridge/InvoiceLikeStringDisplay'
import {
  BitcoinLikeAddressType,
  SwapEnterBitcoinLikeAddress,
} from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapLdsBridge/SwapEnterBitcoinLikeAddress'
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

interface StepItemProps {
  label: string
  status: 'pending' | 'active' | 'completed'
}

function StepItem({ label, status }: StepItemProps): JSX.Element {
  return (
    <Flex row alignItems="center" gap="$spacing8">
      {status === 'completed' ? (
        <Check size={iconSizes.icon16} color="$accent1" />
      ) : status === 'active' ? (
        <SpinningLoader size={iconSizes.icon16} color="$accent1" />
      ) : (
        <Flex width={iconSizes.icon16} height={iconSizes.icon16} alignItems="center" justifyContent="center">
          <TimePast size={iconSizes.icon12} color="$neutral3" />
        </Flex>
      )}
      <Text
        variant="body3"
        color={status === 'completed' ? '$accent1' : status === 'active' ? '$neutral1' : '$neutral3'}
      >
        {label}
      </Text>
    </Flex>
  )
}

function getStepStatus<T extends string>(
  order: T[],
  stepSubSteps: T[],
  currentSubStep: T | undefined,
): 'pending' | 'active' | 'completed' {
  if (!currentSubStep) {
    return 'pending'
  }
  const currentIndex = order.indexOf(currentSubStep)
  const stepMinIndex = Math.min(...stepSubSteps.map((s) => order.indexOf(s)))
  const stepMaxIndex = Math.max(...stepSubSteps.map((s) => order.indexOf(s)))

  if (currentIndex > stepMaxIndex) {
    return 'completed'
  }
  if (currentIndex >= stepMinIndex && currentIndex <= stepMaxIndex) {
    return 'active'
  }
  return 'pending'
}

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
