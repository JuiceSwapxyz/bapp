import { useQuery } from '@tanstack/react-query'
import { SomeSwap } from 'uniswap/src/features/lds-bridge/lds-types/storage'
import { getLdsBridgeManager } from 'uniswap/src/features/lds-bridge/LdsBridgeManager'

type SwapWithId = SomeSwap & { id: string }

export function useRefundableSwaps(enabled = true) {
  return useQuery({
    queryKey: ['refundable-swaps'],
    queryFn: async (): Promise<SwapWithId[]> => {
      const ldsBridgeManager = getLdsBridgeManager()
      const refundable = await ldsBridgeManager.getChainRefundbleSwaps()
      return refundable.map((swap) => Object.assign({}, swap, { id: swap.id }))
    },
    enabled,
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}
