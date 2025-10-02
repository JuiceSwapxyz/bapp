import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { NativeSyntheticEvent } from 'react-native'
import type { ContextMenuAction, ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { useDispatch, useSelector } from 'react-redux'
import { GeneratedIcon } from 'ui/src'
import { Eye } from 'ui/src/components/icons/Eye'
import { EyeOff } from 'ui/src/components/icons/EyeOff'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useBlockExplorerLogo } from 'uniswap/src/features/chains/logos'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainExplorerName } from 'uniswap/src/features/chains/utils'
import { getIsNftHidden, getNFTAssetKey } from 'uniswap/src/features/nfts/utils'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { selectNftsVisibility } from 'uniswap/src/features/visibility/selectors'
import { setNftVisibility } from 'uniswap/src/features/visibility/slice'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { isWeb } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

interface NFTMenuParams {
  tokenId?: string
  contractAddress?: Address
  owner?: Address
  walletAddresses: Address[]
  showNotification?: boolean
  isSpam?: boolean
  chainId?: UniverseChainId
}

type MenuAction = ContextMenuAction & { onPress: () => void; Icon?: GeneratedIcon }

export function useNFTContextMenu({
  contractAddress,
  tokenId,
  owner,
  walletAddresses,
  showNotification = false,
  isSpam,
  chainId,
}: NFTMenuParams): {
  menuActions: Array<MenuAction>
  onContextMenuPress: (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => void
} {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { defaultChainId } = useEnabledChains()
  const ownedByUser = owner && walletAddresses.includes(owner)

  const { navigateToNftDetails } = useUniswapContext()

  const nftVisibility = useSelector(selectNftsVisibility)
  const nftKey = contractAddress && tokenId ? getNFTAssetKey(contractAddress, tokenId) : undefined
  const isVisible = !getIsNftHidden({ contractAddress, tokenId, isSpam, nftVisibility })

  const onPressHiddenStatus = useCallback(() => {
    if (!nftKey) {
      return
    }

    sendAnalyticsEvent(WalletEventName.NFTVisibilityChanged, {
      tokenId,
      chainId,
      contractAddress,
      isSpam,
      // we log the state to which it's transitioning
      visible: !isVisible,
    })
    dispatch(setNftVisibility({ nftKey, isVisible: !isVisible }))

    if (showNotification) {
      dispatch(
        pushNotification({
          type: AppNotificationType.AssetVisibility,
          visible: isVisible,
          hideDelay: 2 * ONE_SECOND_MS,
          assetName: 'NFT',
        }),
      )
    }
  }, [nftKey, tokenId, chainId, contractAddress, isSpam, isVisible, dispatch, showNotification])

  const onPressNavigateToExplorer = useCallback(() => {
    if (contractAddress && tokenId && chainId) {
      navigateToNftDetails({ address: contractAddress, tokenId, chainId, fallbackChainId: defaultChainId })
    }
  }, [contractAddress, tokenId, chainId, navigateToNftDetails, defaultChainId])

  const onPressCopyAddress = useCallback(async (): Promise<void> => {
    if (!contractAddress) {
      return
    }
    await setClipboard(contractAddress)
    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.Address,
      }),
    )
  }, [contractAddress, dispatch])

  const openExplorerLink = useCallback(async (): Promise<void> => {
    if (!chainId || !contractAddress) {
      return
    }
    await openUri({
      uri: getExplorerLink({ chainId, data: contractAddress, type: ExplorerDataType.ADDRESS }),
    })
  }, [chainId, contractAddress])

  const ExplorerLogo = useBlockExplorerLogo(chainId)

  const menuActions = useMemo(
    () =>
      nftKey
        ? [
            ...(isWeb && chainId
              ? [
                  {
                    title: t('tokens.nfts.action.viewOnExplorer', {
                      blockExplorerName: getChainExplorerName(chainId),
                    }),
                    onPress: onPressNavigateToExplorer,
                    Icon: ExplorerLogo,
                    destructive: false,
                  },
                ]
              : []),
            ...(!isWeb && chainId
              ? [
                  {
                    title: t('tokens.nfts.action.viewOnExplorer', {
                      blockExplorerName: getChainExplorerName(chainId),
                    }),
                    systemIcon: 'link',
                    onPress: openExplorerLink,
                  },
                ]
              : []),
            ...(contractAddress
              ? [
                  {
                    title: t('common.copy.address'),
                    systemIcon: 'doc.on.doc',
                    onPress: onPressCopyAddress,
                  },
                ]
              : []),
            ...(ownedByUser
              ? [
                  {
                    title: isVisible ? t('tokens.nfts.hidden.action.hide') : t('tokens.nfts.hidden.action.unhide'),
                    ...(isWeb
                      ? {
                          Icon: isVisible ? EyeOff : Eye,
                        }
                      : {
                          systemIcon: isVisible ? 'eye.slash' : 'eye',
                        }),
                    destructive: isVisible,
                    onPress: onPressHiddenStatus,
                  },
                ]
              : []),
          ]
        : [],
    [
      nftKey,
      chainId,
      t,
      onPressNavigateToExplorer,
      ExplorerLogo,
      openExplorerLink,
      contractAddress,
      onPressCopyAddress,
      ownedByUser,
      isVisible,
      onPressHiddenStatus,
    ],
  )

  const onContextMenuPress = useCallback(
    async (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): Promise<void> => {
      await menuActions[e.nativeEvent.index]?.onPress?.()
    },
    [menuActions],
  )

  return { menuActions, onContextMenuPress }
}
