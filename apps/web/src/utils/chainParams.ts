import { ParsedQs } from 'qs'
import { useParams } from 'react-router'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { getChainInfo, UNIVERSE_CHAIN_INFO } from 'uniswap/src/features/chains/chainInfo'
import { GqlChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import { ALWAYS_ENABLED_CHAIN_IDS } from 'uniswap/src/features/chains/utils'
import { CurrencyField } from 'uniswap/src/types/currency'

// i.e. ?chain=mainnet -> ethereum
export function searchParamToBackendName(interfaceName: string | null): string | undefined {
  if (interfaceName === null) {
    return undefined
  }

  const chain = Object.values(UNIVERSE_CHAIN_INFO).find((item) => item.interfaceName === interfaceName)
  return chain ? chain.urlParam : undefined
}

export function isChainUrlParam(str: string): boolean {
  return !!str && Object.values(UNIVERSE_CHAIN_INFO).some((chain) => chain.urlParam === str)
}

export function getChainIdFromChainUrlParam(chainUrlParam?: string): UniverseChainId | undefined {
  return chainUrlParam !== undefined
    ? Object.values(UNIVERSE_CHAIN_INFO).find((chain) => chainUrlParam === chain.urlParam)?.id
    : undefined
}

export function getChainIdFromBackendChain(backendChain: GqlChainId): UniverseChainId | undefined {
  return Object.values(UNIVERSE_CHAIN_INFO).find((chain) => backendChain === chain.backendChain.chain)?.id
}

export function getChainUrlParam(chainId: UniverseChainId) {
  return getChainInfo(chainId).urlParam
}

export const CITREA_CHAIN_URL_PARAMS = new Set(ALWAYS_ENABLED_CHAIN_IDS.map((id) => getChainInfo(id).urlParam))

export function useChainIdFromUrlParam(): UniverseChainId | undefined {
  const chainName = useParams<{ chainName?: string }>().chainName
  // In the case where /explore/:chainName is used, the chainName is passed as a tab param
  const tab = useParams<{ tab?: string }>().tab
  const chainId = getChainIdFromChainUrlParam(chainName ?? tab)
  return chainId
}

// Chain name aliases for better URL readability
// Note: 'citrea' is handled dynamically in getParsedChainId based on testnet mode
const CHAIN_NAME_ALIASES: Record<string, string> = {
  ethereum: 'mainnet',
  eth: 'mainnet',
}

interface GetParsedChainIdOptions {
  parsedQs?: ParsedQs
  key?: CurrencyField
  isTestnetModeEnabled?: boolean
}

export function getParsedChainId(options: GetParsedChainIdOptions = {}): UniverseChainId | undefined {
  const { parsedQs, key = CurrencyField.INPUT, isTestnetModeEnabled } = options
  // Handle both camelCase and lowercase variants (browsers may lowercase query params)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const chain =
    key === CurrencyField.INPUT
      ? parsedQs?.chain ?? (parsedQs as any)?.Chain
      : parsedQs?.outputChain ?? (parsedQs as any)?.outputchain ?? (parsedQs as any)?.OutputChain
  if (!chain || typeof chain !== 'string') {
    return undefined
  }

  const chainLower = chain.toLowerCase()

  // Handle 'citrea' alias dynamically based on testnet mode
  // This ensures users are directed to the correct network (mainnet by default, testnet only when enabled)
  if (chainLower === 'citrea') {
    return isTestnetModeEnabled ? UniverseChainId.CitreaTestnet : UniverseChainId.CitreaMainnet
  }

  // Resolve other aliases (e.g., ethereum -> mainnet)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const normalizedChain = CHAIN_NAME_ALIASES[chainLower] ?? chain

  const chainInfo = Object.values(UNIVERSE_CHAIN_INFO).find((i) => i.interfaceName === normalizedChain)
  return chainInfo?.id
}
