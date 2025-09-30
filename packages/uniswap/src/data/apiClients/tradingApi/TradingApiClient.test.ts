// Mock the global fetch function
const mockFetch = jest.fn()
global.fetch = mockFetch

import { checkWalletDelegation } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { Address, ChainId, WalletCheckDelegationRequestBody } from 'uniswap/src/data/tradingApi/__generated__'

const mockCheckWalletDelegationWithoutBatching = mockFetch

describe('checkWalletDelegation', () => {
  const mockAddress1 = '0x1234567890abcdef1234567890abcdef12345678' as Address
  const mockAddress2 = '0xabcdef1234567890abcdef1234567890abcdef12' as Address

  const mockChainId1 = 1 as ChainId
  const mockChainId2 = 137 as ChainId

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // NOTE: The /v1/wallet/check_delegation endpoint is currently disabled
  // These tests verify that the disabled endpoint returns empty responses

  describe('when endpoint is disabled', () => {
    it('should return empty delegation details without making API call when no wallet addresses provided', async () => {
      const params: WalletCheckDelegationRequestBody = {
        walletAddresses: [],
        chainIds: [mockChainId1],
      }

      const result = await checkWalletDelegation(params)

      expect(result).toEqual({
        requestId: '',
        delegationDetails: {},
      })
      expect(mockCheckWalletDelegationWithoutBatching).not.toHaveBeenCalled()
    })

    it('should return empty delegation details when walletAddresses is undefined', async () => {
      const params: WalletCheckDelegationRequestBody = {
        chainIds: [mockChainId1],
      }

      const result = await checkWalletDelegation(params)

      expect(result).toEqual({
        requestId: '',
        delegationDetails: {},
      })
      expect(mockCheckWalletDelegationWithoutBatching).not.toHaveBeenCalled()
    })

    it('should return empty response for single wallet address', async () => {
      const params: WalletCheckDelegationRequestBody = {
        walletAddresses: [mockAddress1],
        chainIds: [mockChainId1],
      }

      const result = await checkWalletDelegation(params)

      // Endpoint is disabled, should not make API calls
      expect(mockCheckWalletDelegationWithoutBatching).not.toHaveBeenCalled()
      expect(result).toEqual({
        requestId: '',
        delegationDetails: {},
      })
    })

    it('should return empty response for multiple wallet addresses', async () => {
      const params: WalletCheckDelegationRequestBody = {
        walletAddresses: [mockAddress1, mockAddress2],
        chainIds: [mockChainId1, mockChainId2],
      }

      const result = await checkWalletDelegation(params)

      // Endpoint is disabled, should not make API calls
      expect(mockCheckWalletDelegationWithoutBatching).not.toHaveBeenCalled()
      expect(result).toEqual({
        requestId: '',
        delegationDetails: {},
      })
    })

    it('should return empty response regardless of batch threshold', async () => {
      const manyWallets = Array.from({ length: 100 }, (_, i) => `0x${i.toString().padStart(40, '0')}` as Address)
      const params: WalletCheckDelegationRequestBody = {
        walletAddresses: manyWallets,
        chainIds: [mockChainId1, mockChainId2],
      }

      const result = await checkWalletDelegation(params, 10)

      // Endpoint is disabled, should not make API calls even with batching
      expect(mockCheckWalletDelegationWithoutBatching).not.toHaveBeenCalled()
      expect(result).toEqual({
        requestId: '',
        delegationDetails: {},
      })
    })
  })
})
