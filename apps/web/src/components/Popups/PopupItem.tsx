import { MismatchToastItem } from 'components/Popups/MismatchToastItem'
import {
  BitcoinBridgePopupContent,
  ClaimCompletedPopupContent,
  ClaimInProgressPopupContent,
  Erc20ChainSwapPopupContent,
  FORTransactionPopupContent,
  FailedNetworkSwitchPopup,
  LightningBridgePopupContent,
  RefundableSwapsPopupContent,
  RefundsCompletedPopupContent,
  RefundsInProgressPopupContent,
  TransactionPopupContent,
  UniswapXOrderPopupContent,
} from 'components/Popups/PopupContent'
import { ToastRegularSimple } from 'components/Popups/ToastRegularSimple'
import { PopupContent, PopupType, SwitchNetworkAction } from 'components/Popups/types'
import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { Shuffle } from 'ui/src/components/icons/Shuffle'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export function PopupItem({ content, onClose }: { content: PopupContent; popKey: string; onClose: () => void }) {
  const { t } = useTranslation()

  switch (content.type) {
    case PopupType.Transaction: {
      return <TransactionPopupContent hash={content.hash} onClose={onClose} />
    }
    case PopupType.Order: {
      return <UniswapXOrderPopupContent orderHash={content.orderHash} onClose={onClose} />
    }
    case PopupType.FailedSwitchNetwork: {
      return <FailedNetworkSwitchPopup chainId={content.failedSwitchNetwork} onClose={onClose} />
    }
    case PopupType.SwitchNetwork: {
      return (
        <ToastRegularSimple
          onDismiss={onClose}
          icon={<NetworkLogo chainId={content.chainId} />}
          text={getSwitchNetworkTitle({
            t,
            action: content.action,
            chainId: content.chainId,
          })}
        />
      )
    }
    case PopupType.Bridge: {
      return (
        <ToastRegularSimple
          onDismiss={onClose}
          icon={<BridgeToast inputChainId={content.inputChainId} outputChainId={content.outputChainId} />}
        />
      )
    }
    case PopupType.Mismatch: {
      return <MismatchToastItem onDismiss={onClose} />
    }
    case PopupType.FORTransaction: {
      return <FORTransactionPopupContent transaction={content.transaction} onClose={onClose} />
    }
    case PopupType.CampaignTaskCompleted: {
      return (
        <ToastRegularSimple
          onDismiss={onClose}
          icon={<CheckCircleFilled color="$statusSuccess" size="$icon.28" />}
          text={
            <Flex gap="$gap4" flexWrap="wrap" flex={1}>
              <Text variant="body2" color="$neutral1">
                Task Completed!
              </Text>
              <Text variant="body3" color="$neutral2">
                {content.taskName} - Campaign Progress: {Math.round(content.progress)}%
              </Text>
            </Flex>
          }
        />
      )
    }
    case PopupType.LightningBridge: {
      return <LightningBridgePopupContent direction={content.direction} status={content.status} onClose={onClose} />
    }
    case PopupType.BitcoinBridge: {
      return (
        <BitcoinBridgePopupContent
          direction={content.direction}
          status={content.status}
          url={content.url}
          onClose={onClose}
        />
      )
    }
    case PopupType.Erc20ChainSwap: {
      return (
        <Erc20ChainSwapPopupContent
          fromChainId={content.fromChainId}
          toChainId={content.toChainId}
          fromAsset={content.fromAsset}
          toAsset={content.toAsset}
          status={content.status}
          url={content.url}
          onClose={onClose}
        />
      )
    }
    case PopupType.RefundableSwaps: {
      return <RefundableSwapsPopupContent count={content.count} onClose={onClose} />
    }
    case PopupType.RefundsInProgress: {
      return <RefundsInProgressPopupContent count={content.count} onClose={onClose} />
    }
    case PopupType.RefundsCompleted: {
      return <RefundsCompletedPopupContent count={content.count} onClose={onClose} />
    }
    case PopupType.ClaimInProgress: {
      return <ClaimInProgressPopupContent count={content.count} onClose={onClose} />
    }
    case PopupType.ClaimCompleted: {
      return <ClaimCompletedPopupContent count={content.count} onClose={onClose} />
    }
    default:
      return null
  }
}

function getSwitchNetworkTitle({
  t,
  action,
  chainId,
}: {
  t: TFunction
  action: SwitchNetworkAction
  chainId: UniverseChainId
}) {
  const { label } = getChainInfo(chainId)

  switch (action) {
    case SwitchNetworkAction.Swap:
      return t('notification.swap.network', { network: label })
    case SwitchNetworkAction.Send:
      return t('notification.send.network', { network: label })
    case SwitchNetworkAction.Buy:
      return t('notification.buy.network', { network: label })
    case SwitchNetworkAction.Sell:
      return t('notification.sell.network', { network: label })
    case SwitchNetworkAction.LP:
      return t('notification.lp.network', { network: label })
    case SwitchNetworkAction.Limit:
      return t('notification.limit.network', { network: label })
    case SwitchNetworkAction.PoolFinder:
      return t('notification.poolFinder.network', { network: label })
    default:
      return ''
  }
}

function BridgeToast({
  inputChainId,
  outputChainId,
}: {
  inputChainId: UniverseChainId
  outputChainId: UniverseChainId
}): JSX.Element {
  const originChain = getChainInfo(inputChainId)
  const targetChain = getChainInfo(outputChainId)
  return (
    <Flex row gap="$gap8">
      <Flex row gap="$gap4">
        <NetworkLogo chainId={inputChainId} />
        <Text variant="body2" lineHeight={20}>
          {originChain.label}
        </Text>
      </Flex>
      <Shuffle color="$neutral2" size="$icon.20" />
      <Flex row gap="$gap4">
        <NetworkLogo chainId={outputChainId} />
        <Text variant="body2" lineHeight={20}>
          {targetChain.label}
        </Text>
      </Flex>
    </Flex>
  )
}
