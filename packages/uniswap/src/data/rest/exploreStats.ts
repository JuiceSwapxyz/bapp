import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { createPonderApiClient } from 'uniswap/src/data/apiClients/ponderApi/PonderApi'

type ExploreStatsResponse = {
  stats: {
    transactionStats: unknown[]
  }
}

const PonderApiClient = createPonderApiClient()

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
