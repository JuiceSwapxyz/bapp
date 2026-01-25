import { useQuery } from '@tanstack/react-query'
import { fetchSvJusdSharePrice, SvJusdSharePriceResponse } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DEFAULT_SHARE_PRICE, hasJuiceDollarIntegration } from 'uniswap/src/features/tokens/jusdAbstraction'

const SHARE_PRICE_CACHE_TIME = 30_000 // 30 seconds - matches API cache TTL
const SHARE_PRICE_STALE_TIME = 15_000 // 15 seconds - refetch if older than this

export interface UseSvJusdSharePriceResult {
  /** The svJUSD share price (JUSD per svJUSD) as string with 18 decimals */
  sharePrice: string
  /** Whether the share price is currently loading */
  isLoading: boolean
  /** Error if the fetch failed */
  error: Error | null
  /** Whether the response came from cache */
  isCached: boolean
  /** Refetch the share price */
  refetch: () => void
  /** Full response data including addresses */
  data: SvJusdSharePriceResponse | undefined
}

/**
 * Hook to fetch the current svJUSD share price for a given chain.
 *
 * The share price represents how much JUSD one svJUSD is worth.
 * As interest accrues in the vault, this value increases over time (e.g., 1.02 = 2% interest).
 *
 * Use this hook when performing LP operations involving JUSD to ensure
 * accurate dependent amount calculations.
 *
 * @param chainId - The chain ID to fetch share price for
 * @returns Share price info with loading/error states
 *
 * @example
 * ```tsx
 * const { sharePrice, isLoading } = useSvJusdSharePrice(UniverseChainId.CitreaTestnet)
 *
 * // Use share price for calculations
 * const adjustedAmount = isJusdPair ? jusdToSvJusd(amount, sharePrice) : amount
 * ```
 */
export function useSvJusdSharePrice(chainId: UniverseChainId | undefined): UseSvJusdSharePriceResult {
  const enabled = Boolean(chainId && hasJuiceDollarIntegration(chainId))

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['svJusdSharePrice', chainId],
    queryFn: async () => {
      if (!chainId) {
        throw new Error('Chain ID is required')
      }
      return fetchSvJusdSharePrice({ chainId })
    },
    enabled,
    staleTime: SHARE_PRICE_STALE_TIME,
    gcTime: SHARE_PRICE_CACHE_TIME,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })

  // Return default share price (1:1) if not available or chain doesn't support JuiceDollar
  const sharePrice = data?.sharePrice ?? DEFAULT_SHARE_PRICE
  const isCached = data?.cached ?? false

  return {
    sharePrice,
    isLoading: enabled && isLoading,
    error: error as Error | null,
    isCached,
    refetch: () => {
      if (enabled) {
        refetch()
      }
    },
    data,
  }
}

/**
 * Simple utility to check if share price is significantly different from 1:1
 * Used to determine if adjustments are needed
 *
 * @param sharePrice - The share price string (18 decimals)
 * @param threshold - Threshold for considering price different (default 0.01%)
 * @returns true if share price differs from 1.0 by more than threshold
 */
export function isSharePriceSignificant(sharePrice: string, threshold: number = 0.0001): boolean {
  const price = BigInt(sharePrice)
  const one = BigInt(DEFAULT_SHARE_PRICE)
  const diff = price > one ? price - one : one - price
  const thresholdBigInt = BigInt(Math.floor(Number(one) * threshold))
  return diff > thresholdBigInt
}
