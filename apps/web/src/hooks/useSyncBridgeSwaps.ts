import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'hooks/useAccount'
import { useJuiceswapAuth } from 'hooks/useJuiceswapAuth'
import { saveBridgeSwapBulk } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { CreateBridgeSwapRequest } from 'uniswap/src/data/tradingApi/types'
import { SomeSwap } from 'uniswap/src/features/lds-bridge'
import { getLdsBridgeManager } from 'uniswap/src/features/lds-bridge/LdsBridgeManager'

export function useSyncBridgeSwaps(enabled = true) {
  const account = useAccount()
  const { isAuthenticated, autenticationSignal } = useJuiceswapAuth()

  return useQuery({
    queryKey: ['sync-bridge-swaps', account.address, autenticationSignal],
    queryFn: async (): Promise<{ synced: boolean }> => {
      const ldsBridgeManager = getLdsBridgeManager()

      await ldsBridgeManager.applyMigrations()

      if (account.address) {
        await ldsBridgeManager.syncSwapsWithIndexedData(account.address)
      }

      await ldsBridgeManager.syncSwapsWithChainAndMempoolData()

      if (isAuthenticated && account.address) {
        const userAddress = account.address.toLowerCase()
        const swaps = await ldsBridgeManager.getSwaps()

        const swapsToSave = Object.values(swaps)
          .filter((swap) => swap.version >= 4)
          .filter((swap) => !swap.userId || swap.userId.toLowerCase() === userAddress)
          .map(
            (swap: SomeSwap) =>
              ({
                ...swap,
                userId: swap.userId.toLowerCase() || userAddress,
              }) as CreateBridgeSwapRequest,
          )

        await saveBridgeSwapBulk(swapsToSave as CreateBridgeSwapRequest[])
      }

      return { synced: true }
    },
    enabled,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}
