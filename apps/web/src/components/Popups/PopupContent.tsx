import { useQuery } from '@tanstack/react-query'
import bitcoinLogo from 'assets/images/coins/bitcoin.png'
import { useOpenOffchainActivityModal } from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal'
import {
  getFORTransactionToActivityQueryOptions,
  getSignatureToActivityQueryOptions,
  getTransactionToActivityQueryOptions,
} from 'components/AccountDrawer/MiniPortfolio/Activity/parseLocal'
import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { LoaderV3 } from 'components/Icons/LoadingSpinner'
import { ToastRegularSimple } from 'components/Popups/ToastRegularSimple'
import { POPUP_MAX_WIDTH } from 'components/Popups/constants'
import { BitcoinBridgeDirection, LdsBridgeStatus } from 'components/Popups/types'
import { useIsRecentFlashblocksNotification } from 'hooks/useIsRecentFlashblocksNotification'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useOrder } from 'state/signatures/hooks'
import { useTransaction } from 'state/transactions/hooks'
import { isPendingTx } from 'state/transactions/utils'
import { EllipsisTamaguiStyle } from 'theme/components/styles'
import { Flex, Text, TouchableArea, useShadowPropsMedium, useSporeColors } from 'ui/src'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { AlertTriangleFilled as AlertTriangleFilledUI } from 'ui/src/components/icons/AlertTriangleFilled'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { X } from 'ui/src/components/icons/X'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { BridgeIcon } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { LightningBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FORTransaction } from 'uniswap/src/features/fiatOnRamp/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { isNonInstantFlashblockTransactionType } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/utils'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import noop from 'utilities/src/react/noop'

export function FailedNetworkSwitchPopup({ chainId, onClose }: { chainId: UniverseChainId; onClose: () => void }) {
  const isSupportedChain = useIsSupportedChainId(chainId)
  const chainInfo = isSupportedChain ? getChainInfo(chainId) : undefined
  const { t } = useTranslation()

  if (!chainInfo) {
    return null
  }

  return (
    <ToastRegularSimple
      onDismiss={onClose}
      icon={<AlertTriangleFilled color="$yellow" size="32px" />}
      text={
        <Flex gap="$gap4" flexWrap="wrap" flex={1}>
          <Text variant="body2" color="$neutral1">
            {t('common.failedSwitchNetwork')}
          </Text>
          <Text variant="body3" color="$neutral2" flexWrap="wrap">
            {t('settings.switchNetwork.warning', { label: chainInfo.label })}
          </Text>
        </Flex>
      }
    />
  )
}

type ActivityPopupContentProps = { activity: Activity; onClick?: () => void; onClose: () => void }
function ActivityPopupContent({ activity, onClick, onClose }: ActivityPopupContentProps) {
  const success = activity.status === TransactionStatus.Success && !activity.cancelled
  const pending = activity.status === TransactionStatus.Pending

  const showPortfolioLogo = success || pending || !!activity.offchainOrderDetails
  const colors = useSporeColors()

  const isBridgeActivity = activity.outputChainId && activity.chainId !== activity.outputChainId
  return (
    <Flex
      row
      width={POPUP_MAX_WIDTH}
      backgroundColor="$surface1"
      position="relative"
      borderWidth={1}
      borderRadius="$rounded16"
      borderColor="$surface3"
      py={2}
      px={0}
      animation="300ms"
      $sm={{
        mx: 'auto',
        width: '100%',
      }}
    >
      <TouchableArea onPress={onClick} flex={1}>
        <Flex row gap="$gap12" height={68} py="$spacing12" px="$spacing16">
          {showPortfolioLogo ? (
            <Flex>
              <PortfolioLogo
                chainId={activity.chainId}
                currencies={activity.currencies}
                accountAddress={activity.otherAccount}
                customIcon={isBridgeActivity ? BridgeIcon : undefined}
              />
            </Flex>
          ) : (
            <Flex justifyContent="center">
              <AlertTriangleFilled color="$neutral2" size="32px" />
            </Flex>
          )}
          <Flex justifyContent="center" gap="$gap4" fill>
            <Text variant="body2" color="$neutral1">
              {activity.title}
            </Text>
            <Text variant="body3" color="$neutral2" {...EllipsisTamaguiStyle}>
              {activity.descriptor}
            </Text>
          </Flex>
        </Flex>
      </TouchableArea>
      {pending ? (
        <Flex position="absolute" top="$spacing24" right="$spacing16">
          <LoaderV3 color={colors.accent1.variable} size="20px" />
        </Flex>
      ) : (
        <Flex position="absolute" right="$spacing16" top="$spacing16" data-testid={TestID.ActivityPopupCloseIcon}>
          <TouchableArea onPress={onClose}>
            <X color="$neutral2" size={16} />
          </TouchableArea>
        </Flex>
      )}
    </Flex>
  )
}

export function TransactionPopupContent({ hash, onClose }: { hash: string; onClose: () => void }) {
  const transaction = useTransaction(hash)

  const { formatNumberOrString } = useLocalizationContext()
  const { data: activity } = useQuery(
    getTransactionToActivityQueryOptions({
      transaction,
      formatNumber: formatNumberOrString,
    }),
  )

  const isFlashblockNotification = useIsRecentFlashblocksNotification({ transaction, activity })

  if (!transaction || !activity) {
    return null
  }

  if (
    isFlashblockNotification &&
    !isNonInstantFlashblockTransactionType(transaction) &&
    activity.status === TransactionStatus.Success
  ) {
    return null
  }

  const onClick = () =>
    window.open(
      getExplorerLink({ chainId: activity.chainId, data: activity.hash, type: ExplorerDataType.TRANSACTION }),
      '_blank',
    )

  const explorerUrlUnavailable = isPendingTx(transaction) && transaction.batchInfo

  return (
    <ActivityPopupContent
      activity={activity}
      onClick={explorerUrlUnavailable ? undefined : onClick}
      onClose={onClose}
    />
  )
}

export function UniswapXOrderPopupContent({ orderHash, onClose }: { orderHash: string; onClose: () => void }) {
  const order = useOrder(orderHash)
  const openOffchainActivityModal = useOpenOffchainActivityModal()

  const { formatNumberOrString } = useLocalizationContext()
  const { data: activity } = useQuery(getSignatureToActivityQueryOptions(order, formatNumberOrString))

  if (!activity || !order) {
    return null
  }

  const onClick = () =>
    openOffchainActivityModal(order, { inputLogo: activity.logos?.[0], outputLogo: activity.logos?.[1] })

  return <ActivityPopupContent activity={activity} onClose={onClose} onClick={onClick} />
}

export function FORTransactionPopupContent({
  transaction,
  onClose,
}: {
  transaction: FORTransaction
  onClose: () => void
}) {
  const { formatNumberOrString, convertFiatAmountFormatted } = useLocalizationContext()
  const { data: activity } = useQuery(
    getFORTransactionToActivityQueryOptions({
      transaction,
      formatNumber: formatNumberOrString,
      formatFiatPrice: convertFiatAmountFormatted,
    }),
  )

  if (!activity) {
    return null
  }

  return <ActivityPopupContent activity={activity} onClose={onClose} onClick={noop} />
}

export function BridgingPopupContent({ hash, onClose }: { hash: string; onClose: () => void }) {
  const transaction = useTransaction(hash)

  const { formatNumberOrString } = useLocalizationContext()
  const { data: activity } = useQuery(
    getTransactionToActivityQueryOptions({
      transaction,
      formatNumber: formatNumberOrString,
    }),
  )

  if (!transaction || !activity) {
    return null
  }

  const onClick = () => {
    window.open('/bridge-swaps', '_blank', 'noopener,noreferrer')
    onClose()
  }

  return <ActivityPopupContent activity={activity} onClick={onClick} onClose={onClose} />
}

export function LightningBridgePopupContent({
  direction,
  status,
  onClose,
}: {
  direction: LightningBridgeDirection
  status: LdsBridgeStatus
  onClose: () => void
}) {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const title = useMemo(() => {
    switch (status) {
      case LdsBridgeStatus.Pending:
        return t('Bridging Bitcoins')
      case LdsBridgeStatus.Confirmed:
        return t('Bitcoins bridged successfully')
      case LdsBridgeStatus.Failed:
        return t('Bitcoins bridging failed')
      default:
        return t('Bridging Bitcoins')
    }
  }, [status, t])

  const logoTo = useMemo(() => {
    switch (direction) {
      case LightningBridgeDirection.Submarine:
        return UniverseChainId.LightningNetwork
      case LightningBridgeDirection.Reverse:
        return UniverseChainId.CitreaTestnet
      default:
        return UniverseChainId.CitreaTestnet
    }
  }, [direction])

  const logoFrom = useMemo(() => {
    switch (direction) {
      case LightningBridgeDirection.Submarine:
        return UniverseChainId.CitreaTestnet
      case LightningBridgeDirection.Reverse:
        return UniverseChainId.LightningNetwork
      default:
        return UniverseChainId.CitreaTestnet
    }
  }, [direction])

  const isPending = status === LdsBridgeStatus.Pending

  const onClick = () => {
    window.open('/bridge-swaps', '_blank', 'noopener,noreferrer')
    onClose()
  }

  return (
    <Flex
      row
      width={POPUP_MAX_WIDTH}
      backgroundColor="$surface1"
      position="relative"
      borderWidth={1}
      borderRadius="$rounded16"
      borderColor="$surface3"
      py={2}
      px={0}
      animation="300ms"
      $sm={{
        mx: 'auto',
        width: '100%',
      }}
    >
      <TouchableArea onPress={onClick} flex={1}>
        <Flex row gap="$gap12" height={68} py="$spacing12" px="$spacing16">
          <Flex justifyContent="center">
            <PortfolioLogo chainId={UniverseChainId.Mainnet} images={[bitcoinLogo]} size={32} />
          </Flex>
          <Flex justifyContent="center" gap="$gap4" fill>
            <Text variant="body2" color="$neutral1">
              {title}
            </Text>
            <Flex row alignItems="center" gap="$gap4">
              <NetworkLogo chainId={logoFrom} size={16} />
              <Text variant="body3" color="$neutral2">
                {direction === 'submarine' ? 'Citrea' : 'Lightning Network'}
              </Text>
              <Arrow direction="e" color="$neutral3" size={iconSizes.icon16} />
              <NetworkLogo chainId={logoTo} size={16} />
              <Text variant="body3" color="$neutral2">
                {direction === 'submarine' ? 'Lightning Network' : 'Citrea'}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </TouchableArea>
      {isPending ? (
        <Flex position="absolute" top="$spacing24" right="$spacing16">
          <LoaderV3 color={colors.accent1.variable} size="20px" />
        </Flex>
      ) : (
        <Flex position="absolute" right="$spacing16" top="$spacing16" data-testid={TestID.ActivityPopupCloseIcon}>
          <TouchableArea onPress={onClose}>
            <X color="$neutral2" size={16} />
          </TouchableArea>
        </Flex>
      )}
    </Flex>
  )
}

export function BitcoinBridgePopupContent({
  direction,
  status,
  onClose,
}: {
  direction: BitcoinBridgeDirection
  status: LdsBridgeStatus
  onClose: () => void
}) {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const title = useMemo(() => {
    switch (status) {
      case LdsBridgeStatus.Pending:
        return t('Bridging Bitcoins')
      case LdsBridgeStatus.Confirmed:
        return t('Bitcoins bridged successfully')
      case LdsBridgeStatus.Failed:
        return t('Bitcoins bridging failed')
      default:
        return t('Bridging Bitcoins')
    }
  }, [status, t])

  const logoTo = useMemo(() => {
    switch (direction) {
      case BitcoinBridgeDirection.BitcoinToCitrea:
        return UniverseChainId.CitreaTestnet
      case BitcoinBridgeDirection.CitreaToBitcoin:
        return UniverseChainId.Bitcoin
      default:
        return UniverseChainId.CitreaTestnet
    }
  }, [direction])

  const logoFrom = useMemo(() => {
    switch (direction) {
      case BitcoinBridgeDirection.BitcoinToCitrea:
        return UniverseChainId.Bitcoin
      case BitcoinBridgeDirection.CitreaToBitcoin:
        return UniverseChainId.CitreaTestnet
      default:
        return UniverseChainId.CitreaTestnet
    }
  }, [direction])

  const isPending = status === LdsBridgeStatus.Pending

  const onClick = () => {
    window.open('/bridge-swaps', '_blank', 'noopener,noreferrer')
    onClose()
  }

  return (
    <Flex
      row
      width={POPUP_MAX_WIDTH}
      backgroundColor="$surface1"
      position="relative"
      borderWidth={1}
      borderRadius="$rounded16"
      borderColor="$surface3"
      py={2}
      px={0}
      animation="300ms"
      $sm={{
        mx: 'auto',
        width: '100%',
      }}
    >
      <TouchableArea onPress={onClick} flex={1}>
        <Flex row gap="$gap12" height={68} py="$spacing12" px="$spacing16">
          <Flex justifyContent="center">
            <PortfolioLogo chainId={UniverseChainId.Mainnet} images={[bitcoinLogo]} size={32} />
          </Flex>
          <Flex justifyContent="center" gap="$gap4" fill>
            <Text variant="body2" color="$neutral1">
              {title}
            </Text>
            <Flex row alignItems="center" gap="$gap4">
              <NetworkLogo chainId={logoFrom} size={16} />
              <Text variant="body3" color="$neutral2">
                {direction === BitcoinBridgeDirection.BitcoinToCitrea ? 'Bitcoin' : 'Citrea'}
              </Text>
              <Arrow direction="e" color="$neutral3" size={iconSizes.icon16} />
              <NetworkLogo chainId={logoTo} size={16} />
              <Text variant="body3" color="$neutral2">
                {direction === BitcoinBridgeDirection.BitcoinToCitrea ? 'Citrea' : 'Bitcoin'}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </TouchableArea>
      {isPending ? (
        <Flex position="absolute" top="$spacing24" right="$spacing16">
          <LoaderV3 color={colors.accent1.variable} size="20px" />
        </Flex>
      ) : (
        <Flex position="absolute" right="$spacing16" top="$spacing16" data-testid={TestID.ActivityPopupCloseIcon}>
          <TouchableArea onPress={onClose}>
            <X color="$neutral2" size={16} />
          </TouchableArea>
        </Flex>
      )}
    </Flex>
  )
}

// Split logo component for chain swap (shows two asset logos divided)
function SplitChainLogo({
  fromChainId,
  toChainId,
  fromAsset,
  toAsset,
  size,
}: {
  fromChainId: UniverseChainId
  toChainId: UniverseChainId
  fromAsset: string
  toAsset: string
  size: number
}) {
  const iconSize = size / 2

  // Parse asset to get token symbol and logo URL
  const getTokenInfo = (asset: string): { symbol: string; name: string; logoUrl?: string } => {
    // Asset format is like 'USDT_ETH', 'JUSD_CITREA', etc.
    const symbol = asset.split('_')[0]

    switch (symbol) {
      case 'USDT':
        return {
          symbol: 'USDT',
          name: 'Tether USD',
          logoUrl: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
        }
      case 'USDC':
        return {
          symbol: 'USDC',
          name: 'USD Coin',
          logoUrl: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
        }
      case 'JUSD':
        return {
          symbol: 'JUSD',
          name: 'Juice Dollar',
          logoUrl: 'https://docs.juiceswap.com/media/icons/jusd.png',
        }
      case 'BTC':
        return {
          symbol: 'BTC',
          name: 'Bitcoin',
          logoUrl: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        }
      case 'cBTC':
        return {
          symbol: 'cBTC',
          name: 'Citrea Bitcoin',
          logoUrl: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        }
      default:
        return { symbol, name: symbol }
    }
  }

  const fromToken = getTokenInfo(fromAsset)
  const toToken = getTokenInfo(toAsset)

  return (
    <Flex height={size} width={size} position="relative" borderRadius="$roundedFull" overflow="hidden">
      <Flex left={0} overflow="hidden" position="absolute" top={0} width={iconSize - 1}>
        <TokenLogo
          url={fromToken.logoUrl}
          symbol={fromToken.symbol}
          name={fromToken.name}
          chainId={fromChainId}
          size={size}
          hideNetworkLogo
        />
      </Flex>
      <Flex flexDirection="row-reverse" overflow="hidden" position="absolute" right={0} top={0} width={iconSize - 1}>
        <TokenLogo
          url={toToken.logoUrl}
          symbol={toToken.symbol}
          name={toToken.name}
          chainId={toChainId}
          size={size}
          hideNetworkLogo
        />
      </Flex>
    </Flex>
  )
}

export function Erc20ChainSwapPopupContent({
  fromChainId,
  toChainId,
  fromAsset,
  toAsset,
  status,
  url,
  onClose,
}: {
  fromChainId: UniverseChainId
  toChainId: UniverseChainId
  fromAsset: string
  toAsset: string
  status: LdsBridgeStatus
  url?: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const title = useMemo(() => {
    switch (status) {
      case LdsBridgeStatus.Pending:
        return t('Swapping tokens')
      case LdsBridgeStatus.Confirmed:
        return t('Tokens swapped successfully')
      case LdsBridgeStatus.Failed:
        return t('Token swap failed')
      default:
        return t('Swapping tokens')
    }
  }, [status, t])

  const getChainName = (chainId: UniverseChainId): string => {
    switch (chainId) {
      case UniverseChainId.Mainnet:
        return 'Ethereum'
      case UniverseChainId.Polygon:
        return 'Polygon'
      case UniverseChainId.CitreaMainnet:
      case UniverseChainId.CitreaTestnet:
        return 'Citrea'
      default:
        return 'Unknown'
    }
  }

  const isPending = status === LdsBridgeStatus.Pending

  const handlePress = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Flex
      row
      width={POPUP_MAX_WIDTH}
      backgroundColor="$surface1"
      position="relative"
      borderWidth={1}
      borderRadius="$rounded16"
      borderColor="$surface3"
      py={2}
      px={0}
      animation="300ms"
      cursor={url ? 'pointer' : 'default'}
      $sm={{
        mx: 'auto',
        width: '100%',
      }}
    >
      <TouchableArea onPress={url ? handlePress : noop} flex={1}>
        <Flex row gap="$gap12" height={68} py="$spacing12" px="$spacing16">
          <Flex justifyContent="center">
            <SplitChainLogo
              fromChainId={fromChainId}
              toChainId={toChainId}
              fromAsset={fromAsset}
              toAsset={toAsset}
              size={32}
            />
          </Flex>
          <Flex justifyContent="center" gap="$gap4" fill>
            <Text variant="body2" color="$neutral1">
              {title}
            </Text>
            <Flex row alignItems="center" gap="$gap4">
              <NetworkLogo chainId={fromChainId} size={16} />
              <Text variant="body3" color="$neutral2">
                {getChainName(fromChainId)}
              </Text>
              <Arrow direction="e" color="$neutral3" size={iconSizes.icon16} />
              <NetworkLogo chainId={toChainId} size={16} />
              <Text variant="body3" color="$neutral2">
                {getChainName(toChainId)}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </TouchableArea>
      {isPending ? (
        <Flex position="absolute" top="$spacing24" right="$spacing16">
          <LoaderV3 color={colors.accent1.variable} size="20px" />
        </Flex>
      ) : (
        <Flex position="absolute" right="$spacing16" top="$spacing16" data-testid={TestID.ActivityPopupCloseIcon}>
          <TouchableArea onPress={onClose}>
            <X color="$neutral2" size={16} />
          </TouchableArea>
        </Flex>
      )}
    </Flex>
  )
}

export function RefundableSwapsPopupContent({ count, onClose }: { count: number; onClose: () => void }): JSX.Element {
  const navigate = useNavigate()
  const shadowProps = useShadowPropsMedium()

  const handleClick = (): void => {
    navigate('/bridge-swaps')
    onClose()
  }

  return (
    <Flex
      row
      alignItems="center"
      animation="300ms"
      backgroundColor="$surface1"
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth="$spacing1"
      justifyContent="space-between"
      left={0}
      mx="auto"
      {...shadowProps}
      p="$spacing16"
      position="relative"
      width={POPUP_MAX_WIDTH}
      opacity={1}
      $sm={{
        maxWidth: '100%',
        mx: 'auto',
      }}
    >
      <TouchableArea onPress={handleClick} flex={1}>
        <Flex row alignItems="center" gap="$gap12" flex={1}>
          <Flex>
            <AlertTriangleFilledUI color="$DEP_accentWarning" size="$icon.28" />
          </Flex>
          <Flex gap="$gap4" flex={1}>
            <Text variant="body2" color="$neutral1">
              Swaps Available for Refund ({count})
            </Text>
            <Text variant="body3" color="$neutral2">
              These swaps have timed out and can be refunded to recover your funds.
            </Text>
          </Flex>
        </Flex>
      </TouchableArea>
    </Flex>
  )
}

export function RefundsInProgressPopupContent({ count, onClose }: { count: number; onClose: () => void }): JSX.Element {
  const navigate = useNavigate()
  const colors = useSporeColors()
  const shadowProps = useShadowPropsMedium()

  const handleClick = (): void => {
    navigate('/bridge-swaps')
    onClose()
  }

  return (
    <Flex
      row
      alignItems="center"
      animation="300ms"
      backgroundColor="$surface1"
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth="$spacing1"
      justifyContent="space-between"
      left={0}
      mx="auto"
      {...shadowProps}
      p="$spacing16"
      position="relative"
      width={POPUP_MAX_WIDTH}
      opacity={1}
      $sm={{
        maxWidth: '100%',
        mx: 'auto',
      }}
    >
      <TouchableArea onPress={handleClick} flex={1}>
        <Flex row alignItems="center" gap="$gap12" flex={1}>
          <Flex position="relative">
            <AlertTriangleFilledUI color="$DEP_accentWarning" size="$icon.28" />
            <Flex position="absolute" top={-4} right={-4}>
              <LoaderV3 color={colors.accent1.variable} size="16px" />
            </Flex>
          </Flex>
          <Flex gap="$gap4" flex={1}>
            <Text variant="body2" color="$neutral1">
              Refunds In Progress ({count})
            </Text>
            <Text variant="body3" color="$neutral2">
              Your refunds are being processed. Click to view details.
            </Text>
          </Flex>
        </Flex>
      </TouchableArea>
    </Flex>
  )
}

export function RefundsCompletedPopupContent({ count, onClose }: { count: number; onClose: () => void }): JSX.Element {
  const navigate = useNavigate()
  const shadowProps = useShadowPropsMedium()

  const handleClick = (): void => {
    navigate('/bridge-swaps')
    onClose()
  }

  return (
    <Flex
      row
      alignItems="center"
      animation="300ms"
      backgroundColor="$surface1"
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth="$spacing1"
      justifyContent="space-between"
      left={0}
      mx="auto"
      {...shadowProps}
      p="$spacing16"
      position="relative"
      width={POPUP_MAX_WIDTH}
      opacity={1}
      $sm={{
        maxWidth: '100%',
        mx: 'auto',
      }}
    >
      <TouchableArea onPress={handleClick} flex={1}>
        <Flex row alignItems="center" gap="$gap12" flex={1}>
          <Flex>
            <CheckCircleFilled color="$statusSuccess" size="$icon.28" />
          </Flex>
          <Flex gap="$gap4" flex={1}>
            <Text variant="body2" color="$neutral1">
              Refunds Completed ({count})
            </Text>
            <Text variant="body3" color="$neutral2">
              Your refunds have been successfully processed. Click to view details.
            </Text>
          </Flex>
        </Flex>
      </TouchableArea>
    </Flex>
  )
}

export function ClaimInProgressPopupContent({ count, onClose }: { count: number; onClose: () => void }): JSX.Element {
  const navigate = useNavigate()
  const colors = useSporeColors()
  const shadowProps = useShadowPropsMedium()

  const handleClick = (): void => {
    navigate('/bridge-swaps')
    onClose()
  }

  return (
    <Flex
      row
      alignItems="center"
      animation="300ms"
      backgroundColor="$surface1"
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth="$spacing1"
      justifyContent="space-between"
      left={0}
      mx="auto"
      {...shadowProps}
      p="$spacing16"
      position="relative"
      width={POPUP_MAX_WIDTH}
      opacity={1}
      $sm={{
        maxWidth: '100%',
        mx: 'auto',
      }}
    >
      <TouchableArea onPress={handleClick} flex={1}>
        <Flex row alignItems="center" gap="$gap12" flex={1}>
          <Flex position="relative">
            <CheckCircleFilled color="$statusSuccess" size="$icon.28" />
            <Flex position="absolute" top={-4} right={-4}>
              <LoaderV3 color={colors.accent1.variable} size="16px" />
            </Flex>
          </Flex>
          <Flex gap="$gap4" flex={1}>
            <Text variant="body2" color="$neutral1">
              Claims In Progress ({count})
            </Text>
            <Text variant="body3" color="$neutral2">
              Your claims are being processed. Click to view details.
            </Text>
          </Flex>
        </Flex>
      </TouchableArea>
    </Flex>
  )
}

export function ClaimCompletedPopupContent({ count, onClose }: { count: number; onClose: () => void }): JSX.Element {
  const navigate = useNavigate()
  const shadowProps = useShadowPropsMedium()

  const handleClick = (): void => {
    navigate('/bridge-swaps')
    onClose()
  }

  return (
    <Flex
      row
      alignItems="center"
      animation="300ms"
      backgroundColor="$surface1"
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth="$spacing1"
      justifyContent="space-between"
      left={0}
      mx="auto"
      {...shadowProps}
      p="$spacing16"
      position="relative"
      width={POPUP_MAX_WIDTH}
      opacity={1}
      $sm={{
        maxWidth: '100%',
        mx: 'auto',
      }}
    >
      <TouchableArea onPress={handleClick} flex={1}>
        <Flex row alignItems="center" gap="$gap12" flex={1}>
          <Flex>
            <CheckCircleFilled color="$statusSuccess" size="$icon.28" />
          </Flex>
          <Flex gap="$gap4" flex={1}>
            <Text variant="body2" color="$neutral1">
              Claims Completed ({count})
            </Text>
            <Text variant="body3" color="$neutral2">
              Your claims have been successfully processed. Click to view details.
            </Text>
          </Flex>
        </Flex>
      </TouchableArea>
    </Flex>
  )
}
