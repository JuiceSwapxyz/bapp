import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchPoolTransactions, PoolTransactionsResponse } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'

export function useV3PoolTransactions(params: {
  address?: string | null
  chainId?: number | null
  first?: number
}) {
  return useInfiniteQuery<PoolTransactionsResponse>({
    queryKey: ['v3-pool-transactions', params.address, params.chainId, params.first],
    queryFn: ({ pageParam }) =>
      fetchPoolTransactions({
        address: params.address!,
        chainId: params.chainId!,
        first: params.first,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      const txs = lastPage.v3Pool.transactions
      // No more pages if empty or partial page returned
      if (!txs.length || (params.first && txs.length < params.first)) return undefined
      return txs[txs.length - 1].timestamp.toString()
    },
    enabled: !!params.address && !!params.chainId,
    staleTime: 30_000,
  })
}
