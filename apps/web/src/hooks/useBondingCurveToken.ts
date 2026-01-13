import { BONDING_CURVE_CONSTANTS, BONDING_CURVE_TOKEN_ABI } from 'constants/launchpad'
import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { assume0xAddress } from 'utils/wagmi'
import { useReadContract, useReadContracts } from 'wagmi'

export interface BondingCurveReserves {
  virtualToken: bigint
  virtualBase: bigint
  realToken: bigint
  realBase: bigint
}

export interface BondingCurveTokenState {
  name: string | undefined
  symbol: string | undefined
  graduated: boolean
  canGraduate: boolean
  progress: number // 0-100 percentage
  reserves: BondingCurveReserves | undefined
  baseAsset: string | undefined
  v2Pair: string | undefined
  isLoading: boolean
  refetch: () => void
}

/**
 * Hook to read bonding curve token state
 * @param tokenAddress - The bonding curve token address
 * @param chainId - Chain ID (defaults to CitreaTestnet)
 */
export function useBondingCurveToken(
  tokenAddress: string | undefined,
  chainId: UniverseChainId = UniverseChainId.CitreaTestnet,
): BondingCurveTokenState {
  const address = tokenAddress ? assume0xAddress(tokenAddress) : undefined

  const contracts = useMemo(() => {
    if (!address) {
      return undefined
    }
    const baseContract = { address, chainId, abi: BONDING_CURVE_TOKEN_ABI }
    return [
      { ...baseContract, functionName: 'name' },
      { ...baseContract, functionName: 'symbol' },
      { ...baseContract, functionName: 'graduated' },
      { ...baseContract, functionName: 'canGraduate' },
      { ...baseContract, functionName: 'getBondingCurveProgress' },
      { ...baseContract, functionName: 'getReserves' },
      { ...baseContract, functionName: 'baseAsset' },
      { ...baseContract, functionName: 'v2Pair' },
    ] as const
  }, [address, chainId])

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: { enabled: !!address },
  })

  return useMemo(() => {
    if (!data) {
      return {
        name: undefined,
        symbol: undefined,
        graduated: false,
        canGraduate: false,
        progress: 0,
        reserves: undefined,
        baseAsset: undefined,
        v2Pair: undefined,
        isLoading,
        refetch,
      }
    }

    const [
      nameResult,
      symbolResult,
      graduatedResult,
      canGraduateResult,
      progressResult,
      reservesResult,
      baseAssetResult,
      v2PairResult,
    ] = data

    // Parse reserves from tuple result
    let reserves: BondingCurveReserves | undefined
    if (reservesResult.status === 'success' && Array.isArray(reservesResult.result)) {
      const [virtualToken, virtualBase, realToken, realBase] = reservesResult.result as [bigint, bigint, bigint, bigint]
      reserves = { virtualToken, virtualBase, realToken, realBase }
    }

    // Convert progress from basis points (0-10000) to percentage (0-100)
    const progressBps = progressResult.status === 'success' ? Number(progressResult.result) : 0
    const progress = progressBps / 100

    return {
      name: nameResult.status === 'success' ? (nameResult.result as string) : undefined,
      symbol: symbolResult.status === 'success' ? (symbolResult.result as string) : undefined,
      graduated: graduatedResult.status === 'success' ? (graduatedResult.result as boolean) : false,
      canGraduate: canGraduateResult.status === 'success' ? (canGraduateResult.result as boolean) : false,
      progress,
      reserves,
      baseAsset: baseAssetResult.status === 'success' ? (baseAssetResult.result as string) : undefined,
      v2Pair: v2PairResult.status === 'success' ? (v2PairResult.result as string) : undefined,
      isLoading,
      refetch,
    }
  }, [data, isLoading, refetch])
}

/**
 * Hook to calculate expected tokens out for a buy
 * @param tokenAddress - The bonding curve token address
 * @param baseIn - Amount of base asset to spend (in wei)
 * @param chainId - Chain ID
 */
export function useCalculateBuy(
  tokenAddress: string | undefined,
  baseIn: bigint | undefined,
  chainId: UniverseChainId = UniverseChainId.CitreaTestnet,
): { tokensOut: bigint | undefined; isLoading: boolean } {
  const address = tokenAddress ? assume0xAddress(tokenAddress) : undefined
  const enabled = !!address && !!baseIn && baseIn > 0n

  const { data, isLoading } = useReadContract({
    address,
    chainId,
    abi: BONDING_CURVE_TOKEN_ABI,
    functionName: 'calculateBuy',
    args: enabled ? [baseIn] : undefined,
    query: { enabled },
  })

  return useMemo(
    () => ({
      tokensOut: data as bigint | undefined,
      isLoading,
    }),
    [data, isLoading],
  )
}

/**
 * Hook to calculate expected base out for a sell
 * @param tokenAddress - The bonding curve token address
 * @param tokensIn - Amount of tokens to sell (in wei)
 * @param chainId - Chain ID
 */
export function useCalculateSell(
  tokenAddress: string | undefined,
  tokensIn: bigint | undefined,
  chainId: UniverseChainId = UniverseChainId.CitreaTestnet,
): { baseOut: bigint | undefined; isLoading: boolean } {
  const address = tokenAddress ? assume0xAddress(tokenAddress) : undefined
  const enabled = !!address && !!tokensIn && tokensIn > 0n

  const { data, isLoading } = useReadContract({
    address,
    chainId,
    abi: BONDING_CURVE_TOKEN_ABI,
    functionName: 'calculateSell',
    args: enabled ? [tokensIn] : undefined,
    query: { enabled },
  })

  return useMemo(
    () => ({
      baseOut: data as bigint | undefined,
      isLoading,
    }),
    [data, isLoading],
  )
}

/**
 * Hook to get user's token balance
 * @param tokenAddress - The bonding curve token address
 * @param userAddress - User's wallet address
 * @param chainId - Chain ID
 */
export function useBondingCurveBalance(
  tokenAddress: string | undefined,
  userAddress: string | undefined,
  chainId: UniverseChainId = UniverseChainId.CitreaTestnet,
): { balance: bigint | undefined; isLoading: boolean; refetch: () => void } {
  const address = tokenAddress ? assume0xAddress(tokenAddress) : undefined
  const user = userAddress ? assume0xAddress(userAddress) : undefined
  const enabled = !!address && !!user

  const { data, isLoading, refetch } = useReadContract({
    address,
    chainId,
    abi: BONDING_CURVE_TOKEN_ABI,
    functionName: 'balanceOf',
    args: enabled ? [user] : undefined,
    query: { enabled },
  })

  return useMemo(
    () => ({
      balance: data as bigint | undefined,
      isLoading,
      refetch,
    }),
    [data, isLoading, refetch],
  )
}

/**
 * Calculate tokens to graduation (remaining real token reserves)
 */
export function useTokensToGraduation(reserves: BondingCurveReserves | undefined): bigint {
  return useMemo(() => {
    if (!reserves) {
      return BONDING_CURVE_CONSTANTS.INITIAL_REAL_TOKEN_RESERVES
    }
    return reserves.realToken
  }, [reserves])
}
