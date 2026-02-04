import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'hooks/useAccount'
import { getLdsBridgeManager } from 'uniswap/src/features/lds-bridge/LdsBridgeManager'

export function useSyncBridgeSwaps(enabled = true) {
  const account = useAccount()

  return useQuery({
    queryKey: ['sync-bridge-swaps', account.address],
    queryFn: async (): Promise<{ synced: boolean }> => {
      const ldsBridgeManager = getLdsBridgeManager()

      if (account.address) {
        await ldsBridgeManager.syncSwapsWithIndexedData(account.address)
      }

      await ldsBridgeManager.syncSwapsWithChainAndMempoolData()

      return { synced: true }
    },
    enabled,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}
