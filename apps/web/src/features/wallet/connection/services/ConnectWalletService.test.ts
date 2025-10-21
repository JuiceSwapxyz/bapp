import type { CustomConnectorId } from 'features/wallet/connection/connectors/custom'
import {
  ConnectWalletService,
  createConnectWalletService,
} from 'features/wallet/connection/services/ConnectWalletService'
import type {
  CustomWalletConnectorMeta,
  WagmiWalletConnectorMeta,
} from 'features/wallet/connection/types/WalletConnectorMeta'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'

const createMockCustomWalletConnectorMeta = (overrides = {}): CustomWalletConnectorMeta => ({
  name: 'Custom Wallet',
  icon: 'custom-icon.svg',
  customConnectorId: CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID,
  isInjected: false,
  analyticsWalletType: 'Wallet Connect',
  ...overrides,
})

const createMockWagmiWalletConnectorMeta = (overrides = {}): WagmiWalletConnectorMeta => ({
  name: 'Wagmi Wallet',
  icon: 'wagmi-icon.svg',
  wagmi: { id: 'metamask', type: 'injected' },
  isInjected: true,
  analyticsWalletType: 'Browser Extension',
  ...overrides,
})

describe('ConnectWalletService', () => {
  let mockConnectWagmiWallet: Mock
  let mockConnectCustomWalletsMap: Record<CustomConnectorId, Mock>
  let connectWalletService: ConnectWalletService

  beforeEach(() => {
    mockConnectWagmiWallet = vi.fn().mockResolvedValue(undefined)
    mockConnectCustomWalletsMap = {
      [CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID]: vi.fn().mockResolvedValue(undefined),
    }

    connectWalletService = createConnectWalletService({
      connectWagmiWallet: mockConnectWagmiWallet,
      connectCustomWalletsMap: mockConnectCustomWalletsMap,
    })
  })

  describe('connect', () => {
    it('should connect custom wallet when customConnectorId is provided', async () => {
      // Arrange
      const customWalletConnector = createMockCustomWalletConnectorMeta()
      const expectedCustomConnector = {
        ...customWalletConnector,
        customConnectorId: CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID,
      }

      // Act
      await connectWalletService.connect({ walletConnector: customWalletConnector })

      // Assert
      expect(
        mockConnectCustomWalletsMap[CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID],
      ).toHaveBeenCalledWith(expectedCustomConnector)
      expect(mockConnectWagmiWallet).not.toHaveBeenCalled()
    })

    it('should connect wagmi wallet when wagmiConnectorId is provided', async () => {
      // Arrange
      const wagmiWalletConnector = createMockWagmiWalletConnectorMeta()
      const expectedWagmiConnector = {
        ...wagmiWalletConnector,
        wagmi: { id: 'metamask', type: 'injected' },
      }

      // Act
      await connectWalletService.connect({ walletConnector: wagmiWalletConnector })

      // Assert
      expect(mockConnectWagmiWallet).toHaveBeenCalledWith(expectedWagmiConnector)
      expect(
        mockConnectCustomWalletsMap[CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID],
      ).not.toHaveBeenCalled()
    })

    it('should handle custom wallet connection errors gracefully', async () => {
      // Arrange
      const error = new Error('Custom wallet connection failed')
      mockConnectCustomWalletsMap[CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID].mockRejectedValue(error)
      const customWalletConnector = createMockCustomWalletConnectorMeta()

      // Act & Assert
      await expect(connectWalletService.connect({ walletConnector: customWalletConnector })).rejects.toThrow(
        'Custom wallet connection failed',
      )
    })

    it('should handle wagmi wallet connection errors gracefully', async () => {
      // Arrange
      const error = new Error('Wagmi wallet connection failed')
      mockConnectWagmiWallet.mockRejectedValue(error)
      const wagmiWalletConnector = createMockWagmiWalletConnectorMeta()

      // Act & Assert
      await expect(connectWalletService.connect({ walletConnector: wagmiWalletConnector })).rejects.toThrow(
        'Wagmi wallet connection failed',
      )
    })

    it('should throw error when custom connector ID is not found in map', async () => {
      // Arrange
      const unknownCustomConnector = createMockCustomWalletConnectorMeta({
        customConnectorId: 'unknown-connector' as CustomConnectorId,
      })

      // Act & Assert
      await expect(connectWalletService.connect({ walletConnector: unknownCustomConnector })).rejects.toThrow()
    })

    it('should preserve all wallet connector properties when calling connection functions', async () => {
      // Arrange
      const customWalletConnector = createMockCustomWalletConnectorMeta({
        name: 'Test Custom Wallet',
        icon: 'test-icon.svg',
        customConnectorId: CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID,
      })

      // Act
      await connectWalletService.connect({ walletConnector: customWalletConnector })

      // Assert
      expect(
        mockConnectCustomWalletsMap[CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID],
      ).toHaveBeenCalledWith({
        name: 'Test Custom Wallet',
        icon: 'test-icon.svg',
        customConnectorId: CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID,
        isInjected: false,
        analyticsWalletType: 'Wallet Connect',
      })
    })
  })

  describe('createConnectWalletService', () => {
    it('should create service with provided context', () => {
      // Arrange
      const context = {
        connectWagmiWallet: mockConnectWagmiWallet,
        connectCustomWalletsMap: mockConnectCustomWalletsMap,
      }

      // Act
      const service = createConnectWalletService(context)

      // Assert
      expect(service).toBeDefined()
      expect(typeof service.connect).toBe('function')
    })

    it('should return service with connect method', () => {
      // Assert
      expect(connectWalletService).toBeDefined()
      expect(typeof connectWalletService.connect).toBe('function')
    })
  })
})
