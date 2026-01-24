import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { fetchV3PoolDetails } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { PoolDetailsResponse } from 'uniswap/src/data/tradingApi/types'

export function useV3PoolDetails(params: {
  address?: string | null
  chainId?: number | null
}): UseQueryResult<PoolDetailsResponse> {
  return useQuery({
    queryKey: ['v3-pool-details', params.address, params.chainId],
    queryFn: () => fetchV3PoolDetails(params as { address: string; chainId: number }),
    enabled: !!params.address && !!params.chainId,
  })
}
