import { useTranslation } from 'react-i18next'
import { Flex, IconButton } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { WarningModalContent } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionModalInnerContainer } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import {
  useTransactionSettingsActions,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { TransactionStepFailedError, getErrorContent } from 'uniswap/src/features/transactions/errors'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { isWeb } from 'utilities/src/platform'
import { BitcoinBridgeBitcoinToCitreaStep, BitcoinBridgeCitreaToBitcoinStep } from '../../steps/bitcoinBridge'

export function SwapErrorScreen({
  submissionError,
  setSubmissionError,
  onPressRetry,
  resubmitSwap,
  onClose,
}: {
  submissionError: Error
  setSubmissionError: (e: Error | undefined) => void
  resubmitSwap: () => void
  onPressRetry: (() => void) | undefined
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { bottomSheetViewStyles } = useTransactionModalContext()
  const { selectedProtocols } = useTransactionSettingsStore((s) => ({
    selectedProtocols: s.selectedProtocols,
  }))
  const { setSelectedProtocols } = useTransactionSettingsActions()
  const { navigateToBridgesSwaps } = useUniswapContext()

  const { title, message, buttonText } = getErrorContent(t, submissionError)

  const isUniswapXBackendError =
    submissionError instanceof TransactionStepFailedError &&
    submissionError.isBackendRejection &&
    submissionError.step.type === TransactionStepType.UniswapXSignature

  const isBridgeError = submissionError instanceof TransactionStepFailedError &&
    (submissionError.step.type === TransactionStepType.BitcoinBridgeBitcoinToCitreaStep ||
      submissionError.step.type === TransactionStepType.BitcoinBridgeCitreaToBitcoinStep ||
      submissionError.step.type === TransactionStepType.LightningBridgeSubmarineStep ||
      submissionError.step.type === TransactionStepType.LightningBridgeReverseStep ||
      submissionError.step.type === TransactionStepType.WbtcBridgeStep)

  const isBridgeBackendAccepted = isBridgeError && (submissionError.step as BitcoinBridgeBitcoinToCitreaStep | BitcoinBridgeCitreaToBitcoinStep).backendAccepted

  const handleTryAgain = (): void => {
    if (isBridgeBackendAccepted) {
      setSubmissionError(undefined)
      onClose()
      navigateToBridgesSwaps?.()
      return
    }

    if (onPressRetry) {
      onPressRetry()
    } else if (isUniswapXBackendError) {
      // TODO(WEB-7668): move this into onPressRetry logic.
      // Update swap preferences for this session to exclude UniswapX if Uniswap x failed
      const updatedProtocols = selectedProtocols
      setSelectedProtocols(updatedProtocols)
    } else {
      resubmitSwap()
    }
    setSubmissionError(undefined)
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
            title={title}
            caption={message}
            severity={WarningSeverity.Low}
            rejectText={buttonText ?? t('common.button.tryAgain')}
            onReject={handleTryAgain}
          />
        </Flex>
      </Flex>
    </TransactionModalInnerContainer>
  )
}
