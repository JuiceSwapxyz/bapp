import { ADDRESS } from '@juicedollar/jusd'
import { ChainId, WETH9 } from '@juiceswapxyz/sdk-core'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { CITREA_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DEFAULT_NATIVE_ADDRESS_LEGACY } from 'uniswap/src/features/chains/evm/rpc'
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
import { defineChain } from 'viem'

const CITREA_MAINNET_EXPLORER_URL = config.citreaMainnetExplorerUrl

const mainnetTokens = buildChainTokens({
  stables: {
    JUSD: new Token(
      UniverseChainId.CitreaMainnet,
      ADDRESS[4114]!.juiceDollar,
      18,
      'JUSD',
      'JuiceSwap USD',
    ),
  },
})

const citreaMainnet = defineChain({
  id: UniverseChainId.CitreaMainnet,
  name: 'Citrea Mainnet',
  network: 'citrea-mainnet',
  nativeCurrency: {
    name: 'Citrea BTC',
    symbol: 'cBTC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.citreascan.com'],
    },
    public: {
      http: ['https://rpc.citreascan.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Citrea Mainnet Explorer',
      url: CITREA_MAINNET_EXPLORER_URL,
      apiUrl: `${CITREA_MAINNET_EXPLORER_URL}/api`,
    },
  },
  contracts: {},
  testnet: false,
})

export const CITREA_MAINNET_CHAIN_INFO = {
  ...citreaMainnet,
  id: UniverseChainId.CitreaMainnet,
  platform: Platform.EVM,
  assetRepoNetworkName: undefined,
  backendChain: {
    chain: 'CITREA_MAINNET' as GqlChainId,
    backendSupported: false, // Not supported by Uniswap Data API - uses JuiceSwap API instead
    nativeTokenBackendAddress: ZERO_ADDRESS,
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: undefined,
  bridge: undefined,
  docs: 'https://docs.citrea.xyz/',
  elementName: ElementName.ChainCitreaTestnet,
  explorer: {
    name: 'Citrea Mainnet Explorer',
    url: `${CITREA_MAINNET_EXPLORER_URL}/`,
    apiURL: `${CITREA_MAINNET_EXPLORER_URL}/api`,
  },
  interfaceName: 'citrea_mainnet',
  label: 'Citrea Mainnet',
  logo: CITREA_LOGO,
  nativeCurrency: {
    name: 'Citrea BTC',
    symbol: 'cBTC',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    explorerLink: `${CITREA_MAINNET_EXPLORER_URL}/`,
    logo: CITREA_LOGO,
  },
  networkLayer: NetworkLayer.L2, // Citrea is a Bitcoin rollup (L2)
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Public]: {
      http: ['https://rpc.citreascan.com'],
    },
    [RPCType.Default]: {
      http: ['https://rpc.citreascan.com'],
    },
    [RPCType.Fallback]: {
      http: ['https://rpc.citreascan.com'],
    },
    [RPCType.Interface]: {
      http: ['https://rpc.citreascan.com'],
    },
  },
  // Use string to avoid JavaScript number precision issues (100e18 > MAX_SAFE_INTEGER)
  spotPriceStablecoinAmountOverride: CurrencyAmount.fromRawAmount(mainnetTokens.JUSD, '100000000000000000000'),
  tokens: mainnetTokens,
  statusPage: undefined,
  supportsV4: false,
  urlParam: 'citrea_mainnet',
  wrappedNativeCurrency: {
    name: 'Wrapped Citrea BTC',
    symbol: 'WcBTC',
    decimals: 18,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    address: WETH9[ChainId.CITREA_MAINNET]!.address,
  },
  faucetUrl: 'https://citrea.xyz/faucet',
  tradingApiPollingIntervalMs: 500,
} as const satisfies UniverseChainInfo
