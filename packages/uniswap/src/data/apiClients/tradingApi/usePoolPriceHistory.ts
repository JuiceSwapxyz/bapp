import { useQuery } from '@tanstack/react-query'
import {
  fetchPoolPriceHistory,
  PoolPriceHistoryEntry,
} from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'

export function usePoolPriceHistory(params: {
  address?: string | null
  chainId?: number | null
  duration: string
}) {
  return useQuery<PoolPriceHistoryEntry[]>({
    queryKey: ['pool-price-history', params.address, params.chainId, params.duration],
    queryFn: () =>
      fetchPoolPriceHistory({
        address: params.address!,
        chainId: params.chainId!,
        duration: params.duration,
      }),
    enabled: !!params.address && !!params.chainId,
    staleTime: 30_000,
  })
}
