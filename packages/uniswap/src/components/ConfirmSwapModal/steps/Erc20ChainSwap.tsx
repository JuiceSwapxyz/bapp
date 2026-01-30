import { useTranslation } from 'react-i18next'
import { Flex, useSporeColors } from 'ui/src'
import { LinkHorizontalAlt } from 'ui/src/components/icons/LinkHorizontalAlt'
import { StepRowProps, StepRowSkeleton } from 'uniswap/src/components/ConfirmSwapModal/steps/StepRowSkeleton'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { Erc20ChainSwapStep } from 'uniswap/src/features/transactions/swap/steps/erc20ChainSwap'

const BridgeIcon = (): JSX.Element => (
  <Flex centered width="$spacing24" height="$spacing24" borderRadius="$roundedFull" backgroundColor="$DEP_blue400">
    <LinkHorizontalAlt color="$white" size="$icon.12" />
  </Flex>
)

export function Erc20ChainSwapStepRow({ status }: StepRowProps<Erc20ChainSwapStep>): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const title = {
    [StepStatus.Preview]: t('swap.bridging.title'),
    [StepStatus.Active]: t('swap.crossChain.confirmLock'),
    [StepStatus.InProgress]: t('swap.crossChain.bridging'),
    [StepStatus.Complete]: t('swap.crossChain.complete'),
  }[status]

  return <StepRowSkeleton title={title} icon={<BridgeIcon />} rippleColor={colors.DEP_blue400.val} status={status} />
}
