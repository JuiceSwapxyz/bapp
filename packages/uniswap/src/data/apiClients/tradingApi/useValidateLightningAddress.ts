import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { validateLightningAddress } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { useDebounce } from 'utilities/src/time/timing'

export function useValidateLightningAddress({
  lnLikeAddress,
  debounceDelayMs = 500,
}: {
  lnLikeAddress: string
  debounceDelayMs?: number
}): UseQueryResult<{
  validated: boolean
}> {
  const debouncedAddress = useDebounce(lnLikeAddress, debounceDelayMs)

  return useQuery<{ validated: boolean }>({
    queryKey: ['validateLightningAddress', debouncedAddress],
    queryFn: () => validateLightningAddress({ lnLikeAddress: debouncedAddress }),
    enabled: !!debouncedAddress,
  })
}
