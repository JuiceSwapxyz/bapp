import { ParsedQs } from 'qs'
import { useParams } from 'react-router'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { getChainInfo, UNIVERSE_CHAIN_INFO } from 'uniswap/src/features/chains/chainInfo'
import { GqlChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
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

export function useChainIdFromUrlParam(): UniverseChainId | undefined {
  const chainName = useParams<{ chainName?: string }>().chainName
  // In the case where /explore/:chainName is used, the chainName is passed as a tab param
  const tab = useParams<{ tab?: string }>().tab
  const chainId = getChainIdFromChainUrlParam(chainName ?? tab)
  return chainId
}

// Chain name aliases for better URL readability
const CHAIN_NAME_ALIASES: Record<string, string> = {
  ethereum: 'mainnet',
  eth: 'mainnet',
  citrea: 'citrea_testnet',
}

export function getParsedChainId(
  parsedQs?: ParsedQs,
  key: CurrencyField = CurrencyField.INPUT,
): UniverseChainId | undefined {
  // Handle both camelCase and lowercase variants (browsers may lowercase query params)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const chain =
    key === CurrencyField.INPUT
      ? parsedQs?.chain ?? (parsedQs as any)?.Chain
      : parsedQs?.outputChain ?? (parsedQs as any)?.outputchain ?? (parsedQs as any)?.OutputChain
  if (!chain || typeof chain !== 'string') {
    return undefined
  }

  // Resolve aliases (e.g., ethereum -> mainnet)
  const normalizedChain = CHAIN_NAME_ALIASES[chain.toLowerCase()] ?? chain

  const chainInfo = Object.values(UNIVERSE_CHAIN_INFO).find((i) => i.interfaceName === normalizedChain)
  return chainInfo?.id
}
