import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { WbtcBridgeDirection } from 'uniswap/src/data/apiClients/tradingApi/utils/isBitcoinBridge'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { getStepStatus, StepItem } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapLdsBridge/StepItem'
import { useSwapReviewStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore'
import { useSwapReviewTransactionStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/useSwapReviewTransactionStore'
import { WbtcBridgeStep, WbtcBridgeSubStep } from 'uniswap/src/features/transactions/swap/steps/wbtcBridge'

const SUB_STEP_ORDER = [
  WbtcBridgeSubStep.CheckingAllowance,
  WbtcBridgeSubStep.WaitingForApproval,
  WbtcBridgeSubStep.ApprovingToken,
  WbtcBridgeSubStep.WaitingForLock,
  WbtcBridgeSubStep.LockingTokens,
  WbtcBridgeSubStep.WaitingForBridge,
  WbtcBridgeSubStep.ClaimingTokens,
  WbtcBridgeSubStep.Complete,
]

export function SwapWbtcBridgeDetails(): JSX.Element | null {
  const { t } = useTranslation()
  const trade = useSwapReviewTransactionStore((s) => s.trade)
  const currentStep = useSwapReviewStore((s) => s.currentStep)

  const step =
    currentStep?.step.type === TransactionStepType.WbtcBridgeStep ? (currentStep.step as WbtcBridgeStep) : null
  const subStep = step?.subStep
  const direction = (trade?.quote?.quote as { direction?: WbtcBridgeDirection })?.direction
  const showApprove = direction === WbtcBridgeDirection.EthereumToCitrea

  const approveSubSteps = [
    WbtcBridgeSubStep.CheckingAllowance,
    WbtcBridgeSubStep.WaitingForApproval,
    WbtcBridgeSubStep.ApprovingToken,
  ]
  const lockSubSteps = [WbtcBridgeSubStep.WaitingForLock, WbtcBridgeSubStep.LockingTokens]
  const bridgeSubSteps = [WbtcBridgeSubStep.WaitingForBridge]
  const claimSubSteps = [WbtcBridgeSubStep.ClaimingTokens, WbtcBridgeSubStep.Complete]

  const status = (steps: WbtcBridgeSubStep[]) => getStepStatus(SUB_STEP_ORDER, steps, subStep)

  return (
    <Flex gap="$spacing12" px="$spacing12" py="$spacing8">
      <Flex gap="$spacing8" pl="$spacing4">
        {showApprove && (
          <StepItem label={t('swap.crossChain.step.approve')} status={status(approveSubSteps)} />
        )}
        <StepItem label={t('swap.crossChain.step.lock')} status={status(lockSubSteps)} />
        <StepItem label={t('swap.crossChain.step.bridge')} status={status(bridgeSubSteps)} />
        <StepItem label={t('swap.crossChain.step.claim')} status={status(claimSubSteps)} />
      </Flex>
    </Flex>
  )
}
