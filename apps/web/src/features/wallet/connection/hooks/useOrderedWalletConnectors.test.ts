import { useRecentConnectorId } from 'components/Web3Provider/constants'
import { useOrderedWalletConnectors } from 'features/wallet/connection/hooks/useOrderedWalletConnectors'
import { useWalletConnectors } from 'features/wallet/connection/hooks/useWalletConnectors'
import { WalletConnectorMeta } from 'features/wallet/connection/types/WalletConnectorMeta'
import { mocked } from 'test-utils/mocked'
import { renderHook } from 'test-utils/render'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

// eslint-disable-next-line no-var
var mockIsMobileWeb = false
vi.mock('utilities/src/platform', async () => {
  const actual = await vi.importActual('utilities/src/platform')
  return {
    ...actual,
    get isMobileWeb() {
      return mockIsMobileWeb
    },
  }
})

vi.mock('features/wallet/connection/hooks/useWalletConnectors', () => ({
  useWalletConnectors: vi.fn(),
}))

vi.mock('components/Web3Provider/constants', async () => {
  const actual = await vi.importActual('components/Web3Provider/constants')
  return {
    ...actual,
    useRecentConnectorId: vi.fn(),
  }
})

vi.mock('uniswap/src/features/gating/hooks', () => ({
  useFeatureFlag: vi.fn(),
  getFeatureFlag: vi.fn(),
}))

const createWagmiWalletConnector = (overrides: Partial<WalletConnectorMeta> = {}): WalletConnectorMeta => ({
  name: 'Test Wallet',
  icon: 'test-icon',
  isInjected: false,
  wagmi: { id: 'test-connector-id', type: 'injected' },
  analyticsWalletType: 'Browser Extension',
  ...overrides,
})

const createCustomWalletConnector = (overrides: Partial<WalletConnectorMeta> = {}): WalletConnectorMeta => ({
  name: 'Test Custom Wallet',
  icon: 'test-icon',
  isInjected: false,
  customConnectorId: CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID,
  analyticsWalletType: 'Wallet Connect',
  ...overrides,
})

const DEFAULT_CONNECTORS: WalletConnectorMeta[] = [
  createWagmiWalletConnector({
    name: 'MetaMask',
    wagmi: { id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS, type: 'injected' },
    isInjected: true,
  }),
  createWagmiWalletConnector({
    name: 'WalletConnect',
    wagmi: { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID, type: 'walletConnect' },
    isInjected: false,
    analyticsWalletType: 'Wallet Connect',
  }),
  createWagmiWalletConnector({
    name: 'Coinbase Wallet',
    wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID, type: 'coinbaseWallet' },
    isInjected: false,
    analyticsWalletType: 'Coinbase Wallet',
  }),
]

describe('useOrderedWalletConnectors', () => {
  beforeEach(() => {
    mockIsMobileWeb = false
    mocked(useWalletConnectors).mockReturnValue(DEFAULT_CONNECTORS)
    mocked(useFeatureFlag).mockImplementation((flag) => {
      if (flag === FeatureFlags.Solana) {
        return false
      }
      return false
    })
    mocked(useRecentConnectorId).mockReturnValue(undefined)
  })

  it('should return ordered connectors', () => {
    const { result } = renderHook(() => useOrderedWalletConnectors({ showSecondaryConnectors: false }))

    const expectedConnectors = [
      { wagmi: { id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS, type: 'injected' } },
      { wagmi: { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID, type: 'walletConnect' } },
      { wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID, type: 'coinbaseWallet' } },
    ]

    result.current.forEach((connector, index) => {
      expect(connector.wagmi?.id).toEqual(expectedConnectors[index].wagmi.id)
      expect(connector.wagmi?.type).toEqual(expectedConnectors[index].wagmi.type)
    })
    expect(result.current.length).toEqual(expectedConnectors.length)
  })

  it('should throw an error if expected connectors are missing', () => {
    mocked(useWalletConnectors).mockReturnValue([
      createWagmiWalletConnector({
        name: 'WalletConnect',
        wagmi: { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID, type: 'walletConnect' },
        isInjected: false,
        analyticsWalletType: 'Wallet Connect',
      }),
    ])
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { result } = renderHook(() => useOrderedWalletConnectors({ showSecondaryConnectors: false }))
    expect(result.error?.message).toEqual('Expected connector coinbaseWalletSDK missing from connectors array.')
  })

  it('should place the most recent connector at the top of the list', () => {
    mocked(useRecentConnectorId).mockReturnValue(CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID)
    const { result } = renderHook(() => useOrderedWalletConnectors({ showSecondaryConnectors: false }))

    const expectedConnectors = [
      { wagmi: { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID, type: 'walletConnect' } },
      { wagmi: { id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS, type: 'injected' } },
      { wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID, type: 'coinbaseWallet' } },
    ]

    result.current.forEach((connector, index) => {
      expect(connector.wagmi?.id).toEqual(expectedConnectors[index].wagmi.id)
      expect(connector.wagmi?.type).toEqual(expectedConnectors[index].wagmi.type)
    })
    expect(result.current.length).toEqual(expectedConnectors.length)
  })

  it('should return only injected connectors for in-wallet browsers', () => {
    mockIsMobileWeb = true
    const { result } = renderHook(() => useOrderedWalletConnectors({ showSecondaryConnectors: false }))
    expect(result.current.length).toEqual(1)
    expect(result.current[0].wagmi?.id).toEqual(CONNECTION_PROVIDER_IDS.METAMASK_RDNS)
  })

  it('should return only the Coinbase connector in the Coinbase Wallet', () => {
    mockIsMobileWeb = true
    mocked(useWalletConnectors).mockReturnValue([
      ...DEFAULT_CONNECTORS,
      createWagmiWalletConnector({
        name: 'Coinbase Injected',
        wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_RDNS, type: 'injected' },
        isInjected: true,
      }),
    ])
    const { result } = renderHook(() => useOrderedWalletConnectors({ showSecondaryConnectors: false }))
    expect(result.current.length).toEqual(1)
    expect(result.current[0].wagmi?.id).toEqual(CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID)
  })

  describe('with showSecondaryConnectors', () => {
    it('should show mobile connectors and filter out recent connector', () => {
      mocked(useRecentConnectorId).mockReturnValue(CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID)
      const { result } = renderHook(() => useOrderedWalletConnectors({ showSecondaryConnectors: true }))

      const expectedConnectors = [
        { wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID, type: 'coinbaseWallet' } },
      ]

      result.current.forEach((connector, index) => {
        expect(connector.wagmi?.id).toEqual(expectedConnectors[index].wagmi.id)
        expect(connector.wagmi?.type).toEqual(expectedConnectors[index].wagmi.type)
      })
      expect(result.current.length).toEqual(expectedConnectors.length)
    })

    it('should show all mobile connectors when no recent connector', () => {
      const { result } = renderHook(() => useOrderedWalletConnectors({ showSecondaryConnectors: true }))

      const expectedConnectors = [
        { wagmi: { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID, type: 'walletConnect' } },
        { wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID, type: 'coinbaseWallet' } },
      ]

      result.current.forEach((connector, index) => {
        expect(connector.wagmi?.id).toEqual(expectedConnectors[index].wagmi.id)
        expect(connector.wagmi?.type).toEqual(expectedConnectors[index].wagmi.type)
      })
      expect(result.current.length).toEqual(expectedConnectors.length)
    })
  })
})
