import { V2_PAIR_RESERVES_ABI } from 'constants/v2'
import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { assume0xAddress } from 'utils/wagmi'
import { useReadContract } from 'wagmi'

export interface V2PairReserves {
  reserve0: bigint
  reserve1: bigint
}

export interface UseV2PairReservesResult {
  reserves: V2PairReserves | undefined
  isLoading: boolean
  isError: boolean
}

/**
 * Hook to read reserves directly from a V2 pair contract address.
 * Simpler than useV2Pairs when you already know the pair address (e.g., from graduated tokens).
 *
 * @param pairAddress - The V2 pair contract address
 * @param chainId - The chain ID to query
 */
export function useV2PairReserves(
  pairAddress: string | undefined,
  chainId: UniverseChainId = UniverseChainId.CitreaMainnet,
): UseV2PairReservesResult {
  const address = pairAddress ? assume0xAddress(pairAddress) : undefined
  const enabled = !!address && address !== '0x0000000000000000000000000000000000000000'

  const { data, isLoading, isError } = useReadContract({
    address,
    chainId: chainId as number,
    abi: V2_PAIR_RESERVES_ABI,
    functionName: 'getReserves',
    query: { enabled },
  })

  return useMemo(() => {
    if (!data || !enabled) {
      return {
        reserves: undefined,
        isLoading: enabled ? isLoading : false,
        isError,
      }
    }

    const [reserve0, reserve1] = data as [bigint, bigint, number]
    return {
      reserves: { reserve0, reserve1 },
      isLoading,
      isError,
    }
  }, [data, enabled, isLoading, isError])
}
