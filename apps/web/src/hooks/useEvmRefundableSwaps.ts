import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'hooks/useAccount'
import { fetchEvmRefundableLockups, type EvmRefundableLockup } from 'uniswap/src/features/lds-bridge/api/client'

export type { EvmRefundableLockup }

export function useEvmRefundableSwaps(enabled = true) {
  const account = useAccount()

  return useQuery({
    queryKey: ['evm-refundable-swaps', account.address],
    queryFn: async (): Promise<{ refundable: EvmRefundableLockup[]; locked: EvmRefundableLockup[] }> => {
      if (!account.address) {
        return { refundable: [], locked: [] }
      }

      const allLockups = await fetchEvmRefundableLockups(account.address)

      // Add a 5-minute buffer to account for block timestamp differences
      const BUFFER_SECONDS = 300 // 5 minutes
      const currentTimestamp = Math.floor(Date.now() / 1000)

      const refundable: EvmRefundableLockup[] = []
      const locked: EvmRefundableLockup[] = []

      allLockups.forEach((lockup) => {
        const timelockTimestamp = Number(lockup.timelock)
        const isExpired = timelockTimestamp + BUFFER_SECONDS < currentTimestamp

        if (isExpired) {
          refundable.push(lockup)
        } else {
          locked.push(lockup)
        }
      })

      return { refundable, locked }
    },
    enabled: enabled && !!account.address,
    staleTime: 5000,
    refetchInterval: 30000,
  })
}
