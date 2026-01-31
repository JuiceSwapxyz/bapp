import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'hooks/useAccount'
import { getLdsBridgeManager } from 'uniswap/src/features/lds-bridge/LdsBridgeManager'

export function useSyncBridgeSwaps(enabled = true) {
  const account = useAccount()

  return useQuery({
    queryKey: ['sync-bridge-swaps', account.address],
    queryFn: async (): Promise<void> => {
      if (!account.address) {
        return
      }

      const ldsBridgeManager = getLdsBridgeManager()
      await ldsBridgeManager.syncSwapsWithGraphQLData(account.address)
    },
    enabled: enabled && !!account.address,
    staleTime: Infinity, // Only run once per account.address change
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
