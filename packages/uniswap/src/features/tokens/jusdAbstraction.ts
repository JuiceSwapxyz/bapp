/**
 * JuiceDollar Token Abstraction
 *
 * This module provides utilities for abstracting svJUSD (internal yield-bearing token)
 * to JUSD (user-facing stablecoin). Users interact with JUSD, but internally all pools
 * use svJUSD to earn savings interest on LP positions.
 *
 * All addresses are imported from canonical source packages:
 * - @juicedollar/jusd: JUSD, svJUSD, JUICE token addresses
 * - @juiceswapxyz/sdk-core: Gateway address
 */

import { ADDRESS } from '@juicedollar/jusd/exports/address.config'
import { CHAIN_TO_ADDRESSES_MAP, ChainId, Token as SdkToken } from '@juiceswapxyz/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSdkCoreChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { currencyId } from 'uniswap/src/utils/currencyId'

// Citrea chain IDs for iteration
const CITREA_CHAIN_IDS = [UniverseChainId.CitreaTestnet, UniverseChainId.CitreaMainnet] as const

// Build address maps from canonical packages
function buildAddressMap(
  getter: (chainAddresses: (typeof ADDRESS)[number]) => string,
): Partial<Record<UniverseChainId, string>> {
  const result: Partial<Record<UniverseChainId, string>> = {}
  for (const universeChainId of CITREA_CHAIN_IDS) {
    const numericChainId = toSdkCoreChainId(universeChainId)
    if (numericChainId === null) {
      continue
    }
    const chainAddresses = ADDRESS[numericChainId]
    if (chainAddresses) {
      result[universeChainId] = getter(chainAddresses)
    }
  }
  return result
}

// JuiceDollar token addresses by chain - imported from @juicedollar/jusd
export const JUSD_ADDRESSES: Partial<Record<UniverseChainId, string>> = buildAddressMap((a) => a.juiceDollar)

export const SV_JUSD_ADDRESSES: Partial<Record<UniverseChainId, string>> = buildAddressMap((a) => a.savingsVaultJUSD)

export const JUICE_ADDRESSES: Partial<Record<UniverseChainId, string>> = buildAddressMap((a) => a.equity)

// SUSD (StartUSD) addresses - from @juicedollar/jusd
export const SUSD_ADDRESSES: Partial<Record<UniverseChainId, string>> = buildAddressMap((a) => a.startUSD)

// Gateway address from @juiceswapxyz/sdk-core CHAIN_TO_ADDRESSES_MAP
// Type assertion needed as juiceSwapGatewayAddress may not be in older sdk-core types
type ExtendedChainAddresses = { juiceSwapGatewayAddress?: string }
const citreaTestnetAddresses = CHAIN_TO_ADDRESSES_MAP[ChainId.CITREA_TESTNET] as ExtendedChainAddresses | undefined
const citreaMainnetAddresses = CHAIN_TO_ADDRESSES_MAP[ChainId.CITREA_MAINNET] as ExtendedChainAddresses | undefined
export const JUICE_SWAP_GATEWAY_ADDRESSES: Partial<Record<UniverseChainId, string | undefined>> = {
  [UniverseChainId.CitreaTestnet]: citreaTestnetAddresses?.juiceSwapGatewayAddress,
  [UniverseChainId.CitreaMainnet]: citreaMainnetAddresses?.juiceSwapGatewayAddress,
}

/**
 * Check if an address is the svJUSD token on a given chain
 */
export function isSvJusdAddress(chainId: UniverseChainId, address: string): boolean {
  const svJusdAddress = SV_JUSD_ADDRESSES[chainId]
  if (!svJusdAddress) {
    return false
  }
  return address.toLowerCase() === svJusdAddress.toLowerCase()
}

/**
 * Check if an address is the JUSD token on a given chain
 */
export function isJusdAddress(chainId: UniverseChainId, address: string): boolean {
  const jusdAddress = JUSD_ADDRESSES[chainId]
  if (!jusdAddress) {
    return false
  }
  return address.toLowerCase() === jusdAddress.toLowerCase()
}

/**
 * Check if an address is the JUICE token on a given chain
 */
export function isJuiceAddress(chainId: UniverseChainId, address: string): boolean {
  const juiceAddress = JUICE_ADDRESSES[chainId]
  if (!juiceAddress) {
    return false
  }
  return address.toLowerCase() === juiceAddress.toLowerCase()
}

/**
 * Check if an address is the SUSD (StartUSD) token on a given chain
 */
export function isSusdAddress(chainId: UniverseChainId, address: string): boolean {
  const susdAddress = SUSD_ADDRESSES[chainId]
  if (!susdAddress) {
    return false
  }
  return address.toLowerCase() === susdAddress.toLowerCase()
}

/**
 * Check if a chain has JuiceDollar integration
 */
export function hasJuiceDollarIntegration(chainId: UniverseChainId): boolean {
  return Boolean(JUSD_ADDRESSES[chainId])
}

/**
 * Get the JUSD address for a chain (to use when transforming svJUSD)
 */
export function getJusdAddress(chainId: UniverseChainId): string | undefined {
  return JUSD_ADDRESSES[chainId]
}

/**
 * Get the svJUSD address for a chain
 */
export function getSvJusdAddress(chainId: UniverseChainId): string | undefined {
  return SV_JUSD_ADDRESSES[chainId]
}

/**
 * Get the JUICE address for a chain
 */
export function getJuiceAddress(chainId: UniverseChainId): string | undefined {
  return JUICE_ADDRESSES[chainId]
}

// JUSD metadata used when transforming svJUSD to JUSD for display
const JUSD_METADATA = {
  decimals: 18,
  symbol: 'JUSD',
  name: 'Juice Dollar',
  logoUrl: 'https://docs.juiceswap.com/media/icons/jusd.png',
} as const

/**
 * Build a CurrencyInfo representing JUSD for display purposes.
 * Used when transforming svJUSD to JUSD in the UI.
 */
export function buildJusdCurrencyInfo(chainId: UniverseChainId): CurrencyInfo | null {
  const jusdAddress = getJusdAddress(chainId)
  if (!jusdAddress) {
    return null
  }

  const currency = buildCurrency({
    chainId,
    address: jusdAddress,
    decimals: JUSD_METADATA.decimals,
    symbol: JUSD_METADATA.symbol,
    name: JUSD_METADATA.name,
  })

  if (!currency) {
    return null
  }

  return buildCurrencyInfo({
    currency,
    currencyId: currencyId(currency),
    logoUrl: JUSD_METADATA.logoUrl,
  })
}

/**
 * Transform a CurrencyInfo from svJUSD to JUSD for display purposes.
 * If the currency is not svJUSD, returns the original CurrencyInfo unchanged.
 *
 * This ensures users only see "JUSD" in the UI, never "svJUSD".
 * The Gateway contract handles actual svJUSD conversions internally.
 */
export function transformSvJusdCurrencyInfo(currencyInfo: CurrencyInfo, chainId?: UniverseChainId): CurrencyInfo {
  const currency = currencyInfo.currency
  const effectiveChainId = chainId ?? currency.chainId

  // Check if this is svJUSD
  if (!currency.isNative && 'address' in currency) {
    if (isSvJusdAddress(effectiveChainId, currency.address)) {
      const jusdInfo = buildJusdCurrencyInfo(effectiveChainId)
      if (jusdInfo) {
        // Preserve safety info from the original currency
        return {
          ...jusdInfo,
          safetyInfo: currencyInfo.safetyInfo,
          isSpam: currencyInfo.isSpam,
        }
      }
    }
  }
  return currencyInfo
}

/**
 * Transform an SDK Token from svJUSD to JUSD for display purposes.
 * If the token is not svJUSD, returns the original token unchanged.
 *
 * This ensures users only see "JUSD" in the UI, never "svJUSD".
 */
export function transformSvJusdToken(token: SdkToken, chainId?: UniverseChainId): SdkToken {
  const effectiveChainId = chainId ?? token.chainId
  if (isSvJusdAddress(effectiveChainId, token.address)) {
    const jusdAddress = getJusdAddress(effectiveChainId)
    if (jusdAddress) {
      return new SdkToken(
        effectiveChainId,
        jusdAddress,
        JUSD_METADATA.decimals,
        JUSD_METADATA.symbol,
        JUSD_METADATA.name,
      )
    }
  }
  return token
}

// ===== svJUSD Share Price Utilities =====

/**
 * Default share price (1:1) used when no share price is available
 * Represents 1e18 in string format
 */
export const DEFAULT_SHARE_PRICE = '1000000000000000000'

/**
 * Convert JUSD amount to svJUSD shares using share price
 *
 * @param jusdAmount - JUSD amount as string (in wei)
 * @param sharePrice - Share price as string (18 decimals, e.g., "1020000000000000000" = 1.02)
 * @returns svJUSD shares as string (in wei)
 */
export function jusdToSvJusd(jusdAmount: string, sharePrice: string): string {
  const jusd = BigInt(jusdAmount)
  const price = BigInt(sharePrice || DEFAULT_SHARE_PRICE)
  const one = BigInt(DEFAULT_SHARE_PRICE) // 1e18

  // svJUSD = JUSD * 1e18 / sharePrice
  const svJusd = (jusd * one) / price
  return svJusd.toString()
}

/**
 * Convert svJUSD shares to JUSD amount using share price
 *
 * @param svJusdAmount - svJUSD shares as string (in wei)
 * @param sharePrice - Share price as string (18 decimals, e.g., "1020000000000000000" = 1.02)
 * @returns JUSD amount as string (in wei)
 */
export function svJusdToJusd(svJusdAmount: string, sharePrice: string): string {
  const svJusd = BigInt(svJusdAmount)
  const price = BigInt(sharePrice || DEFAULT_SHARE_PRICE)
  const one = BigInt(DEFAULT_SHARE_PRICE) // 1e18

  // JUSD = svJUSD * sharePrice / 1e18
  const jusd = (svJusd * price) / one
  return jusd.toString()
}

/**
 * Check if a token pair involves JUSD on a given chain.
 * This is used to determine if share price adjustments are needed for LP operations.
 *
 * @param chainId - The chain ID to check
 * @param token0Address - Address of token0
 * @param token1Address - Address of token1
 * @returns true if either token is JUSD or svJUSD
 */
export function isJusdPool(chainId: UniverseChainId, token0Address: string, token1Address: string): boolean {
  return (
    isJusdAddress(chainId, token0Address) ||
    isJusdAddress(chainId, token1Address) ||
    isSvJusdAddress(chainId, token0Address) ||
    isSvJusdAddress(chainId, token1Address)
  )
}

/**
 * Determine which token in a pair is JUSD (or svJUSD)
 *
 * @param chainId - The chain ID to check
 * @param token0Address - Address of token0
 * @param token1Address - Address of token1
 * @returns 'TOKEN_0', 'TOKEN_1', or null if neither is JUSD
 */
export function getJusdTokenInPair(
  chainId: UniverseChainId,
  token0Address: string,
  token1Address: string,
): 'TOKEN_0' | 'TOKEN_1' | null {
  if (isJusdAddress(chainId, token0Address) || isSvJusdAddress(chainId, token0Address)) {
    return 'TOKEN_0'
  }
  if (isJusdAddress(chainId, token1Address) || isSvJusdAddress(chainId, token1Address)) {
    return 'TOKEN_1'
  }
  return null
}
