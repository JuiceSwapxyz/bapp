import { useTranslation } from 'react-i18next'
import { Flex, SpinningLoader, Text } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { TimePast } from 'ui/src/components/icons/TimePast'
import { Separator } from 'ui/src/components/layout/Separator'
import { iconSizes } from 'ui/src/theme'
import { BitcoinBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { InvoiceLikeStringDisplay } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapLdsBridge/InvoiceLikeStringDisplay'
import {
  BitcoinLikeAddressType,
  SwapEnterBitcoinLikeAddress,
} from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapLdsBridge/SwapEnterBitcoinLikeAddress'
import { useBtcBridgeDetails } from 'uniswap/src/features/transactions/swap/review/hooks/useBtcBridgeDetails'
import { useSwapReviewStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore'
import {
  BitcoinBridgeBitcoinToCitreaStep,
  BitcoinBridgeCitreaToBitcoinStep,
  BtcToCitreaSubStep,
  CitreaToBtcSubStep,
} from 'uniswap/src/features/transactions/swap/steps/bitcoinBridge'

const BTC_TO_CITREA_ORDER = [
  BtcToCitreaSubStep.CheckingAuth,
  BtcToCitreaSubStep.WaitingForAuth,
  BtcToCitreaSubStep.Authenticating,
  BtcToCitreaSubStep.ShowingInvoice,
  BtcToCitreaSubStep.WaitingForMempool,
  BtcToCitreaSubStep.Claiming,
  BtcToCitreaSubStep.Complete,
]

const CITREA_TO_BTC_ORDER = [
  CitreaToBtcSubStep.CheckingAuth,
  CitreaToBtcSubStep.WaitingForAuth,
  CitreaToBtcSubStep.Authenticating,
  CitreaToBtcSubStep.LockingTokens,
  CitreaToBtcSubStep.WaitingForBridge,
  CitreaToBtcSubStep.ClaimingBtc,
  CitreaToBtcSubStep.Complete,
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

function BtcToCitreaSteps({ subStep }: { subStep: BtcToCitreaSubStep | undefined }): JSX.Element | null {
  const { t } = useTranslation()

  const authSubSteps = [
    BtcToCitreaSubStep.CheckingAuth,
    BtcToCitreaSubStep.WaitingForAuth,
    BtcToCitreaSubStep.Authenticating,
  ]
  const invoiceSubSteps = [BtcToCitreaSubStep.ShowingInvoice]
  const lockSubSteps = [BtcToCitreaSubStep.WaitingForMempool]
  const claimSubSteps = [BtcToCitreaSubStep.Claiming, BtcToCitreaSubStep.Complete]

  const status = (steps: BtcToCitreaSubStep[]) => getStepStatus(BTC_TO_CITREA_ORDER, steps, subStep)

  // Hide steps while showing the invoice
  if (subStep === BtcToCitreaSubStep.ShowingInvoice) {
    return null
  }

  return (
    <Flex gap="$spacing12" px="$spacing12" py="$spacing8">
      <Flex gap="$spacing8" pl="$spacing4">
        <StepItem label={t('swap.crossChain.step.authorize')} status={status(authSubSteps)} />
        <StepItem label={t('swap.crossChain.step.invoice')} status={status(invoiceSubSteps)} />
        <StepItem label={t('swap.crossChain.step.lock')} status={status(lockSubSteps)} />
        <StepItem label={t('swap.crossChain.step.claim')} status={status(claimSubSteps)} />
      </Flex>
    </Flex>
  )
}

function CitreaToBtcSteps({ subStep }: { subStep: CitreaToBtcSubStep | undefined }): JSX.Element | null {
  const { t } = useTranslation()

  const authSubSteps = [
    CitreaToBtcSubStep.CheckingAuth,
    CitreaToBtcSubStep.WaitingForAuth,
    CitreaToBtcSubStep.Authenticating,
  ]
  const lockSubSteps = [CitreaToBtcSubStep.LockingTokens]
  const bridgeSubSteps = [CitreaToBtcSubStep.WaitingForBridge]
  const claimSubSteps = [CitreaToBtcSubStep.ClaimingBtc, CitreaToBtcSubStep.Complete]

  const status = (steps: CitreaToBtcSubStep[]) => getStepStatus(CITREA_TO_BTC_ORDER, steps, subStep)

  return (
    <Flex gap="$spacing12" px="$spacing12" py="$spacing8">
      <Flex gap="$spacing8" pl="$spacing4">
        <StepItem label={t('swap.crossChain.step.authorize')} status={status(authSubSteps)} />
        <StepItem label={t('swap.crossChain.step.lock')} status={status(lockSubSteps)} />
        <StepItem label={t('swap.crossChain.step.bridge')} status={status(bridgeSubSteps)} />
        <StepItem label={t('swap.crossChain.step.claim')} status={status(claimSubSteps)} />
      </Flex>
    </Flex>
  )
}

export function SwapBtcBridgeDetails(): JSX.Element {
  const { direction } = useBtcBridgeDetails()
  const currentStep = useSwapReviewStore((s) => s.currentStep)

  if (direction === BitcoinBridgeDirection.BitcoinToCitrea) {
    const btcStep =
      currentStep?.step.type === TransactionStepType.BitcoinBridgeBitcoinToCitreaStep
        ? (currentStep.step as BitcoinBridgeBitcoinToCitreaStep)
        : undefined

    const subStep = btcStep?.subStep
    const bip21 = btcStep?.bip21

    // During invoice step, show the bip21 invoice
    if (subStep === BtcToCitreaSubStep.ShowingInvoice && bip21) {
      return <InvoiceLikeStringDisplay invoiceLikeString={bip21} />
    }

    return <BtcToCitreaSteps subStep={subStep} />
  }

  // CitreaToBitcoin direction
  const c2bStep =
    currentStep?.step.type === TransactionStepType.BitcoinBridgeCitreaToBitcoinStep
      ? (currentStep.step as BitcoinBridgeCitreaToBitcoinStep)
      : undefined

  const c2bSubStep = c2bStep?.subStep

  // Show address input before the swap starts (no subStep yet)
  if (!c2bSubStep) {
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

  return <CitreaToBtcSteps subStep={c2bSubStep} />
}
