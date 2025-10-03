import { ETHEREUM_LOGO, UNICHAIN_LOGO } from 'ui/src/assets'
import { Chain as BackendChainId } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { DEFAULT_NATIVE_ADDRESS_LEGACY, getQuicknodeEndpointUrl } from 'uniswap/src/features/chains/evm/rpc'
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

const tokens = buildChainTokens({
  stables: {
    USDC: buildUSDC('0x078D782b760474a361dDA0AF3839290b0EF57AD6', UniverseChainId.Unichain),
  },
})

export const UNICHAIN_CHAIN_INFO = {
  // ...unichain, // TODO update once available from viem
  name: 'Unichain',
  id: UniverseChainId.Unichain,
  platform: Platform.EVM,
  assetRepoNetworkName: 'unichain',
  backendChain: {
    chain: BackendChainId.Unichain as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 6,
  blockWaitMsBeforeWarning: undefined,
  bridge: 'https://www.unichain.org/bridge',
  docs: 'https://docs.unichain.org',
  elementName: ElementName.ChainUnichain,
  explorer: {
    name: 'Unichain Explorer',
    url: 'https://uniscan.xyz/',
  },
  interfaceName: 'unichain',
  label: 'Unichain',
  logo: UNICHAIN_LOGO,
  nativeCurrency: {
    name: 'Unichain ETH',
    symbol: 'ETH',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: ETHEREUM_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Public]: { http: [getQuicknodeEndpointUrl(UniverseChainId.Unichain)] },
    [RPCType.Default]: { http: ['https://mainnet.unichain.org'] },
    [RPCType.Interface]: { http: [getQuicknodeEndpointUrl(UniverseChainId.Unichain)] },
  },
  tokens,
  statusPage: undefined,
  subblockTimeMs: 200,
  supportsV4: true,
  urlParam: 'unichain',
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x4200000000000000000000000000000000000006',
  },
  testnet: false,
  tradingApiPollingIntervalMs: 150,
} as const satisfies UniverseChainInfo
