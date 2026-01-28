import { useTranslation } from 'react-i18next'
import { Flex, useSporeColors } from 'ui/src'
import { Swap } from 'ui/src/components/icons/Swap'
import { StepRowProps, StepRowSkeleton } from 'uniswap/src/components/ConfirmSwapModal/steps/StepRowSkeleton'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import {
  Erc20ChainSwapStep,
  Erc20ChainSwapSubStep,
} from 'uniswap/src/features/transactions/swap/steps/erc20ChainSwap'

const CrossChainSwapIcon = (): JSX.Element => (
  <Flex centered width="$spacing24" height="$spacing24" borderRadius="$roundedFull" backgroundColor="$DEP_blue400">
    <Swap color="$white" size="$icon.12" />
  </Flex>
)

export function Erc20ChainSwapStepRow({ step, status }: StepRowProps<Erc20ChainSwapStep>): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const subStep = step.subStep

  // Get title based on current subStep
  const getTitle = (): string => {
    if (status === StepStatus.Preview) {
      return t('crossChainSwap.confirmSwap')
    }
    if (status === StepStatus.Complete) {
      return t('crossChainSwap.swapComplete')
    }

    // Active or InProgress - show subStep specific text
    switch (subStep) {
      case Erc20ChainSwapSubStep.CheckingAllowance:
        return t('crossChainSwap.checkingAllowance')
      case Erc20ChainSwapSubStep.WaitingForApproval:
        return t('crossChainSwap.confirmApproval')
      case Erc20ChainSwapSubStep.ApprovingToken:
        return t('crossChainSwap.approving')
      case Erc20ChainSwapSubStep.WaitingForLock:
        return t('crossChainSwap.confirmLock')
      case Erc20ChainSwapSubStep.LockingTokens:
        return t('crossChainSwap.locking')
      case Erc20ChainSwapSubStep.WaitingForBridge:
        return t('crossChainSwap.bridging')
      case Erc20ChainSwapSubStep.ClaimingTokens:
        return t('crossChainSwap.claiming')
      case Erc20ChainSwapSubStep.Complete:
        return t('crossChainSwap.swapComplete')
      default:
        return t('crossChainSwap.preparingSwap')
    }
  }

  return (
    <StepRowSkeleton title={getTitle()} icon={<CrossChainSwapIcon />} rippleColor={colors.DEP_blue400.val} status={status} />
  )
}
