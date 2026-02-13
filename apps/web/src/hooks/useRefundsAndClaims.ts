import { useQuery } from '@tanstack/react-query'
import { useJuiceswapAuth } from 'hooks/useJuiceswapAuth'
import { fetchClaimRefund } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'

export function useRefundsAndClaims() {
  const { isAuthenticated } = useJuiceswapAuth()
  return useQuery({
    queryKey: ['refunds-and-claims'],
    queryFn: fetchClaimRefund,
    enabled: isAuthenticated,
    refetchInterval: 30000,
  })
}
