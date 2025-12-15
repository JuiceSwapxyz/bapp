import { useMemo } from 'react'
import { LAUNCHPAD_ADDRESSES, TOKEN_FACTORY_ABI } from 'constants/launchpad'
import { assume0xAddress } from 'utils/wagmi'
import { useReadContract, useReadContracts } from 'wagmi'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export interface TokenInfo {
  address: string
  creator: string
  timestamp: number
  name: string
  symbol: string
}

export interface TokenFactoryState {
  baseAsset: string | undefined
  feeRecipient: string | undefined
  initialVirtualBaseReserves: bigint | undefined
  totalTokens: number
  isLoading: boolean
  refetch: () => void
}

/**
 * Get the factory address for a chain
 */
export function useFactoryAddress(chainId: UniverseChainId = UniverseChainId.CitreaTestnet): string | undefined {
  return useMemo(() => {
    const addresses = LAUNCHPAD_ADDRESSES[chainId]
    if (!addresses || addresses.factory === '0x0000000000000000000000000000000000000000') {
      return undefined
    }
    return addresses.factory
  }, [chainId])
}

/**
 * Hook to read token factory state
 * @param chainId - Chain ID (defaults to CitreaTestnet)
 */
export function useTokenFactory(chainId: UniverseChainId = UniverseChainId.CitreaTestnet): TokenFactoryState {
  const factoryAddress = useFactoryAddress(chainId)
  const address = factoryAddress ? assume0xAddress(factoryAddress) : undefined

  const contracts = useMemo(() => {
    if (!address) {
      return []
    }
    const baseContract = { address, chainId, abi: TOKEN_FACTORY_ABI }
    return [
      { ...baseContract, functionName: 'baseAsset' },
      { ...baseContract, functionName: 'feeRecipient' },
      { ...baseContract, functionName: 'initialVirtualBaseReserves' },
      { ...baseContract, functionName: 'allTokensLength' },
    ] as const
  }, [address, chainId])

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: { enabled: !!address },
  })

  return useMemo(() => {
    if (!data || data.length === 0) {
      return {
        baseAsset: undefined,
        feeRecipient: undefined,
        initialVirtualBaseReserves: undefined,
        totalTokens: 0,
        isLoading,
        refetch,
      }
    }

    const [baseAssetResult, feeRecipientResult, virtualBaseResult, totalTokensResult] = data

    return {
      baseAsset: baseAssetResult.status === 'success' ? baseAssetResult.result as string : undefined,
      feeRecipient: feeRecipientResult.status === 'success' ? feeRecipientResult.result as string : undefined,
      initialVirtualBaseReserves: virtualBaseResult.status === 'success' ? virtualBaseResult.result as bigint : undefined,
      totalTokens: totalTokensResult.status === 'success' ? Number(totalTokensResult.result) : 0,
      isLoading,
      refetch,
    }
  }, [data, isLoading, refetch])
}

/**
 * Hook to get token address by index
 * @param index - Token index in the factory
 * @param chainId - Chain ID
 */
export function useTokenAtIndex(
  index: number | undefined,
  chainId: UniverseChainId = UniverseChainId.CitreaTestnet
): { tokenAddress: string | undefined; isLoading: boolean } {
  const factoryAddress = useFactoryAddress(chainId)
  const address = factoryAddress ? assume0xAddress(factoryAddress) : undefined
  const enabled = !!address && index !== undefined && index >= 0

  const { data, isLoading } = useReadContract({
    address,
    chainId,
    abi: TOKEN_FACTORY_ABI,
    functionName: 'getToken',
    args: enabled ? [BigInt(index)] : undefined,
    query: { enabled },
  })

  return useMemo(
    () => ({
      tokenAddress: data as string | undefined,
      isLoading,
    }),
    [data, isLoading]
  )
}

/**
 * Hook to get token info from factory
 * @param tokenAddress - Token address
 * @param chainId - Chain ID
 */
export function useTokenInfo(
  tokenAddress: string | undefined,
  chainId: UniverseChainId = UniverseChainId.CitreaTestnet
): { tokenInfo: TokenInfo | undefined; isLoading: boolean } {
  const factoryAddress = useFactoryAddress(chainId)
  const factory = factoryAddress ? assume0xAddress(factoryAddress) : undefined
  const token = tokenAddress ? assume0xAddress(tokenAddress) : undefined
  const enabled = !!factory && !!token

  const { data, isLoading } = useReadContract({
    address: factory,
    chainId,
    abi: TOKEN_FACTORY_ABI,
    functionName: 'getTokenInfo',
    args: enabled ? [token] : undefined,
    query: { enabled },
  })

  return useMemo(() => {
    if (!data || !tokenAddress) {
      return { tokenInfo: undefined, isLoading }
    }

    const [creator, timestamp, name, symbol] = data as [string, bigint, string, string]

    return {
      tokenInfo: {
        address: tokenAddress,
        creator,
        timestamp: Number(timestamp),
        name,
        symbol,
      },
      isLoading,
    }
  }, [data, tokenAddress, isLoading])
}

/**
 * Hook to get multiple tokens with their info
 * @param startIndex - Start index (inclusive)
 * @param count - Number of tokens to fetch
 * @param chainId - Chain ID
 */
export function useTokenList(
  startIndex: number,
  count: number,
  chainId: UniverseChainId = UniverseChainId.CitreaTestnet
): { tokens: string[]; isLoading: boolean } {
  const factoryAddress = useFactoryAddress(chainId)
  const address = factoryAddress ? assume0xAddress(factoryAddress) : undefined

  const contracts = useMemo(() => {
    if (!address || count <= 0) {
      return []
    }
    return Array.from({ length: count }, (_, i) => ({
      address,
      chainId,
      abi: TOKEN_FACTORY_ABI,
      functionName: 'getToken' as const,
      args: [BigInt(startIndex + i)],
    }))
  }, [address, chainId, startIndex, count])

  const { data, isLoading } = useReadContracts({
    contracts,
    query: { enabled: contracts.length > 0 },
  })

  return useMemo(() => {
    if (!data) {
      return { tokens: [], isLoading }
    }

    const tokens = data
      .filter((result) => result.status === 'success')
      .map((result) => result.result as string)

    return { tokens, isLoading }
  }, [data, isLoading])
}
