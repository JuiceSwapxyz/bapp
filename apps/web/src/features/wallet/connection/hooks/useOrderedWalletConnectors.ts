import { useRecentConnectorId } from 'components/Web3Provider/constants'
import { useWalletConnectors } from 'features/wallet/connection/hooks/useWalletConnectors'
import { WalletConnectorMeta } from 'features/wallet/connection/types/WalletConnectorMeta'
import { getConnectorWithId, getConnectorWithIdWithThrow, isEqualWalletConnectorMetaId } from 'features/wallet/connection/utils'
import { useCallback, useMemo } from 'react'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { isMobileWeb } from 'utilities/src/platform'

function getInjectedConnectors({ connectors }: { connectors: WalletConnectorMeta[] }) {
  return connectors.filter((c) => {
    if (c.wagmi?.id === CONNECTION_PROVIDER_IDS.COINBASE_RDNS) {
      // Special-case: Ignore coinbase eip6963-injected connector; coinbase connection is handled via the SDK connector.
      return false
    } else if (c.wagmi?.id === CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS) {
      // Special-case: Ignore the JuiceSwap Extension injection here if it's being displayed separately
      return false
    }
    return c.isInjected
  })
}

function useSortByRecent(recentConnectorId: string | undefined) {
  return useCallback(
    (a: WalletConnectorMeta, b: WalletConnectorMeta) => {
      if (!recentConnectorId) {
        return 0
      }
      if (isEqualWalletConnectorMetaId(a, recentConnectorId)) {
        return -1
      } else if (isEqualWalletConnectorMetaId(b, recentConnectorId)) {
        return 1
      } else {
        return 0
      }
    },
    [recentConnectorId],
  )
}

function isCoinbaseWalletBrowser(connectors: WalletConnectorMeta[]): boolean {
  return isMobileWeb && connectors.some((c) => c.wagmi?.id === CONNECTION_PROVIDER_IDS.COINBASE_RDNS)
}

function shouldShowOnlyInjectedConnector(injectedConnectors: WalletConnectorMeta[]): boolean {
  return isMobileWeb && injectedConnectors.length === 1
}

function buildSecondaryConnectorsList({
  isMobileWeb,
  walletConnectConnector,
  coinbaseSdkConnector,
  _recentConnectorId,
}: {
  isMobileWeb: boolean
  walletConnectConnector: WalletConnectorMeta
  coinbaseSdkConnector: WalletConnectorMeta
  _recentConnectorId: string | undefined
}): WalletConnectorMeta[] {
  const orderedConnectors: WalletConnectorMeta[] = []

  if (isMobileWeb) {
    orderedConnectors.push(walletConnectConnector)
    orderedConnectors.push(coinbaseSdkConnector)
  } else {
    const secondaryConnectors = [walletConnectConnector, coinbaseSdkConnector].filter((c): c is WalletConnectorMeta =>
      Boolean(c),
    )
    // Recent connector should have already been shown on the primary page
    orderedConnectors.push(
      ...secondaryConnectors.filter((c) => !_recentConnectorId || !isEqualWalletConnectorMetaId(c, _recentConnectorId)),
    )
  }

  return orderedConnectors
}

function buildPrimaryConnectorsList({
  injectedConnectors,
  walletConnectConnector,
  coinbaseSdkConnector,
  _recentConnectorId,
}: {
  injectedConnectors: WalletConnectorMeta[]
  walletConnectConnector: WalletConnectorMeta
  coinbaseSdkConnector: WalletConnectorMeta
  _recentConnectorId: string | undefined
}): WalletConnectorMeta[] {
  const orderedConnectors: WalletConnectorMeta[] = []

  orderedConnectors.push(...injectedConnectors)
  orderedConnectors.push(walletConnectConnector)
  orderedConnectors.push(coinbaseSdkConnector)

  return orderedConnectors
}

/**
 * These connectors do not include JuiceSwap Wallets because those are
 * handled separately. See <UniswapWalletOptions />
 * Primary connectors are displayed on the first page of the modal, this included injected connectors and recent connectors
 */
export function useOrderedWalletConnectors({
  showSecondaryConnectors,
}: {
  showSecondaryConnectors: boolean
}): WalletConnectorMeta[] {
  const connectors = useWalletConnectors()
  const recentConnectorId = useRecentConnectorId()

  const sortByRecent = useSortByRecent(recentConnectorId)

  return useMemo(() => {
    const injectedConnectors = getInjectedConnectors({
      connectors,
    })
    const coinbaseSdkConnector = getConnectorWithIdWithThrow({
      connectors,
      id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID,
    })
    const walletConnectConnector = getConnectorWithIdWithThrow({
      connectors,
      id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID,
    })

    if (isPlaywrightEnv()) {
      // Try to get mock connector for Playwright tests, but fallback to normal connectors
      // if mock is not available (e.g., when using real MetaMask with Synpress)
      const mockConnector = getConnectorWithId({
        connectors,
        id: CONNECTION_PROVIDER_IDS.MOCK_CONNECTOR_ID,
      })
      if (mockConnector) {
        return [mockConnector]
      }
      // Fall through to normal connector logic when mock not available
    }

    // Special-case: Only display the Coinbase connector in the Coinbase Wallet.
    if (isCoinbaseWalletBrowser(connectors)) {
      return [coinbaseSdkConnector]
    }

    // Special-case: Only display the injected connector for in-wallet browsers.
    if (shouldShowOnlyInjectedConnector(injectedConnectors)) {
      return injectedConnectors
    }

    let orderedConnectors: WalletConnectorMeta[]

    if (showSecondaryConnectors) {
      orderedConnectors = buildSecondaryConnectorsList({
        isMobileWeb,
        walletConnectConnector,
        coinbaseSdkConnector,
        _recentConnectorId: recentConnectorId,
      })
    } else {
      orderedConnectors = buildPrimaryConnectorsList({
        injectedConnectors,
        walletConnectConnector,
        coinbaseSdkConnector,
        _recentConnectorId: recentConnectorId,
      })
    }

    // Move the most recent connector to the top of the list.
    orderedConnectors.sort(sortByRecent)

    return orderedConnectors
  }, [connectors, recentConnectorId, showSecondaryConnectors, sortByRecent])
}
