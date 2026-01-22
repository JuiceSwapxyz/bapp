import { ChainId, WETH9 } from '@juiceswapxyz/sdk-core'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { CITREA_LOGO } from 'ui/src/assets'
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
import { buildCUSD, buildUSDC } from 'uniswap/src/features/tokens/stablecoin'
import { defineChain } from 'viem'

const testnetTokens = buildChainTokens({
  stables: {
    USDC: buildUSDC('0x36c16eaC6B0Ba6c50f494914ff015fCa95B7835F', UniverseChainId.CitreaTestnet),
    CUSD: buildCUSD('0x2fFC18aC99D367b70dd922771dF8c2074af4aCE0', UniverseChainId.CitreaTestnet),
    JUSD: new Token(
      UniverseChainId.CitreaTestnet,
      '0xFdB0a83d94CD65151148a131167Eb499Cb85d015',
      18,
      'JUSD',
      'JuiceSwap USD',
    ),
  },
})

const citreaTestnet = defineChain({
  id: UniverseChainId.CitreaTestnet,
  name: 'Citrea Testnet',
  network: 'citrea-testnet',
  nativeCurrency: {
    name: 'Citrea BTC',
    symbol: 'cBTC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.citrea.xyz'],
    },
    public: {
      http: ['https://rpc.testnet.citrea.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Citrea Testnet Explorer',
      url: 'https://testnet.citreascan.com',
      apiUrl: 'https://testnet.citreascan.com/api',
    },
  },
  contracts: {},
  testnet: true,
})

export const CITREA_TESTNET_CHAIN_INFO = {
  ...citreaTestnet,
  id: UniverseChainId.CitreaTestnet,
  platform: Platform.EVM,
  assetRepoNetworkName: undefined,
  backendChain: {
    chain: 'CITREA_TESTNET' as GqlChainId,
    backendSupported: false, // Not supported by Uniswap Data API - uses JuiceSwap API instead
    nativeTokenBackendAddress: ZERO_ADDRESS,
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: undefined,
  bridge: undefined,
  docs: 'https://docs.citrea.xyz/',
  elementName: ElementName.ChainCitreaTestnet,
  explorer: {
    name: 'Citrea Testnet Explorer',
    url: 'https://testnet.citreascan.com/',
    apiURL: 'https://testnet.citreascan.com/api',
  },
  interfaceName: 'citrea_testnet',
  label: 'Citrea Testnet',
  logo: CITREA_LOGO,
  nativeCurrency: {
    name: 'Citrea BTC',
    symbol: 'cBTC',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    explorerLink: 'https://testnet.citreascan.com/',
    logo: CITREA_LOGO,
  },
  networkLayer: NetworkLayer.L2, // Citrea is a Bitcoin rollup (L2)
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Public]: {
      http: ['https://rpc.testnet.citrea.xyz'],
    },
    [RPCType.Default]: {
      http: ['https://rpc.testnet.citrea.xyz'],
    },
    [RPCType.Fallback]: {
      http: ['https://rpc.testnet.citrea.xyz'],
    },
    [RPCType.Interface]: {
      http: ['https://rpc.testnet.citrea.xyz'],
    },
  },
  spotPriceStablecoinAmountOverride: CurrencyAmount.fromRawAmount(testnetTokens.USDC, 100e6),
  tokens: testnetTokens,
  statusPage: undefined,
  supportsV4: false,
  urlParam: 'citrea_testnet',
  wrappedNativeCurrency: {
    name: 'Wrapped Citrea BTC',
    symbol: 'WcBTC',
    decimals: 18,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    address: WETH9[ChainId.CITREA_TESTNET]!.address,
  },
  faucetUrl: 'https://citrea.xyz/faucet',
  tradingApiPollingIntervalMs: 500,
} as const satisfies UniverseChainInfo
