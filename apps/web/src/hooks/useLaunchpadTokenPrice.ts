import { type BondingCurveReserves } from 'hooks/useBondingCurveToken'
import { useV2PairReserves } from 'hooks/useV2PairReserves'
import { LAUNCHPAD_TOKEN_TOTAL_SUPPLY } from 'pages/Launchpad/constants'
import { calculatePriceFromV2Reserves } from 'pages/Launchpad/utils'
import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export interface LaunchpadTokenPriceResult {
  /** Current price in base asset (JUSD) terms */
  price: number | null
  /** Market cap = price × total supply */
  marketCap: number | null
  /** Formatted price string */
  priceFormatted: string
  /** Formatted market cap string */
  marketCapFormatted: string
  /** Whether price data is loading */
  isLoading: boolean
  /** Whether token is using V2 pricing (graduated) */
  isV2Pricing: boolean
}

export interface UseLaunchpadTokenPriceParams {
  /** Token contract address */
  tokenAddress: string | undefined
  /** Whether token has graduated to V2 */
  graduated: boolean
  /** V2 pair address (only set for graduated tokens) */
  v2Pair: string | undefined
  /** Base asset (JUSD) address */
  baseAsset: string | undefined
  /** Bonding curve reserves (for non-graduated tokens) */
  bondingCurveReserves: BondingCurveReserves | undefined
  /** Chain ID */
  chainId: UniverseChainId
}

/**
 * Unified hook to get launchpad token price.
 * Automatically switches between bonding curve and V2 pool pricing based on graduation status.
 *
 * - If `graduated === false`: Calculate price from bonding curve reserves
 * - If `graduated === true`: Fetch V2 pair reserves and calculate price from there
 */
export function useLaunchpadTokenPrice({
  tokenAddress,
  graduated,
  v2Pair,
  baseAsset,
  bondingCurveReserves,
  chainId,
}: UseLaunchpadTokenPriceParams): LaunchpadTokenPriceResult {
  // Fetch V2 reserves only for graduated tokens
  const { reserves: v2Reserves, isLoading: v2Loading } = useV2PairReserves(graduated ? v2Pair : undefined, chainId)

  return useMemo(() => {
    // For graduated tokens, use V2 pricing
    if (graduated && tokenAddress && baseAsset) {
      if (v2Loading) {
        return {
          price: null,
          marketCap: null,
          priceFormatted: '...',
          marketCapFormatted: '...',
          isLoading: true,
          isV2Pricing: true,
        }
      }

      if (v2Reserves) {
        const price = calculatePriceFromV2Reserves({
          tokenAddress,
          baseAssetAddress: baseAsset,
          reserve0: v2Reserves.reserve0,
          reserve1: v2Reserves.reserve1,
        })

        if (price !== null) {
          const marketCap = price * LAUNCHPAD_TOKEN_TOTAL_SUPPLY
          return {
            price,
            marketCap,
            priceFormatted: price.toFixed(8),
            marketCapFormatted: marketCap.toLocaleString(undefined, { maximumFractionDigits: 2 }),
            isLoading: false,
            isV2Pricing: true,
          }
        }
      }

      // V2 data unavailable or calculation failed
      return {
        price: null,
        marketCap: null,
        priceFormatted: 'N/A',
        marketCapFormatted: 'N/A',
        isLoading: false,
        isV2Pricing: true,
      }
    }

    // For non-graduated tokens, use bonding curve pricing
    if (!bondingCurveReserves || bondingCurveReserves.virtualToken === 0n) {
      return {
        price: null,
        marketCap: null,
        priceFormatted: '0',
        marketCapFormatted: '0',
        isLoading: false,
        isV2Pricing: false,
      }
    }

    const price = Number(bondingCurveReserves.virtualBase) / Number(bondingCurveReserves.virtualToken)
    const marketCap = price * LAUNCHPAD_TOKEN_TOTAL_SUPPLY

    return {
      price,
      marketCap,
      priceFormatted: price.toFixed(8),
      marketCapFormatted: marketCap.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      isLoading: false,
      isV2Pricing: false,
    }
  }, [graduated, tokenAddress, baseAsset, v2Loading, v2Reserves, bondingCurveReserves])
}
