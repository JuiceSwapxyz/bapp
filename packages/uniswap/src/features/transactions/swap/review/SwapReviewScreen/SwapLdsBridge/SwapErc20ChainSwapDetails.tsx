import { useTranslation } from 'react-i18next'
import { Flex, SpinningLoader, Text } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { TimePast } from 'ui/src/components/icons/TimePast'
import { iconSizes } from 'ui/src/theme'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { useSwapReviewStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore'
import {
  Erc20ChainSwapStep,
  Erc20ChainSwapSubStep,
} from 'uniswap/src/features/transactions/swap/steps/erc20ChainSwap'

const SUB_STEP_ORDER = [
  Erc20ChainSwapSubStep.CheckingAllowance,
  Erc20ChainSwapSubStep.WaitingForApproval,
  Erc20ChainSwapSubStep.ApprovingToken,
  Erc20ChainSwapSubStep.WaitingForLock,
  Erc20ChainSwapSubStep.LockingTokens,
  Erc20ChainSwapSubStep.WaitingForBridge,
  Erc20ChainSwapSubStep.ClaimingTokens,
  Erc20ChainSwapSubStep.Complete,
]

function getSubStepIndex(subStep: Erc20ChainSwapSubStep | undefined): number {
  if (!subStep) {
    return -1
  }
  return SUB_STEP_ORDER.indexOf(subStep)
}

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

function getStepStatus(
  stepSubSteps: Erc20ChainSwapSubStep[],
  currentSubStep: Erc20ChainSwapSubStep | undefined,
): 'pending' | 'active' | 'completed' {
  if (!currentSubStep) {
    return 'pending'
  }
  const currentIndex = getSubStepIndex(currentSubStep)
  const stepMinIndex = Math.min(...stepSubSteps.map(getSubStepIndex))
  const stepMaxIndex = Math.max(...stepSubSteps.map(getSubStepIndex))

  if (currentIndex > stepMaxIndex) {
    return 'completed'
  }
  if (currentIndex >= stepMinIndex && currentIndex <= stepMaxIndex) {
    return 'active'
  }
  return 'pending'
}

export function SwapErc20ChainSwapDetails(): JSX.Element | null {
  const { t } = useTranslation()
  const currentStep = useSwapReviewStore((s) => s.currentStep)

  const subStep =
    currentStep?.step.type === TransactionStepType.Erc20ChainSwapStep
      ? (currentStep.step as Erc20ChainSwapStep).subStep
      : undefined

  // Group substeps into logical UI steps:
  // 1. Approve (CheckingAllowance, WaitingForApproval, ApprovingToken)
  // 2. Lock (WaitingForLock, LockingTokens)
  // 3. Bridge (WaitingForBridge)
  // 4. Claim (ClaimingTokens, Complete)

  const approveSubSteps = [
    Erc20ChainSwapSubStep.CheckingAllowance,
    Erc20ChainSwapSubStep.WaitingForApproval,
    Erc20ChainSwapSubStep.ApprovingToken,
  ]
  const lockSubSteps = [Erc20ChainSwapSubStep.WaitingForLock, Erc20ChainSwapSubStep.LockingTokens]
  const bridgeSubSteps = [Erc20ChainSwapSubStep.WaitingForBridge]
  const claimSubSteps = [Erc20ChainSwapSubStep.ClaimingTokens, Erc20ChainSwapSubStep.Complete]

  const approveStatus = getStepStatus(approveSubSteps, subStep)
  const lockStatus = getStepStatus(lockSubSteps, subStep)
  const bridgeStatus = getStepStatus(bridgeSubSteps, subStep)
  const claimStatus = getStepStatus(claimSubSteps, subStep)

  // Detailed status text based on current substep
  let statusText = t('swap.crossChain.preparing')
  if (subStep) {
    switch (subStep) {
      case Erc20ChainSwapSubStep.CheckingAllowance:
        statusText = t('swap.crossChain.checkingAllowance')
        break
      case Erc20ChainSwapSubStep.WaitingForApproval:
        statusText = t('swap.crossChain.confirmApproval')
        break
      case Erc20ChainSwapSubStep.ApprovingToken:
        statusText = t('swap.crossChain.approving')
        break
      case Erc20ChainSwapSubStep.WaitingForLock:
        statusText = t('swap.crossChain.step.lock')
        break
      case Erc20ChainSwapSubStep.LockingTokens:
        statusText = t('swap.crossChain.locking')
        break
      case Erc20ChainSwapSubStep.WaitingForBridge:
        statusText = t('swap.crossChain.bridging')
        break
      case Erc20ChainSwapSubStep.ClaimingTokens:
        statusText = t('swap.crossChain.claiming')
        break
      case Erc20ChainSwapSubStep.Complete:
        statusText = t('swap.crossChain.complete')
        break
    }
  }

  return (
    <Flex gap="$spacing12" px="$spacing12" py="$spacing8">
      <Flex row alignItems="center" gap="$spacing8">
        <SpinningLoader size={iconSizes.icon20} color="$accent1" />
        <Text variant="body2" color="$neutral1">
          {statusText}
        </Text>
      </Flex>

      <Flex gap="$spacing8" pl="$spacing4">
        <StepItem label={t('swap.crossChain.step.approve')} status={approveStatus} />
        <StepItem label={t('swap.crossChain.step.lock')} status={lockStatus} />
        <StepItem label={t('swap.crossChain.step.bridge')} status={bridgeStatus} />
        <StepItem label={t('swap.crossChain.step.claim')} status={claimStatus} />
      </Flex>
    </Flex>
  )
}
