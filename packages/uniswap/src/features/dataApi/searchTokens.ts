import { useQuery } from '@tanstack/react-query'
import { SearchTokensResponse, SearchType } from '@uniswap/client-search/dist/search/v1/api_pb'
import { useMemo } from 'react'
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
  const hardcodedResults = useMemo(() => {
    if (skip || !searchQuery) {
      return []
    }
    const results = searchHardcodedTokens(searchQuery, chainFilter)
    // Enrich with safety information
    return results.map((token) => enrichHardcodedTokenWithSafety(token))
  }, [searchQuery, chainFilter, skip])

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

    // Merge results: hardcoded tokens first, then on-chain results
    // Remove duplicates based on currencyId
    const seen = new Set<string>()
    const merged: CurrencyInfo[] = []

    // Add hardcoded tokens first (higher priority)
    for (const token of hardcodedResults) {
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

  const {
    data: tokens,
    error,
    isPending,
    refetch,
  } = useQuery({
    queryKey: ['searchTokens-custom', variables, hardcodedResults],
    queryFn: async () => {
      // If we already have hardcoded results and the query doesn't look like an address,
      // skip the on-chain fetch to improve performance
      const isLikelyAddress = variables.searchQuery?.startsWith('0x') && variables.searchQuery.length > 10

      if (hardcodedResults.length > 0 && !isLikelyAddress) {
        // Return empty response, hardcoded results will be merged in tokenSelect
        return new SearchTokensResponse({ tokens: [] })
      }

      // Try to fetch on-chain data for addresses or when no hardcoded results
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
