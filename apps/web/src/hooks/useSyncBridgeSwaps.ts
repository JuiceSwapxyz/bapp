import { useQuery } from '@tanstack/react-query'
import { useJuiceswapAuth } from 'hooks/useJuiceswapAuth'
import { saveBridgeSwapBulk } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { CreateBridgeSwapRequest } from 'uniswap/src/data/tradingApi/types'
import { SomeSwap } from 'uniswap/src/features/lds-bridge'
import { getLdsBridgeManager } from 'uniswap/src/features/lds-bridge/LdsBridgeManager'

const SYNCED_SWAPS_STORAGE_KEY = 'juiceswap:synced-bridge-swaps'

function getSyncedSwapKeys(): Set<string> {
  try {
    const stored = localStorage.getItem(SYNCED_SWAPS_STORAGE_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

function persistSyncedSwapKeys(keys: Set<string>): void {
  localStorage.setItem(SYNCED_SWAPS_STORAGE_KEY, JSON.stringify([...keys]))
}

function getSwapKey(swap: SomeSwap | CreateBridgeSwapRequest): string {
  return `${swap.preimageHash}:${swap.status}`
}

export function useSyncBridgeSwaps(enabled = true) {
  const { isAuthenticated, currentAddress } = useJuiceswapAuth()

  const syncBridgeSwaps = useQuery({
    queryKey: ['sync-bridge-swaps', currentAddress],
    queryFn: async (): Promise<{ synced: boolean; currentAddress: string | undefined }> => {
      const ldsBridgeManager = getLdsBridgeManager()

      await ldsBridgeManager.applyMigrations()

      if (isAuthenticated && currentAddress) {
        const swaps = await ldsBridgeManager.getLocalStorageSwaps()
        const syncedKeys = getSyncedSwapKeys()

        const swapsToSave = Object.values(swaps)
          .filter((swap) => swap.version >= 4)
          .filter((swap) => !swap.userId || swap.userId.toLowerCase() === currentAddress.toLowerCase())
          .filter((swap) => !syncedKeys.has(getSwapKey(swap)))
          .map(
            (swap: SomeSwap) =>
              ({
                ...swap,
                userId: swap.userId ? swap.userId.toLowerCase() : currentAddress.toLowerCase(),
              }) as CreateBridgeSwapRequest,
          )

        if (swapsToSave.length > 0) {
          await saveBridgeSwapBulk(swapsToSave as CreateBridgeSwapRequest[])
          for (const swap of swapsToSave) {
            syncedKeys.add(getSwapKey(swap))
          }
          persistSyncedSwapKeys(syncedKeys)
        }
      }

      return { synced: true, currentAddress }
    },
    enabled,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  return syncBridgeSwaps
}
