import { useQuery } from '@tanstack/react-query'
import { useJuiceswapAuth } from 'hooks/useJuiceswapAuth'
import { useSyncBridgeSwaps } from 'hooks/useSyncBridgeSwaps'
import { fetchBridgeSwaps } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { LdsSwapStatus } from 'uniswap/src/features/lds-bridge/lds-types/websocket'

interface UseBridgeSwapsProps {
  enabled?: boolean
  statuses?: LdsSwapStatus[]
}

export function useBridgeSwaps(props: UseBridgeSwapsProps = {}) {
  const { enabled = true, statuses = [] } = props
  const { data: syncBridgeSwaps, isLoading: isLoadingSyncBridgeSwaps } = useSyncBridgeSwaps(enabled)
  const { isAuthenticated, autenticationSignal } = useJuiceswapAuth()

  return useQuery({
    queryKey: [
      'bridge-swaps',
      syncBridgeSwaps?.currentAddress,
      isAuthenticated,
      autenticationSignal,
      statuses.join(','),
    ],
    queryFn: () => fetchBridgeSwaps({ statuses }),
    enabled: enabled && syncBridgeSwaps?.synced && Boolean(syncBridgeSwaps.currentAddress) && !isLoadingSyncBridgeSwaps,
    refetchInterval: 30000,
  })
}
