import { useShowMoonpayText } from 'components/AccountDrawer/MiniPortfolio/hooks'
import ConnectionErrorView from 'components/WalletModal/ConnectionErrorView'
import PrivacyPolicyNotice from 'components/WalletModal/PrivacyPolicyNotice'
import { WalletConnectorOption } from 'components/WalletModal/WalletConnectorOption'
import { useOrderedWalletConnectors } from 'features/wallet/connection/hooks/useOrderedWalletConnectors'
import { Fragment, useReducer } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { transitions } from 'theme/styles'
import { Flex, Separator, Text } from 'ui/src'
import { isMobileWeb } from 'utilities/src/platform'

export default function WalletModal() {
  const { t } = useTranslation()
  const showMoonpayText = useShowMoonpayText()
  const [expandMoreWallets, _toggleExpandMoreWallets] = useReducer((s) => !s, true)

  const connectors = useOrderedWalletConnectors({ showSecondaryConnectors: isMobileWeb })

  return (
    <Flex
      backgroundColor="$surface1"
      pt="$spacing16"
      px="$spacing12"
      pb="$spacing20"
      flex={1}
      gap="$gap16"
      data-testid="wallet-modal"
    >
      <ConnectionErrorView />
      <Flex row justifyContent="space-between" width="100%">
        <Text variant="subheading2">{t('common.connectAWallet.button')}</Text>
      </Flex>
      {/* Disable Uniswap embedded wallet entirely for JuiceSwap */}
      {/* {isEmbeddedWalletEnabled ? (
        <Flex justifyContent="center" alignItems="center" py={8}>
          <UniswapLogo size={48} color="$accent1" />
        </Flex>
      ) : (
        <UniswapWalletOptions />
      )}
      {isEmbeddedWalletEnabled ? null : (
        <Flex
          row
          alignItems="center"
          py={8}
          userSelect="none"
          onPress={toggleExpandMoreWallets}
          {...ClickableTamaguiStyle}
        >
          <Separator />
          <Flex row alignItems="center" mx={18}>
            <Text variant="body3" color="$neutral2" whiteSpace="nowrap">
              <Trans i18nKey="wallet.other" />
            </Text>
            {expandMoreWallets ? (
              <DoubleChevron size={20} color="$neutral3" />
            ) : (
              <DoubleChevronInverted size={20} color="$neutral3" />
            )}
          </Flex>
          <Separator />
        </Flex>
      )} */}
      <Flex gap="$gap12">
        <Flex row alignItems="flex-start">
          <Flex
            borderRadius="$rounded16"
            overflow="hidden"
            width="100%"
            maxHeight={expandMoreWallets ? '100vh' : 0}
            opacity={expandMoreWallets ? 1 : 0}
            transition={`${transitions.duration.fast} ${transitions.timing.inOut}`}
            data-testid="option-grid"
          >
            {connectors.map((c, index) => (
              <Fragment key={c.name}>
                <WalletConnectorOption walletConnectorMeta={c} />
                {index < connectors.length - 1 ? <Separator /> : null}
              </Fragment>
            ))}
          </Flex>
        </Flex>
        <Flex gap="$gap8">
          <Flex px="$spacing4">
            <PrivacyPolicyNotice />
          </Flex>
          {showMoonpayText && (
            <Flex borderTopWidth={1} pt="$spacing8" borderColor="$surface3" px="$spacing4">
              <Text variant="body4" color="$neutral3">
                <Trans i18nKey="moonpay.poweredBy" />
              </Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Flex>
  )
}
