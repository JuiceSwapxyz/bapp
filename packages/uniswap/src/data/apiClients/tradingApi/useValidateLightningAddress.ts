import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { validateLightningAddress } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { useDebounce } from 'utilities/src/time/timing'

export function useValidateLightningAddress({ lnLikeAddress }: { lnLikeAddress: string }): UseQueryResult<{
  validated: boolean
}> {
  const debouncedAddress = useDebounce(lnLikeAddress, 500)

  return useQuery<{ validated: boolean }>({
    queryKey: ['validateLightningAddress', debouncedAddress],
    queryFn: () => validateLightningAddress({ lnLikeAddress: debouncedAddress }),
    enabled: !!debouncedAddress,
  })
}
