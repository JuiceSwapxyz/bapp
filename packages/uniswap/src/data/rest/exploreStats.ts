import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { createPonderApiClient } from 'uniswap/src/data/apiClients/ponderApi/PonderApi'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

type ExploreStatsResponse = {
  stats: {
    transactionStats: unknown[]
  }
}

const PonderApiClient = createPonderApiClient()

const fetchExploreStats = (chainId?: number): Promise<ExploreStatsResponse> => {
  return PonderApiClient.get<ExploreStatsResponse>(`/exploreStats`, {
    params: chainId ? { chainId } : undefined,
  })
}

/**
 * Wrapper around Tanstack useQuery for the Uniswap REST BE service ExploreStats
 * This included top tokens and top pools data
 */
export function useExploreStatsQuery<TSelectType>({
  chainId,
  enabled,
  select,
}: {
  chainId?: UniverseChainId
  enabled?: boolean
  select?: ((data: ExploreStatsResponse) => TSelectType) | undefined
}): UseQueryResult<TSelectType, Error> {
  return useQuery({
    queryKey: ['exploreStats', chainId],
    queryFn: () => fetchExploreStats(chainId),
    enabled,
    select,
  })
}
