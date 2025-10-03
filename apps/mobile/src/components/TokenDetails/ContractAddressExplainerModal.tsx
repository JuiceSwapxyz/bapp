import { useTranslation } from 'react-i18next'
import { Text } from 'ui/src'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function ContractAddressExplainerModal({
  onAcknowledge,
}: {
  onAcknowledge: (markViewed: boolean) => void
}): JSX.Element | null {
  const { t } = useTranslation()

  return (
    <WarningModal
      isOpen
      modalName={ModalName.ContractAddressExplainer}
      title={t('token.safety.warning.copyContractAddress.title')}
      captionComponent={
        <>
          <Text variant="body3" color="$neutral2" textAlign="center">
            {t('token.safety.warning.copyContractAddress.message')}
          </Text>
        </>
      }
      severity={WarningSeverity.Low}
      acknowledgeText={t('common.button.understand')}
      onAcknowledge={() => onAcknowledge(true)}
      onClose={() => onAcknowledge(false)}
    />
  )
}
