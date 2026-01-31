import { useQuery } from '@tanstack/react-query'
import { RPC_PROVIDERS } from 'constants/providers'
import { useAccount } from 'hooks/useAccount'
import { useMemo } from 'react'
import { fetchEvmRefundableLockups, type EvmRefundableLockup } from 'uniswap/src/features/lds-bridge/api/client'

export type { EvmRefundableLockup }

function useChainTipBlockNumber(chainId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['chain-tip-block-number', chainId],
    queryFn: async () => {
      const providerKey = chainId as keyof typeof RPC_PROVIDERS
      const provider = RPC_PROVIDERS[providerKey]
      const blockNumber = await provider.getBlockNumber()
      return BigInt(blockNumber)
    },
    enabled,
    staleTime: 12000,
    refetchInterval: 12000,
  })
}

const useEvmRefundableLockups = (enabled = true) => {
  const account = useAccount()
  return useQuery({
    queryKey: ['evm-refundable-lockups', account.address],
    queryFn: async (): Promise<EvmRefundableLockup[]> => {
      if (!account.address) {
        return []
      }

      const allLockups = await fetchEvmRefundableLockups(account.address)
      return allLockups
    },
    enabled: enabled && !!account.address,
    staleTime: 5000,
    refetchInterval: 30000,
  })
}

// Buffer blocks to account for slight differences in block propagation
const BUFFER_BLOCKS = 5

export function useEvmRefundableSwaps(enabled = true) {
  const lockups = useEvmRefundableLockups(enabled)
  const blockEthTip = useChainTipBlockNumber(1, Boolean(lockups.data))
  const blockPolygonTip = useChainTipBlockNumber(137, Boolean(lockups.data))
  const blockCitreaTestnetTip = useChainTipBlockNumber(5115, Boolean(lockups.data))
  const blockCitreaMainnetTip = useChainTipBlockNumber(4114, Boolean(lockups.data))

  const data = useMemo(() => {
    if (!lockups.data) {
      return { refundable: [], locked: [] }
    }

    const refundable: EvmRefundableLockup[] = []
    const locked: EvmRefundableLockup[] = []

    lockups.data.forEach((lockup) => {
      const chainId = Number(lockup.chainId)
      let blockTip: bigint | undefined

      if (chainId === 1) {
        blockTip = blockEthTip.data
      } else if (chainId === 137) {
        blockTip = blockPolygonTip.data
      } else if (chainId === 5115) {
        blockTip = blockCitreaTestnetTip.data
      } else if (chainId === 4114) {
        blockTip = blockCitreaMainnetTip.data
      }

      if (!blockTip) {
        // If we don't have block number yet, consider it locked
        locked.push(lockup)
        return
      }

      const timelockBlock = BigInt(lockup.timelock)
      // Swap is refundable if current block is greater than timelock + buffer
      const isExpired = blockTip > timelockBlock + BigInt(BUFFER_BLOCKS)

      if (isExpired) {
        refundable.push(lockup)
      } else {
        locked.push(lockup)
      }
    })

    return { refundable, locked }
  }, [lockups.data, blockEthTip.data, blockPolygonTip.data, blockCitreaTestnetTip.data, blockCitreaMainnetTip.data])

  return {
    data,
    isLoading:
      lockups.isLoading ||
      blockEthTip.isLoading ||
      blockPolygonTip.isLoading ||
      blockCitreaTestnetTip.isLoading ||
      blockCitreaMainnetTip.isLoading,
    isError:
      lockups.isError ||
      blockEthTip.isError ||
      blockPolygonTip.isError ||
      blockCitreaTestnetTip.isError ||
      blockCitreaMainnetTip.isError,
    error:
      lockups.error ||
      blockEthTip.error ||
      blockPolygonTip.error ||
      blockCitreaTestnetTip.error ||
      blockCitreaMainnetTip.error,
    refetch: lockups.refetch,
  }
}
