import { ParsedQs } from 'qs'
import { useParams } from 'react-router'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { getChainInfo, UNIVERSE_CHAIN_INFO } from 'uniswap/src/features/chains/chainInfo'
import { GqlChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyField } from 'uniswap/src/types/currency'

// Legacy alias: ?chain=mainnet is accepted as alias for ?chain=ethereum
const CHAIN_INTERFACE_NAME_ALIASES: Record<string, string> = {
  mainnet: 'ethereum',
}

function resolveChainInterfaceName(name: string): string {
  return CHAIN_INTERFACE_NAME_ALIASES[name] ?? name
}

// i.e. ?chain=mainnet -> ethereum (via alias) or ?chain=ethereum -> ethereum
export function searchParamToBackendName(interfaceName: string | null): string | undefined {
  if (interfaceName === null) {
    return undefined
  }

  const resolvedName = resolveChainInterfaceName(interfaceName)
  const chain = Object.values(UNIVERSE_CHAIN_INFO).find((item) => item.interfaceName === resolvedName)
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

export function getParsedChainId(
  parsedQs?: ParsedQs,
  key: CurrencyField = CurrencyField.INPUT,
): UniverseChainId | undefined {
  const chain = key === CurrencyField.INPUT ? parsedQs?.chain : parsedQs?.outputChain
  if (!chain || typeof chain !== 'string') {
    return undefined
  }

  // Resolve legacy aliases (e.g., mainnet -> ethereum)
  const resolvedChain = resolveChainInterfaceName(chain)
  const chainInfo = Object.values(UNIVERSE_CHAIN_INFO).find((i) => i.interfaceName === resolvedChain)
  return chainInfo?.id
}
