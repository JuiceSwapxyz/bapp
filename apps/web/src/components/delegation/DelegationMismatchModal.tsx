import { SharedEventName } from '@uniswap/analytics-events'
import { WalletAlertBadge } from 'components/Badge/WalletAlertBadge'
import { Dialog } from 'components/Dialog/Dialog'
// useWalletDisplay removed from RecentlyConnectedModal - implementing locally
import { useAccount } from 'hooks/useAccount'
import { useDisconnect } from 'hooks/useDisconnect'
import { useTheme } from 'lib/styled-components'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Blocked } from 'ui/src/components/icons/Blocked'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { useOnchainDisplayName } from 'uniswap/src/features/accounts/useOnchainDisplayName'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send.web'
import { shortenAddress } from 'utilities/src/addresses'
import { useEvent } from 'utilities/src/react/hooks'

// Local implementation of wallet display logic since useWalletDisplay was removed
function useWalletDisplay(walletAddress: string | undefined) {
  const displayName = useOnchainDisplayName(walletAddress, {
    showShortenedEns: true,
    includeUnitagSuffix: true,
  })

  return {
    displayName: displayName?.name ?? shortenAddress(walletAddress),
    showUnitagIcon: displayName?.type === DisplayNameType.Unitag,
    showShortAddress: displayName?.type === DisplayNameType.Unitag || displayName?.type === DisplayNameType.ENS,
    shortAddress: shortenAddress(walletAddress),
  }
}

interface DelegationMismatchModalProps {
  onClose: () => void
}

function DelegationMismatchModal({ onClose }: DelegationMismatchModalProps) {
  const { t } = useTranslation()
  const account = useAccount()
  const { displayName } = useWalletDisplay(account.address)
  const disconnect = useDisconnect()
  const theme = useTheme()

  const walletName = account.connector?.name ?? t('common.your.connected.wallet')
  const iconSrc = account.connector?.icon

  const FEATURES = [
    t('smartWallets.delegationMismatchModal.features.1ClickSwaps'),
    <>
      {t('smartWallets.delegationMismatchModal.features.gasFreeSwaps')}
      <span style={{ color: theme.neutral2 }}>{` (${t('uniswapx.label')})`}</span>
    </>,
    t('smartWallets.delegationMismatchModal.features.limitOrders'),
  ]

  const handleTrackModalDismissed = useEvent(() => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.Continue,
      modal: ModalName.DelegationMismatch,
    })
  })

  const handleTrackDisconnectButtonClicked = useEvent(() => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.Disconnect,
      modal: ModalName.DelegationMismatch,
    })
  })

  const handleSwitchWallets = useEvent(() => {
    onClose()
    disconnect()
    handleTrackDisconnectButtonClicked()
  })

  const handleContinue = useEvent(() => {
    onClose()
    handleTrackModalDismissed()
  })

  return (
    <Trace logImpression modal={ModalName.DelegationMismatch}>
      <Dialog
        isOpen
        modalName={ModalName.DelegationMismatch}
        title={t('smartWallets.delegationMismatchModal.title')}
        subtext={
          <Text variant="body3" color="$neutral2" textAlign="left" pr="$spacing4">
            {t('smartWallets.delegationMismatchModal.description', {
              walletName,
              displayName,
            })}
          </Text>
        }
        icon={<WalletAlertBadge walletIcon={iconSrc} />}
        primaryButtonText={t('common.button.disconnect')}
        primaryButtonOnClick={handleSwitchWallets}
        primaryButtonVariant="default"
        primaryButtonEmphasis="secondary"
        secondaryButtonText={t('common.button.continue')}
        secondaryButtonOnClick={handleContinue}
        secondaryButtonVariant="default"
        secondaryButtonEmphasis="primary"
        learnMoreUrl={uniswapUrls.helpArticleUrls.mismatchedImports}
        learnMoreTextColor="$accent1"
        learnMoreTextVariant="buttonLabel3"
        onClose={onClose}
        buttonContainerProps={{ flexDirection: 'row', gap: '$spacing12' }}
        textAlign="left"
      >
        <Flex flexDirection="column" alignItems="flex-start" width="100%" mt="$spacing12" gap="$spacing8">
          {FEATURES.map((feature, index) => (
            <Flex key={index} row alignItems="center" gap="$spacing4">
              <Blocked color="$neutral3" size={16} />
              <Text variant="body3" color="$neutral1">
                {feature}
              </Text>
            </Flex>
          ))}
        </Flex>
      </Dialog>
    </Trace>
  )
}

export default DelegationMismatchModal
