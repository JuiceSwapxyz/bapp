import { useTranslation } from 'react-i18next'
import { Flex, IconButton, Text, TouchableArea } from 'ui/src'
import { Clock } from 'ui/src/components/icons/Clock'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { X } from 'ui/src/components/icons/X'
import { WarningModalContent } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionModalInnerContainer } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useSwapReviewStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore'
import { useSwapReviewTransactionStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/useSwapReviewTransactionStore'
import { getClaimPendingStep } from 'uniswap/src/features/transactions/swap/steps/claimPendingUtils'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { isWeb } from 'utilities/src/platform'

interface SwapClaimPendingScreenProps {
  onClose: () => void
}

export function SwapClaimPendingScreen({ onClose }: SwapClaimPendingScreenProps): JSX.Element {
  const { t } = useTranslation()
  const { bottomSheetViewStyles } = useTransactionModalContext()
  const { navigateToBridgesSwaps } = useUniswapContext()

  const currentStep = useSwapReviewStore((s) => s.currentStep)
  const acceptedDerivedSwapInfo = useSwapReviewTransactionStore((s) => s.acceptedDerivedSwapInfo)

  const pendingStep = getClaimPendingStep(currentStep)
  const toChainId = acceptedDerivedSwapInfo?.trade.trade?.outputAmount.currency.chainId

  const explorerUrl =
    pendingStep?.txHash && toChainId
      ? getExplorerLink({ chainId: toChainId, data: pendingStep.txHash, type: ExplorerDataType.TRANSACTION })
      : undefined

  const handleViewSwaps = (): void => {
    onClose()
    navigateToBridgesSwaps?.()
  }

  return (
    <TransactionModalInnerContainer bottomSheetViewStyles={bottomSheetViewStyles} fullscreen={false}>
      <Flex gap="$spacing16">
        {isWeb && (
          <Flex row justifyContent="flex-end" m="$spacing12">
            <IconButton size="xxsmall" variant="default" emphasis="text-only" icon={<X />} onPress={onClose} />
          </Flex>
        )}
        <Flex animation="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }}>
          <WarningModalContent
            modalName={ModalName.SwapError}
            title={t('swap.crossChain.claimPending.title')}
            caption={t('swap.crossChain.claimPending.description')}
            severity={WarningSeverity.Low}
            icon={<Clock color="$neutral2" size="$icon.24" />}
            acknowledgeText={t('swap.crossChain.claimPending.button')}
            onAcknowledge={handleViewSwaps}
          >
            {explorerUrl && (
              <TouchableArea onPress={() => openUri({ uri: explorerUrl })}>
                <Flex row alignItems="center" gap="$spacing4">
                  <Text color="$accent1" variant="body3">
                    {t('swap.crossChain.claimPending.viewOnExplorer')}
                  </Text>
                  <ExternalLink color="$accent1" size="$icon.16" />
                </Flex>
              </TouchableArea>
            )}
          </WarningModalContent>
        </Flex>
      </Flex>
    </TransactionModalInnerContainer>
  )
}
