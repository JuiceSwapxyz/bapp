import { useQuery } from '@tanstack/react-query'
import {
  fetchPoolVolumeHistory,
  PoolVolumeHistoryEntry,
} from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'

export function usePoolVolumeHistory(params: {
  address?: string | null
  chainId?: number | null
  duration: string
}) {
  return useQuery<PoolVolumeHistoryEntry[]>({
    queryKey: ['pool-volume-history', params.address, params.chainId, params.duration],
    queryFn: () =>
      fetchPoolVolumeHistory({
        address: params.address!,
        chainId: params.chainId!,
        duration: params.duration,
      }),
    enabled: !!params.address && !!params.chainId,
    staleTime: 30_000,
  })
}
