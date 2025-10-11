import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'

type ExploreStatsResponse = {
  stats: {
    transactionStats: unknown[]
  }
}

const PonderApiClient = createApiClient({
  baseUrl: process.env.REACT_APP_PONDER_JUICESWAP_URL || '',
})

const fetchExploreStats = (): Promise<ExploreStatsResponse> => {
  return PonderApiClient.get<ExploreStatsResponse>(`/exploreStats`)
}

/**
 * Wrapper around Tanstack useQuery for the Uniswap REST BE service ExploreStats
 * This included top tokens and top pools data
 */
export function useExploreStatsQuery<TSelectType>({
  enabled,
  select,
}: {
  enabled?: boolean
  select?: ((data: ExploreStatsResponse) => TSelectType) | undefined
}): UseQueryResult<TSelectType, Error> {
  return useQuery({
    queryKey: ['exploreStats'],
    queryFn: () => fetchExploreStats(),
    enabled,
    select,
  })
}
