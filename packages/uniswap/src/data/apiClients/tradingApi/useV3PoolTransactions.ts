import { useInfiniteQuery } from '@tanstack/react-query'
import {
  fetchPoolTransactions,
  PoolTransactionsResponse,
} from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'

export function useV3PoolTransactions(params: { address?: string | null; chainId?: number | null; first?: number }) {
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
    getNextPageParam: (lastPage, allPages) => {
      const txs = lastPage.v3Pool.transactions
      // No more pages if empty or partial page returned
      if (!txs.length || (params.first && txs.length < params.first)) {
        return undefined
      }
      // Prefer the API's compound cursor (timestamp:id) for deterministic pagination.
      // Fall back to timestamp-only cursor for backwards compatibility.
      const newCursor = lastPage.v3Pool.cursor ?? txs[txs.length - 1].timestamp.toString()
      // Prevent infinite loop if cursor doesn't advance (e.g. identical timestamps)
      // Note: allPages includes lastPage as its final element, so -2 gives the *previous* page.
      if (allPages.length >= 2) {
        const prevPage = allPages[allPages.length - 2]
        const prevCursor = prevPage.v3Pool.cursor ?? prevPage.v3Pool.transactions.slice(-1)[0]?.timestamp.toString()
        if (newCursor === prevCursor) {
          return undefined
        }
      }
      return newCursor
    },
    enabled: !!params.address && !!params.chainId,
    staleTime: 30_000,
  })
}
