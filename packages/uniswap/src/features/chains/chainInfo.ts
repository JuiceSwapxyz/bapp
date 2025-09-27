import { CITREA_TESTNET_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/citrea'
import { UniverseChainId, UniverseChainInfo } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getNonEmptyArrayOrThrow } from 'utilities/src/primitives/array'

export function getChainInfo(chainId: UniverseChainId): UniverseChainInfo {
  const chainInfo = UNIVERSE_CHAIN_INFO[chainId]
  if (!chainInfo) {
    throw new Error(`Chain info not found for chainId: ${chainId}`)
  }
  return chainInfo
}

// Check if Citrea-only mode is enabled (defaults to true)
const isCitreaOnlyEnabled = ((): boolean => {
  if (typeof window === 'undefined') {
    return true
  }
  try {
    const persistedState = localStorage.getItem('persist:interface')
    if (persistedState) {
      const parsed = JSON.parse(persistedState)
      if (parsed.userSettings) {
        const userSettings = JSON.parse(parsed.userSettings)
        return userSettings.isCitreaOnlyEnabled ?? true
      }
    }
  } catch (e) {
    // Default to Citrea-only mode if we can't read settings
  }
  return true
})()

// Lazy load other chains only if not in Citrea-only mode
const getOrderedChainsArray = (): UniverseChainInfo[] => {
  if (isCitreaOnlyEnabled) {
    return [CITREA_TESTNET_CHAIN_INFO]
  }

  // Only import other chains when needed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ARBITRUM_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/arbitrum') as typeof import('uniswap/src/features/chains/evm/info/arbitrum')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AVALANCHE_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/avalanche') as typeof import('uniswap/src/features/chains/evm/info/avalanche')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { BASE_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/base') as typeof import('uniswap/src/features/chains/evm/info/base')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { BLAST_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/blast') as typeof import('uniswap/src/features/chains/evm/info/blast')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { BNB_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/bnb') as typeof import('uniswap/src/features/chains/evm/info/bnb')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { CELO_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/celo') as typeof import('uniswap/src/features/chains/evm/info/celo')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MAINNET_CHAIN_INFO, SEPOLIA_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/mainnet') as typeof import('uniswap/src/features/chains/evm/info/mainnet')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MONAD_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/monad') as typeof import('uniswap/src/features/chains/evm/info/monad')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { OPTIMISM_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/optimism') as typeof import('uniswap/src/features/chains/evm/info/optimism')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { POLYGON_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/polygon') as typeof import('uniswap/src/features/chains/evm/info/polygon')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { SONEIUM_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/soneium') as typeof import('uniswap/src/features/chains/evm/info/soneium')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { UNICHAIN_CHAIN_INFO, UNICHAIN_SEPOLIA_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/unichain') as typeof import('uniswap/src/features/chains/evm/info/unichain')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { WORLD_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/worldchain') as typeof import('uniswap/src/features/chains/evm/info/worldchain')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ZKSYNC_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/zksync') as typeof import('uniswap/src/features/chains/evm/info/zksync')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ZORA_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/zora') as typeof import('uniswap/src/features/chains/evm/info/zora')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { SOLANA_CHAIN_INFO } =
    require('uniswap/src/features/chains/svm/info/solana') as typeof import('uniswap/src/features/chains/svm/info/solana')

  return [
    MAINNET_CHAIN_INFO,
    UNICHAIN_CHAIN_INFO,
    SOLANA_CHAIN_INFO,
    POLYGON_CHAIN_INFO,
    ARBITRUM_CHAIN_INFO,
    OPTIMISM_CHAIN_INFO,
    BASE_CHAIN_INFO,
    BNB_CHAIN_INFO,
    BLAST_CHAIN_INFO,
    AVALANCHE_CHAIN_INFO,
    CELO_CHAIN_INFO,
    WORLD_CHAIN_INFO,
    SONEIUM_CHAIN_INFO,
    ZORA_CHAIN_INFO,
    ZKSYNC_CHAIN_INFO,
    SEPOLIA_CHAIN_INFO,
    UNICHAIN_SEPOLIA_CHAIN_INFO,
    MONAD_CHAIN_INFO,
    CITREA_TESTNET_CHAIN_INFO,
  ]
}

export const ORDERED_CHAINS = getOrderedChainsArray() as UniverseChainInfo[]

type ConstChainInfo<P extends Platform = Platform> = UniverseChainInfo & { platform: P }

function getOrderedEVMChains(): ConstChainInfo<Platform.EVM>[] {
  const evmChains: ConstChainInfo<Platform.EVM>[] = []
  for (const chain of ORDERED_CHAINS) {
    if (chain.platform === Platform.EVM) {
      evmChains.push(chain as ConstChainInfo<Platform.EVM>)
    }
  }
  return evmChains
}

export const ALL_CHAIN_IDS: UniverseChainId[] = ORDERED_CHAINS.map((chain) => chain.id)

// Exported with narrow typing for viem config typing on web. Will throw if no EVM chain is provided in ORDERED_CHAINS.
export const ORDERED_EVM_CHAINS = getNonEmptyArrayOrThrow(getOrderedEVMChains())

export const ALL_EVM_CHAIN_IDS = ORDERED_EVM_CHAINS.map((chain) => chain.id)

// Typing ensures the `UNIVERSE_CHAIN_INFO` map contains a proper mapping for each item defined in `ORDERED_EVM_CHAINS` (all keys defined & keys match corresponding value's `id` field)
type AllChainsMap = {
  [chainId in UniverseChainId]?: UniverseChainInfo
}

const getUniverseChainInfoMap = (): AllChainsMap => {
  if (isCitreaOnlyEnabled) {
    return {
      [UniverseChainId.CitreaTestnet]: CITREA_TESTNET_CHAIN_INFO,
    } as AllChainsMap
  }

  // Only import other chains when needed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ARBITRUM_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/arbitrum') as typeof import('uniswap/src/features/chains/evm/info/arbitrum')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AVALANCHE_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/avalanche') as typeof import('uniswap/src/features/chains/evm/info/avalanche')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { BASE_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/base') as typeof import('uniswap/src/features/chains/evm/info/base')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { BLAST_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/blast') as typeof import('uniswap/src/features/chains/evm/info/blast')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { BNB_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/bnb') as typeof import('uniswap/src/features/chains/evm/info/bnb')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { CELO_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/celo') as typeof import('uniswap/src/features/chains/evm/info/celo')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MAINNET_CHAIN_INFO, SEPOLIA_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/mainnet') as typeof import('uniswap/src/features/chains/evm/info/mainnet')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MONAD_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/monad') as typeof import('uniswap/src/features/chains/evm/info/monad')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { OPTIMISM_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/optimism') as typeof import('uniswap/src/features/chains/evm/info/optimism')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { POLYGON_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/polygon') as typeof import('uniswap/src/features/chains/evm/info/polygon')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { SONEIUM_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/soneium') as typeof import('uniswap/src/features/chains/evm/info/soneium')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { UNICHAIN_CHAIN_INFO, UNICHAIN_SEPOLIA_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/unichain') as typeof import('uniswap/src/features/chains/evm/info/unichain')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { WORLD_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/worldchain') as typeof import('uniswap/src/features/chains/evm/info/worldchain')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ZKSYNC_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/zksync') as typeof import('uniswap/src/features/chains/evm/info/zksync')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ZORA_CHAIN_INFO } =
    require('uniswap/src/features/chains/evm/info/zora') as typeof import('uniswap/src/features/chains/evm/info/zora')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { SOLANA_CHAIN_INFO } =
    require('uniswap/src/features/chains/svm/info/solana') as typeof import('uniswap/src/features/chains/svm/info/solana')

  return {
    // MAINNETS
    [UniverseChainId.Mainnet]: MAINNET_CHAIN_INFO,
    [UniverseChainId.Unichain]: UNICHAIN_CHAIN_INFO,
    [UniverseChainId.Polygon]: POLYGON_CHAIN_INFO,
    [UniverseChainId.ArbitrumOne]: ARBITRUM_CHAIN_INFO,
    [UniverseChainId.Optimism]: OPTIMISM_CHAIN_INFO,
    [UniverseChainId.Base]: BASE_CHAIN_INFO,
    [UniverseChainId.Bnb]: BNB_CHAIN_INFO,
    [UniverseChainId.Blast]: BLAST_CHAIN_INFO,
    [UniverseChainId.Avalanche]: AVALANCHE_CHAIN_INFO,
    [UniverseChainId.Celo]: CELO_CHAIN_INFO,
    [UniverseChainId.WorldChain]: WORLD_CHAIN_INFO,
    [UniverseChainId.Soneium]: SONEIUM_CHAIN_INFO,
    [UniverseChainId.Zora]: ZORA_CHAIN_INFO,
    [UniverseChainId.Zksync]: ZKSYNC_CHAIN_INFO,

    // TESTNET
    [UniverseChainId.CitreaTestnet]: CITREA_TESTNET_CHAIN_INFO,
    [UniverseChainId.MonadTestnet]: MONAD_CHAIN_INFO,
    [UniverseChainId.Sepolia]: SEPOLIA_CHAIN_INFO,
    [UniverseChainId.UnichainSepolia]: UNICHAIN_SEPOLIA_CHAIN_INFO,

    // SVM
    [UniverseChainId.Solana]: SOLANA_CHAIN_INFO,
  } as AllChainsMap
}

export const UNIVERSE_CHAIN_INFO = getUniverseChainInfoMap()

export const GQL_MAINNET_CHAINS = ORDERED_EVM_CHAINS.filter((chain) => !chain.testnet).map(
  (chain) => chain.backendChain.chain,
)

export const GQL_TESTNET_CHAINS = ORDERED_EVM_CHAINS.filter((chain) => chain.testnet).map(
  (chain) => chain.backendChain.chain,
)
