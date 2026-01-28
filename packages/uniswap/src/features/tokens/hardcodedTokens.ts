/**
 * Hardcoded token lists for token selection and search.
 *
 * This module uses the unified token registry for Citrea chains
 * and maintains hardcoded lists for other testnets (Sepolia, Polygon).
 */
import { Currency } from '@juiceswapxyz/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { getAllKnownTokens } from 'uniswap/src/features/tokens/tokenRegistry'

// ============================================================================
// Non-Citrea Tokens (Sepolia, Polygon)
// ============================================================================

const NON_CITREA_TOKENS: CurrencyInfo[] = [
  // Sepolia testnet tokens
  {
    currency: buildCurrency({
      chainId: UniverseChainId.Sepolia,
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      decimals: 18,
      symbol: 'USDC',
      name: 'USDC',
    }) as Currency,
    currencyId: `${UniverseChainId.Sepolia}-0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`,
    logoUrl: 'https://assets.coingecko.com/coins/images/957/large/usd-coin.png?1547042194',
  },
  {
    currency: buildCurrency({
      chainId: UniverseChainId.Sepolia,
      address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
      decimals: 18,
      symbol: 'WETH',
      name: 'WETH',
    }) as Currency,
    currencyId: `${UniverseChainId.Sepolia}-0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14`,
    logoUrl: 'https://assets.coingecko.com/coins/images/2518/large/weth.png?1696501628',
  },
  // Polygon tokens
  {
    currency: buildCurrency({
      chainId: UniverseChainId.Polygon,
      address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      decimals: 6,
      symbol: 'USDT',
      name: 'Tether USD',
    }) as Currency,
    currencyId: `${UniverseChainId.Polygon}-0xc2132d05d31c914a87c6611c10748aeb04b58e8f`,
    logoUrl: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  },
]

// ============================================================================
// Public API
// ============================================================================

/**
 * Get all known tokens for a specific Citrea chain.
 * Uses the unified token registry.
 *
 * @deprecated Use getAllKnownTokens from tokenRegistry.ts directly
 */
export function getSuggestedCitreaTokens(chainId: UniverseChainId): CurrencyInfo[] {
  return getAllKnownTokens(chainId)
}

/**
 * All suggested Citrea tokens (both testnet and mainnet)
 *
 * @deprecated Use getAllKnownTokens from tokenRegistry.ts directly
 */
export const suggestedCitreaTokens: CurrencyInfo[] = [
  ...getAllKnownTokens(UniverseChainId.CitreaTestnet),
  ...getAllKnownTokens(UniverseChainId.CitreaMainnet),
]

/**
 * Get common base currencies for token selection.
 * Includes all known tokens from the unified registry for Citrea chains,
 * plus hardcoded tokens for other chains (Sepolia, Polygon).
 */
export function getHardcodedCommonBaseCurrencies(): CurrencyInfo[] {
  return [
    ...NON_CITREA_TOKENS,
    ...getAllKnownTokens(UniverseChainId.CitreaTestnet),
    ...getAllKnownTokens(UniverseChainId.CitreaMainnet),
  ]
}

/**
 * Pre-computed list of all hardcoded common base currencies.
 * Used for token search and selection.
 */
export const hardcodedCommonBaseCurrencies: CurrencyInfo[] = getHardcodedCommonBaseCurrencies()

/**
 * Checks if a given currency is a hardcoded trusted token that should not show safety warnings.
 * All tokens in the registry are considered trusted.
 */
export function isHardcodedTrustedToken(currency: Currency): boolean {
  if (currency.isNative) {
    return true
  }

  // Check if the currency matches any of our hardcoded common base currencies
  return hardcodedCommonBaseCurrencies.some(
    (hardcodedCurrency) =>
      hardcodedCurrency.currency.chainId === currency.chainId &&
      !hardcodedCurrency.currency.isNative &&
      'address' in hardcodedCurrency.currency &&
      'address' in currency &&
      hardcodedCurrency.currency.address.toLowerCase() === currency.address.toLowerCase(),
  )
}
