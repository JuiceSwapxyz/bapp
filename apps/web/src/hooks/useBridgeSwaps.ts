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
  const { data: syncBridgeSwaps } = useSyncBridgeSwaps(enabled)
  const { isAuthenticated } = useJuiceswapAuth()

  return useQuery({
    queryKey: ['bridge-swaps', syncBridgeSwaps?.currentAddress, isAuthenticated, statuses.join(',')],
    queryFn: () => fetchBridgeSwaps({ statuses }),
    enabled: enabled && syncBridgeSwaps?.synced && Boolean(syncBridgeSwaps.currentAddress),
    refetchInterval: 30000,
  })
}
