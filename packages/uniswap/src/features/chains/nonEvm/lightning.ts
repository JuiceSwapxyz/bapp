import { LIGHTNING_LOGO } from 'ui/src/assets'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/rpc'
import { buildChainTokens } from 'uniswap/src/features/chains/evm/tokens'
import {
  GqlChainId,
  NetworkLayer,
  RPCType,
  UniverseChainId,
  UniverseChainInfo,
} from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { buildUSDC } from 'uniswap/src/features/tokens/stablecoin'
import { defineChain } from 'viem'

const lightningTokens = buildChainTokens({
  stables: {
    USDC: buildUSDC('0x36c16eaC6B0Ba6c50f494914ff015fCa95B7835F', UniverseChainId.LightningNetwork),
  },
})

const lightningChain = defineChain({
  id: UniverseChainId.LightningNetwork,
  name: 'Bitcoin Lightning Network',
  network: 'lightning',
  nativeCurrency: {
    name: 'BTC',
    symbol: 'BTC',
    decimals: 8,
  },
  rpcUrls: {
    default: {
      http: ['YOUR_RPC_URL_HERE'],
    },
    public: {
      http: ['YOUR_RPC_URL_HERE'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Lightning Explorer',
      url: 'https://1ml.com/',
    },
  },
  contracts: {},
})

export const LIGHTNING_NETWORK_CHAIN_INFO = {
  ...lightningChain,
  id: UniverseChainId.LightningNetwork,
  platform: Platform.EVM,
  assetRepoNetworkName: undefined,
  backendChain: {
    chain: 'LIGHTNING' as GqlChainId,
    backendSupported: false, // Not supported by Uniswap Data API - uses JuiceSwap API instead
    nativeTokenBackendAddress: ZERO_ADDRESS,
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: undefined,
  bridge: undefined,
  docs: 'https://lightning.network/',
  elementName: ElementName.DocsLink,
  explorer: {
    name: 'Lightning Explorer',
    url: 'https://1ml.com/',
  },
  interfaceName: 'lightning',
  label: 'Lightning Network',
  logo: LIGHTNING_LOGO,
  nativeCurrency: {
    name: 'Lightning BTC',
    symbol: 'lnBTC',
    decimals: 8,
    address: DEFAULT_NATIVE_ADDRESS,
    explorerLink: undefined,
    logo: LIGHTNING_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Public]: {
      http: ['YOUR_RPC_URL_HERE'],
    },
    [RPCType.Default]: {
      http: ['YOUR_RPC_URL_HERE'],
    },
    [RPCType.Fallback]: {
      http: ['YOUR_RPC_URL_HERE'],
    },
    [RPCType.Interface]: {
      http: ['YOUR_RPC_URL_HERE'],
    },
  },
  tokens: lightningTokens,
  statusPage: undefined,
  supportsV4: false,
  urlParam: 'lightning',
  wrappedNativeCurrency: {
    name: 'Wrapped Lightning BTC',
    symbol: 'WLBTC',
    decimals: 8,
    address: '0x0000000000000000000000000000000000000000',
  },
  faucetUrl: undefined,
  tradingApiPollingIntervalMs: 500,
} as const satisfies UniverseChainInfo
