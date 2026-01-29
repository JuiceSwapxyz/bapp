import { useQuery } from '@tanstack/react-query'
import { SearchTokensResponse, SearchType } from '@uniswap/client-search/dist/search/v1/api_pb'
import { useMemo } from 'react'
import { fetchPoolTokens } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { fetchTokenDataDirectly, searchTokenToCurrencyInfo } from 'uniswap/src/data/rest/searchTokensAndPools'
import { GqlResult } from 'uniswap/src/data/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { NUMBER_OF_RESULTS_LONG } from 'uniswap/src/features/search/SearchModal/constants'
import {
  enrichHardcodedTokenWithSafety,
  searchHardcodedTokens,
} from 'uniswap/src/features/tokens/searchHardcodedTokens'
import { toSdkCoreChainId } from 'uniswap/src/features/chains/utils'
import {
  HIDDEN_TOKEN_SYMBOLS,
  POOL_TOKENS_STALE_TIME_MS,
  poolTokenToCurrencyInfo,
} from 'uniswap/src/features/tokens/poolTokenUtils'
import { useEvent } from 'utilities/src/react/hooks'

export function useSearchTokens({
  searchQuery,
  chainFilter,
  skip,
  size = NUMBER_OF_RESULTS_LONG,
}: {
  searchQuery: string | null
  chainFilter: UniverseChainId | null
  skip: boolean
  size?: number
}): GqlResult<CurrencyInfo[]> {
  const { chains: enabledChainIds } = useEnabledChains()

  // Search hardcoded tokens first
  // Use enabledChainIds[0] as fallback to respect testnet mode when chainFilter is null
  const effectiveChainFilter = chainFilter ?? enabledChainIds[0] ?? null
  const hardcodedResults = useMemo(() => {
    if (skip || !searchQuery) {
      return []
    }
    const results = searchHardcodedTokens(searchQuery, effectiveChainFilter)
    // Enrich with safety information
    return results.map((token) => enrichHardcodedTokenWithSafety(token))
  }, [searchQuery, effectiveChainFilter, skip])

  // Fetch pool tokens for the chain
  const numericChainId = effectiveChainFilter ? toSdkCoreChainId(effectiveChainFilter) : undefined

  const { data: poolTokensResponse } = useQuery({
    queryKey: ['poolTokens', numericChainId],
    queryFn: () => (numericChainId ? fetchPoolTokens(numericChainId) : Promise.resolve({ tokens: [] })),
    staleTime: POOL_TOKENS_STALE_TIME_MS,
    enabled: !skip && !!numericChainId,
  })

  // Filter pool tokens by search query
  const poolTokenResults = useMemo(() => {
    if (skip || !searchQuery || !poolTokensResponse?.tokens) {
      return []
    }
    const query = searchQuery.toLowerCase().trim()

    return poolTokensResponse.tokens
      .filter((token) => {
        if (HIDDEN_TOKEN_SYMBOLS.has(token.symbol)) {
          return false
        }
        if (token.symbol.toLowerCase().includes(query)) {
          return true
        }
        if (token.name.toLowerCase().includes(query)) {
          return true
        }
        const cleanQuery = query.startsWith('0x') ? query.slice(2) : query
        const cleanAddress = token.address.toLowerCase().replace('0x', '')
        if (cleanAddress.includes(cleanQuery)) {
          return true
        }
        return false
      })
      .map((token) => poolTokenToCurrencyInfo(token))
      .filter((c): c is CurrencyInfo => Boolean(c))
      .map((token) => enrichHardcodedTokenWithSafety(token))
  }, [searchQuery, poolTokensResponse, skip])

  const variables = useMemo(
    () => ({
      searchQuery: searchQuery ?? undefined,
      chainIds: chainFilter ? [chainFilter] : enabledChainIds,
      searchType: SearchType.TOKEN,
      page: 1,
      size,
    }),
    [searchQuery, chainFilter, size, enabledChainIds],
  )

  const tokenSelect = useEvent((data: SearchTokensResponse): CurrencyInfo[] => {
    const onchainTokens = data.tokens
      .map((token) => searchTokenToCurrencyInfo(token))
      .filter((c): c is CurrencyInfo => Boolean(c))

    // Merge results: hardcoded tokens first, then pool tokens, then on-chain results
    // Remove duplicates based on currencyId
    const seen = new Set<string>()
    const merged: CurrencyInfo[] = []

    // Add hardcoded tokens first (highest priority)
    for (const token of hardcodedResults) {
      if (!seen.has(token.currencyId)) {
        seen.add(token.currencyId)
        merged.push(token)
      }
    }

    // Add pool tokens (from Ponder API)
    for (const token of poolTokenResults) {
      if (!seen.has(token.currencyId)) {
        seen.add(token.currencyId)
        merged.push(token)
      }
    }

    // Add on-chain tokens (avoid duplicates)
    for (const token of onchainTokens) {
      if (!seen.has(token.currencyId)) {
        seen.add(token.currencyId)
        merged.push(token)
      }
    }

    return merged.slice(0, size)
  })

  // Create stable key identifiers for query key (length + first element currencyId)
  const hardcodedKey =
    hardcodedResults.length > 0 ? `${hardcodedResults.length}-${hardcodedResults[0]?.currencyId}` : ''
  const poolKey = poolTokenResults.length > 0 ? `${poolTokenResults.length}-${poolTokenResults[0]?.currencyId}` : ''

  const {
    data: tokens,
    error,
    isPending,
    refetch,
  } = useQuery({
    queryKey: ['searchTokens-custom', variables, hardcodedKey, poolKey],
    queryFn: async () => {
      // If we already have hardcoded or pool token results and the query doesn't look like an address,
      // skip the on-chain fetch to improve performance
      const isLikelyAddress = variables.searchQuery?.startsWith('0x') && variables.searchQuery.length > 10
      const hasLocalResults = hardcodedResults.length > 0 || poolTokenResults.length > 0

      if (hasLocalResults && !isLikelyAddress) {
        // Return empty response, hardcoded/pool results will be merged in tokenSelect
        return new SearchTokensResponse({ tokens: [] })
      }

      // Try to fetch on-chain data for addresses or when no local results
      try {
        const token = await fetchTokenDataDirectly(variables.searchQuery ?? '', variables.chainIds[0] ?? 1)
        return new SearchTokensResponse({ tokens: token ? [token] : [] })
      } catch {
        // If on-chain fetch fails, return empty response
        return new SearchTokensResponse({ tokens: [] })
      }
    },
    enabled: !skip,
    select: tokenSelect,
  })

  return useMemo(
    () => ({ data: tokens, loading: isPending, error: error ?? undefined, refetch }),
    [tokens, isPending, error, refetch],
  )
}
