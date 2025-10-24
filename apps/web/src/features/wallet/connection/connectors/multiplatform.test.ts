import { deduplicateWalletConnectorMeta } from 'features/wallet/connection/connectors/multiplatform'
import type { WalletConnectorMeta } from 'features/wallet/connection/types/WalletConnectorMeta'
import { METAMASK_CONNECTOR } from 'test-utils/wallets/fixtures'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { describe, expect, it } from 'vitest'

describe('multiplatform connectors', () => {
  describe('deduplicateWalletConnectorMeta', () => {
    it('should return empty array when no connectors provided', () => {
      // Act
      const result = deduplicateWalletConnectorMeta([])

      // Assert
      expect(result).toEqual([])
    })

    it('should return single connector unchanged', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [METAMASK_CONNECTOR]

      // Act
      const result = deduplicateWalletConnectorMeta(walletConnectors)

      // Assert
      expect(result).toEqual(walletConnectors)
    })

    it('should not deduplicate wagmi connectors with exact same name on same platform', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [
        {
          name: 'MetaMask',
          icon: 'metamask.svg',
          wagmi: { id: 'metamask', type: 'injected' },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
        {
          name: 'MetaMask',
          icon: 'metamask-alt.svg',
          wagmi: { id: 'metamask-alt', type: 'injected' },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
      ]

      // Act
      const result = deduplicateWalletConnectorMeta(walletConnectors)

      // Assert
      expect(result).toEqual(expect.arrayContaining(walletConnectors))
    })

    it('should not merge custom connectors with same name', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [
        {
          name: 'WalletConnect',
          icon: 'wc.svg',
          wagmi: { id: 'walletconnect', type: 'injected' },
          isInjected: false,
          analyticsWalletType: 'Wallet Connect',
        },
        {
          name: 'WalletConnect',
          icon: 'custom.svg',
          customConnectorId: CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID,
          isInjected: false,
          analyticsWalletType: 'Wallet Connect',
        },
      ]

      // Act
      const result = deduplicateWalletConnectorMeta(walletConnectors)

      // Assert - should not merge when one has customConnectorId
      expect(result).toHaveLength(2)
    })

    it('should handle connectors with different names', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [
        {
          name: 'MetaMask',
          icon: 'metamask.svg',
          wagmi: { id: 'metamask', type: 'injected' },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
        {
          name: 'Coinbase',
          icon: 'coinbase.svg',
          wagmi: { id: 'coinbase', type: 'injected' },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
      ]

      // Act
      const result = deduplicateWalletConnectorMeta(walletConnectors)

      // Assert
      expect(result).toHaveLength(2)
    })

    it('should normalize names for matching (case insensitive, remove "wallet" suffix)', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [
        {
          name: 'MetaMask Wallet',
          icon: 'metamask.svg',
          wagmi: { id: 'metamask', type: 'injected' },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
        {
          name: 'METAMASK',
          icon: 'metamask-alt.svg',
          wagmi: { id: 'metamask-alt', type: 'injected' },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
      ]

      // Act
      const result = deduplicateWalletConnectorMeta(walletConnectors)

      // Assert - both remain because they are on the same platform
      expect(result).toHaveLength(2)
    })
  })
})
