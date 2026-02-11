import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { getStepStatus, StepItem } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapLdsBridge/StepItem'
import { useSwapReviewStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore'
import {
  Erc20ChainSwapStep,
  Erc20ChainSwapSubStep,
} from 'uniswap/src/features/transactions/swap/steps/erc20ChainSwap'

const SUB_STEP_ORDER = [
  Erc20ChainSwapSubStep.CheckingAuth,
  Erc20ChainSwapSubStep.WaitingForAuth,
  Erc20ChainSwapSubStep.Authenticating,
  Erc20ChainSwapSubStep.CheckingAllowance,
  Erc20ChainSwapSubStep.WaitingForApproval,
  Erc20ChainSwapSubStep.ApprovingToken,
  Erc20ChainSwapSubStep.WaitingForLock,
  Erc20ChainSwapSubStep.LockingTokens,
  Erc20ChainSwapSubStep.WaitingForBridge,
  Erc20ChainSwapSubStep.ClaimingTokens,
  Erc20ChainSwapSubStep.Complete,
]

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
  
  const authSubSteps = [
    Erc20ChainSwapSubStep.CheckingAuth,
    Erc20ChainSwapSubStep.WaitingForAuth,
    Erc20ChainSwapSubStep.Authenticating,
  ]
  
  const approveSubSteps = [
    Erc20ChainSwapSubStep.CheckingAllowance,
    Erc20ChainSwapSubStep.WaitingForApproval,
    Erc20ChainSwapSubStep.ApprovingToken,
  ]
  const lockSubSteps = [Erc20ChainSwapSubStep.WaitingForLock, Erc20ChainSwapSubStep.LockingTokens]
  const bridgeSubSteps = [Erc20ChainSwapSubStep.WaitingForBridge]
  const claimSubSteps = [Erc20ChainSwapSubStep.ClaimingTokens, Erc20ChainSwapSubStep.Complete]

  const status = (steps: Erc20ChainSwapSubStep[]) => getStepStatus(SUB_STEP_ORDER, steps, subStep)

  const authStatus = status(authSubSteps)
  const approveStatus = status(approveSubSteps)
  const lockStatus = status(lockSubSteps)
  const bridgeStatus = status(bridgeSubSteps)
  const claimStatus = status(claimSubSteps)

  return (
    <Flex gap="$spacing12" px="$spacing12" py="$spacing8">
      <Flex gap="$spacing8" pl="$spacing4">
      <StepItem label={t('swap.crossChain.step.authorize')} status={authStatus} />
        <StepItem label={t('swap.crossChain.step.approve')} status={approveStatus} />
        <StepItem label={t('swap.crossChain.step.lock')} status={lockStatus} />
        <StepItem label={t('swap.crossChain.step.bridge')} status={bridgeStatus} />
        <StepItem label={t('swap.crossChain.step.claim')} status={claimStatus} />
      </Flex>
    </Flex>
  )
}
