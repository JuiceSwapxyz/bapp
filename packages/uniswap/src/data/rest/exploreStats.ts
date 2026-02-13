import { ExploreStatsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const juiceSwapApiClient = createApiClient({
  baseUrl: (process.env.REACT_APP_TRADING_API_URL_OVERRIDE || process.env.REACT_APP_JUICESWAP_API_URL) as string,
})

const fetchExploreStats = (chainId?: number): Promise<ExploreStatsResponse> => {
  return juiceSwapApiClient.get<ExploreStatsResponse>('/v1/explore/stats', {
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
