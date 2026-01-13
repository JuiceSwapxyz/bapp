import { BTC_LOGO } from 'ui/src/assets'
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

const testnetTokens = buildChainTokens({
  stables: {
    USDC: buildUSDC('0x36c16eaC6B0Ba6c50f494914ff015fCa95B7835F', UniverseChainId.Bitcoin),
  },
})

const citreaTestnet = defineChain({
  id: UniverseChainId.Bitcoin,
  name: 'Bitcoin Network',
  network: 'bitcoin',
  nativeCurrency: {
    name: 'BTC',
    symbol: 'BTC',
    decimals: 18,
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
      name: 'No Explorer',
      url: 'https://no-explorer.com/',
    },
  },
  contracts: {},
})

export const BITCOIN_CHAIN_INFO = {
  ...citreaTestnet,
  id: UniverseChainId.Bitcoin,
  platform: Platform.NonEvm,
  assetRepoNetworkName: undefined,
  backendChain: {
    chain: 'BITCOIN' as GqlChainId,
    backendSupported: false, // Not supported by Uniswap Data API - uses JuiceSwap API instead
    nativeTokenBackendAddress: ZERO_ADDRESS,
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: undefined,
  bridge: undefined,
  docs: 'https://no-docs.com/',
  elementName: ElementName.DocsLink,
  explorer: {
    name: 'No Explorer',
    url: 'https://no-explorer.com/',
  },
  interfaceName: 'bitcoin',
  label: 'Bitcoin Network',
  logo: BTC_LOGO,
  nativeCurrency: {
    name: 'BTC',
    symbol: 'BTC',
    decimals: 8,
    address: DEFAULT_NATIVE_ADDRESS,
    explorerLink: undefined,
    logo: BTC_LOGO,
  },
  networkLayer: NetworkLayer.L1,
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
  tokens: testnetTokens,
  statusPage: undefined,
  supportsV4: false,
  urlParam: 'bitcoin',
  wrappedNativeCurrency: {
    name: 'Wrapped Citrea BTC',
    symbol: 'WcBTC',
    decimals: 8,
    address: '0x4370e27F7d91D9341bFf232d7Ee8bdfE3a9933a0',
  },
  faucetUrl: 'https://no-faucet.com/',
  tradingApiPollingIntervalMs: 500,
} as const satisfies UniverseChainInfo
