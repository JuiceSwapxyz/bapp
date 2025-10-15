import { deduplicateWalletConnectorMeta } from 'features/wallet/connection/connectors/multiplatform'
import type { WalletConnectorMeta } from 'features/wallet/connection/types/WalletConnectorMeta'
import { METAMASK_CONNECTOR } from 'test-utils/wallets/fixtures'
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

    it('should preserve different connectors with different names', () => {
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
          name: 'Coinbase Wallet',
          icon: 'coinbase.svg',
          wagmi: { id: 'coinbase', type: 'coinbaseWallet' },
          isInjected: false,
          analyticsWalletType: 'Browser Extension',
        },
        {
          name: 'Phantom',
          icon: 'phantom.svg',
          wagmi: { id: 'phantom', type: 'injected' },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
      ]

      // Act
      const result = deduplicateWalletConnectorMeta(walletConnectors)

      // Assert
      expect(result).toHaveLength(3)
      expect(result).toEqual(
        expect.arrayContaining([
          {
            name: 'MetaMask',
            icon: 'metamask.svg',
            wagmi: { id: 'metamask', type: 'injected' },
            isInjected: true,
            analyticsWalletType: 'Browser Extension',
          },
          {
            name: 'Coinbase Wallet',
            icon: 'coinbase.svg',
            wagmi: { id: 'coinbase', type: 'coinbaseWallet' },
            isInjected: false,
            analyticsWalletType: 'Browser Extension',
          },
          {
            name: 'Phantom',
            icon: 'phantom.svg',
            wagmi: { id: 'phantom', type: 'injected' },
            isInjected: true,
            analyticsWalletType: 'Browser Extension',
          },
        ]),
      )
    })

    it('should not merge custom connectors with other connectors', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [
        {
          name: 'Custom Connector',
          icon: 'normal.svg',
          wagmi: { id: 'normalConnectorId', type: 'injected' },
          customConnectorId: 'uniswapWalletConnect',
          isInjected: true,
          analyticsWalletType: 'Wallet Connect',
        },
        {
          name: 'Custom Connector',
          icon: 'another.svg',
          wagmi: { id: 'anotherConnectorId', type: 'injected' },
          customConnectorId: 'anotherCustomId',
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
      ]

      // Act
      const result = deduplicateWalletConnectorMeta(walletConnectors)

      // Assert
      expect(result).toEqual(walletConnectors)
    })

    it('should not deduplicate connectors if more than 2 connectors have the same normalized name', () => {
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
          name: 'METAMASK WALLET',
          icon: 'metamask-caps.svg',
          wagmi: { id: 'metamask-caps', type: 'injected' },
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
      expect(result).toEqual(walletConnectors)
    })

    it('should handle connectors with undefined icon properties', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [
        {
          name: 'MetaMask',
          icon: undefined,
          wagmi: { id: 'metamask', type: 'injected' },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
        {
          name: 'Coinbase Wallet',
          icon: 'coinbase.svg',
          wagmi: { id: 'coinbase', type: 'coinbaseWallet' },
          isInjected: false,
          analyticsWalletType: 'Browser Extension',
        },
      ]

      // Act
      const result = deduplicateWalletConnectorMeta(walletConnectors)

      // Assert
      expect(result).toHaveLength(2)
      expect(result).toEqual(walletConnectors)
    })

    it('should handle special characters in wallet names', () => {
      // Arrange
      const walletConnectors: WalletConnectorMeta[] = [
        {
          name: 'Wallet & Co.',
          icon: 'wallet-co.svg',
          wagmi: { id: 'wallet-co', type: 'injected' },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
        {
          name: 'Wallet & Co. Wallet',
          icon: 'wallet-co-wallet.svg',
          wagmi: { id: 'wallet-co-wallet', type: 'injected' },
          isInjected: true,
          analyticsWalletType: 'Browser Extension',
        },
      ]

      // Act
      const result = deduplicateWalletConnectorMeta(walletConnectors)

      // Assert - both connectors should be preserved since they're on the same platform
      expect(result).toHaveLength(2)
    })
  })
})
