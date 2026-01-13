import { useQuery } from '@tanstack/react-query'
import { SomeSwap } from 'uniswap/src/features/lds-bridge/lds-types/storage'
import { getLdsBridgeManager } from 'uniswap/src/features/lds-bridge/LdsBridgeManager'

type SwapWithId = SomeSwap & { id: string }

export function useBridgeSwaps(enabled = true) {
  return useQuery({
    queryKey: ['bridge-swaps'],
    queryFn: async (): Promise<SwapWithId[]> => {
      const ldsBridgeManager = getLdsBridgeManager()
      const allSwaps = await ldsBridgeManager.getSwaps()

      return Object.entries(allSwaps).map(([id, swap]): SwapWithId => {
        return Object.assign({}, swap, { id })
      })
    },
    enabled,
    staleTime: 5000,
    refetchInterval: 30000,
  })
}
