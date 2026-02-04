import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { validateBitcoinAddress } from 'uniswap/src/features/lds-bridge/utils/bitcoinAddress'

export function useValidateBitcoinAddress({ bitcoinAddress }: { bitcoinAddress: string }): UseQueryResult<{
  validated: boolean
}> {
  return useQuery<{ validated: boolean }>({
    queryKey: ['validateBitcoinAddress', bitcoinAddress],
    queryFn: () => ({ validated: validateBitcoinAddress(bitcoinAddress) }),
    enabled: !!bitcoinAddress,
  })
}
