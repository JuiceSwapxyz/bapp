import { UseQueryResult, useQuery as useTanstackQuery } from '@tanstack/react-query'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

interface TimestampedAmount {
  timestamp: number
  value: number
}

export interface JuiceswapProtocolStatsResponse {
  dailyProtocolTvl: {
    v2: TimestampedAmount[]
    v3: TimestampedAmount[]
    bridge: TimestampedAmount[]
  }
  historicalProtocolVolume: {
    Month: {
      v2: TimestampedAmount[]
      v3: TimestampedAmount[]
      bridge: TimestampedAmount[]
    }
  }
}

const juiceSwapApiClient = createApiClient({
  baseUrl: (process.env.REACT_APP_TRADING_API_URL_OVERRIDE || process.env.REACT_APP_JUICESWAP_API_URL) as string,
})

const fetchProtocolStats = (chainId: number): Promise<JuiceswapProtocolStatsResponse> => {
  return juiceSwapApiClient.post<JuiceswapProtocolStatsResponse>('/v1/protocol/stats', {
    body: JSON.stringify({ chainId }),
  })
}

/**
 * Hook to fetch protocol stats (TVL + volume) from the JuiceSwap API
 * Returns data in a format compatible with the Uniswap ProtocolStatsResponse
 */
export function useJuiceswapProtocolStatsQuery(
  chainId: UniverseChainId,
  enabled: boolean = true,
): UseQueryResult<JuiceswapProtocolStatsResponse, Error> {
  return useTanstackQuery<JuiceswapProtocolStatsResponse, Error>({
    queryKey: ['juiceswapProtocolStats', chainId],
    queryFn: () => fetchProtocolStats(chainId),
    enabled,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
}
