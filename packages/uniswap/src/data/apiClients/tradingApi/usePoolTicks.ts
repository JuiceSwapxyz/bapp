import { useQuery } from '@tanstack/react-query'
import {
  fetchPoolTicks,
  PoolTicksResponse,
} from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'

export function usePoolTicks(params: {
  address?: string | null
  chainId?: number | null
}) {
  return useQuery<PoolTicksResponse>({
    queryKey: ['pool-ticks', params.address, params.chainId],
    queryFn: () => fetchPoolTicks({ address: params.address!, chainId: params.chainId! }),
    enabled: !!params.address && !!params.chainId,
    staleTime: 30_000,
  })
}
