import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { TimePast } from 'ui/src/components/icons/TimePast'
import { SpinningLoader } from 'ui/src/loading/SpinningLoader'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { useSwapReviewStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore'
import {
  Erc20ChainSwapStep,
  Erc20ChainSwapSubStep,
} from 'uniswap/src/features/transactions/swap/steps/erc20ChainSwap'

const STEPS = [
  Erc20ChainSwapSubStep.WaitingForApproval,
  Erc20ChainSwapSubStep.WaitingForLock,
  Erc20ChainSwapSubStep.WaitingForBridge,
  Erc20ChainSwapSubStep.ClaimingTokens,
] as const

function getStepIndex(subStep: Erc20ChainSwapSubStep | undefined): number {
  if (!subStep) {
    return 0
  }
  switch (subStep) {
    case Erc20ChainSwapSubStep.CheckingAllowance:
    case Erc20ChainSwapSubStep.WaitingForApproval:
    case Erc20ChainSwapSubStep.ApprovingToken:
      return 0
    case Erc20ChainSwapSubStep.WaitingForLock:
    case Erc20ChainSwapSubStep.LockingTokens:
      return 1
    case Erc20ChainSwapSubStep.WaitingForBridge:
      return 2
    case Erc20ChainSwapSubStep.ClaimingTokens:
      return 3
    case Erc20ChainSwapSubStep.Complete:
      return 4
    default:
      return 0
  }
}

function StepIcon({ isComplete, isActive }: { isComplete: boolean; isActive: boolean }): JSX.Element {
  if (isComplete) {
    return <Check size={16} color="$statusSuccess" />
  }
  if (isActive) {
    return <SpinningLoader size={16} color="$accent1" />
  }
  return <TimePast size={16} color="$neutral3" />
}

function StepRow({
  label,
  isComplete,
  isActive,
}: {
  label: string
  isComplete: boolean
  isActive: boolean
}): JSX.Element {
  return (
    <Flex row alignItems="center" gap="$spacing8" py="$spacing4">
      <StepIcon isComplete={isComplete} isActive={isActive} />
      <Text
        variant="body3"
        color={isComplete ? '$statusSuccess' : isActive ? '$neutral1' : '$neutral3'}
        fontWeight={isActive ? '600' : '400'}
      >
        {label}
      </Text>
    </Flex>
  )
}

export function SwapErc20ChainSwapDetails(): JSX.Element {
  const { t } = useTranslation()
  const currentStep = useSwapReviewStore((s) => s.currentStep)

  const subStep =
    currentStep?.step.type === TransactionStepType.Erc20ChainSwapStep
      ? (currentStep.step as Erc20ChainSwapStep).subStep
      : undefined

  const currentStepIndex = getStepIndex(subStep)
  const isComplete = subStep === Erc20ChainSwapSubStep.Complete

  const stepLabels = [
    t('crossChainSwap.step.approve'),
    t('crossChainSwap.step.lock'),
    t('crossChainSwap.step.bridge'),
    t('crossChainSwap.step.claim'),
  ]

  return (
    <Flex px="$spacing12" py="$spacing8" gap="$spacing4">
      <Text variant="body2" color="$neutral2" mb="$spacing8">
        {t('crossChainSwap.title')}
      </Text>
      {STEPS.map((_, index) => (
        <StepRow
          key={index}
          label={stepLabels[index] ?? ''}
          isComplete={isComplete || currentStepIndex > index}
          isActive={!isComplete && currentStepIndex === index}
        />
      ))}
    </Flex>
  )
}
