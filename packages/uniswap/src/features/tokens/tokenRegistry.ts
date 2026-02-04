/**
 * Token Registry - Single source of truth for all known tokens
 *
 * This module provides a unified registry of all known tokens across chains,
 * including native currencies, wrapped natives, bridged tokens, and ecosystem tokens.
 */
import { ADDRESS, ChainAddress } from '@juicedollar/jusd/exports/address.config'
import { ChainId, USDC_E, USDT_E, WBTC_E, WETH9 } from '@juiceswapxyz/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSdkCoreChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { logger } from 'utilities/src/logger/logger'

// ============================================================================
// Token Metadata
// ============================================================================

interface TokenMetadata {
  symbol: string
  name: string
  decimals: number
  logoUrl: string
  displayInUI: boolean
}

/**
 * Centralized token metadata - all logos and display preferences in one place
 */
const TOKEN_METADATA: Record<string, TokenMetadata> = {
  // Native currency
  cBTC: {
    symbol: 'cBTC',
    name: 'cBTC',
    decimals: 18,
    logoUrl: 'https://docs.juiceswap.com/media/icons/cbtc.png',
    displayInUI: true,
  },
  // Wrapped native
  WcBTC: {
    symbol: 'WcBTC',
    name: 'Wrapped Citrea BTC',
    decimals: 18,
    logoUrl: 'https://docs.juiceswap.com/media/icons/cbtc.png',
    displayInUI: true,
  },
  // JuiceDollar ecosystem
  juiceDollar: {
    symbol: 'JUSD',
    name: 'Juice Dollar',
    decimals: 18,
    logoUrl: 'https://docs.juiceswap.com/media/icons/jusd.png',
    displayInUI: true,
  },
  equity: {
    symbol: 'JUICE',
    name: 'JUICE Equity',
    decimals: 18,
    logoUrl: 'https://docs.juiceswap.com/media/icons/juice.png',
    displayInUI: true,
  },
  savingsVaultJUSD: {
    symbol: 'svJUSD',
    name: 'Savings Vault JUSD',
    decimals: 18,
    logoUrl: 'https://docs.juiceswap.com/media/icons/jusd.png',
    displayInUI: false, // Hidden - internal vault token
  },
  startUSD: {
    symbol: 'SUSD',
    name: 'StartUSD',
    decimals: 18,
    logoUrl: 'https://docs.juiceswap.com/media/icons/susd.png',
    displayInUI: false, // Hidden - internal collateral
  },
  CTUSD: {
    symbol: 'ctUSD',
    name: 'Citrus USD',
    decimals: 6,
    logoUrl: 'https://docs.juiceswap.com/media/icons/cusd.png',
    displayInUI: true,
  },
  // LayerZero bridged tokens
  'WBTC.e': {
    symbol: 'WBTC.e',
    name: 'Wrapped BTC (LayerZero)',
    decimals: 8,
    logoUrl: 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png',
    displayInUI: true,
  },
  'USDC.e': {
    symbol: 'USDC.e',
    name: 'USD Coin (LayerZero)',
    decimals: 6,
    logoUrl: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
    displayInUI: true,
  },
  'USDT.e': {
    symbol: 'USDT.e',
    name: 'Tether USD (LayerZero)',
    decimals: 6,
    logoUrl: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
    displayInUI: true,
  },
}

/**
 * Get token symbols hidden from UI (displayInUI: false in TOKEN_METADATA).
 * This is the single source of truth for hidden tokens in the frontend.
 */
export function getHiddenTokenSymbols(): Set<string> {
  const hidden = new Set<string>()
  for (const metadata of Object.values(TOKEN_METADATA)) {
    if (!metadata.displayInUI) {
      hidden.add(metadata.symbol)
    }
  }
  return hidden
}

// ============================================================================
// Bridged Token Helpers
// ============================================================================

/**
 * SDK-core bridged tokens indexed by metadata key.
 * Only includes chains defined in @juiceswapxyz/sdk-core.
 */
const SDK_BRIDGED_TOKENS = {
  'WBTC.e': WBTC_E,
  'USDC.e': USDC_E,
  'USDT.e': USDT_E,
}

// ============================================================================
// Chain ID Mapping
// ============================================================================

function isCitreaChain(chainId: UniverseChainId): boolean {
  return chainId === UniverseChainId.CitreaTestnet || chainId === UniverseChainId.CitreaMainnet
}

// ============================================================================
// Token Building Helpers
// ============================================================================

interface BuildTokenParams {
  chainId: UniverseChainId
  address: string
  metadata: TokenMetadata
}

function buildTokenCurrencyInfo({ chainId, address, metadata }: BuildTokenParams): CurrencyInfo | null {
  try {
    const currency = buildCurrency({
      chainId,
      address,
      decimals: metadata.decimals,
      symbol: metadata.symbol,
      name: metadata.name,
    })

    if (!currency) {
      return null
    }

    return {
      currency,
      currencyId: `${chainId}-${address}`,
      logoUrl: metadata.logoUrl,
    }
  } catch (error) {
    logger.error(error as Error, {
      tags: { file: 'tokenRegistry', function: 'buildTokenCurrencyInfo' },
      extra: { chainId, address, symbol: metadata.symbol },
    })
    return null
  }
}

// ============================================================================
// Keys to exclude from @juicedollar/jusd ADDRESS - these are contracts, not tokens
// ============================================================================

const CONTRACT_KEYS = new Set<keyof ChainAddress>([
  'frontendGateway',
  'savingsGateway',
  'mintingHubGateway',
  'roller',
  'positionFactoryV2',
  'genesisPosition',
  'bridgeStartUSD',
  'bridgeUSDC',
  'bridgeUSDT',
  'bridgeCTUSD',
])

// ============================================================================
// Main Registry Function
// ============================================================================

/**
 * Get ALL known tokens for a chain.
 * Includes: native currency, wrapped native, bridged tokens (WBTC.e, USDC.e, USDT.e),
 * and JuiceDollar ecosystem tokens (JUSD, JUICE, CTUSD).
 *
 * @param chainId - The chain to get tokens for
 * @returns Array of CurrencyInfo objects for all known tokens on the chain
 */
export function getAllKnownTokens(chainId: UniverseChainId): CurrencyInfo[] {
  if (!isCitreaChain(chainId)) {
    return []
  }

  const numericChainId = toSdkCoreChainId(chainId)
  const tokens: CurrencyInfo[] = []
  const seenAddresses = new Set<string>()

  // Helper to add token with deduplication
  const addToken = (token: CurrencyInfo | null): void => {
    if (!token) {
      return
    }
    const normalizedAddress = token.currency.isNative
      ? 'native'
      : (token.currency as { address: string }).address.toLowerCase()
    if (seenAddresses.has(normalizedAddress)) {
      return
    }
    seenAddresses.add(normalizedAddress)
    tokens.push(token)
  }

  // 1. Native currency (cBTC)
  const nativeMetadata = TOKEN_METADATA.cBTC
  if (nativeMetadata) {
    const nativeToken = buildTokenCurrencyInfo({
      chainId,
      address: '0x0000000000000000000000000000000000000000',
      metadata: nativeMetadata,
    })
    addToken(nativeToken)
  }

  // 2. Wrapped native (WcBTC)
  const sdkChainId = chainId === UniverseChainId.CitreaMainnet ? ChainId.CITREA_MAINNET : ChainId.CITREA_TESTNET
  const weth9 = WETH9[sdkChainId]
  if (weth9) {
    const wrappedMetadata = TOKEN_METADATA.WcBTC
    if (wrappedMetadata) {
      const wrappedToken = buildTokenCurrencyInfo({ chainId, address: weth9.address, metadata: wrappedMetadata })
      addToken(wrappedToken)
    }
  }

  // 3. LayerZero bridged tokens from sdk-core (WBTC.e, USDC.e, USDT.e)
  for (const [key, tokenMap] of Object.entries(SDK_BRIDGED_TOKENS)) {
    const sdkToken = tokenMap[sdkChainId]
    if (!sdkToken) {
      continue // Token not defined for this chain in sdk-core
    }
    const metadata = TOKEN_METADATA[key]
    if (metadata && metadata.displayInUI) {
      const token = buildTokenCurrencyInfo({ chainId, address: sdkToken.address, metadata })
      addToken(token)
    }
  }

  // 4. JuiceDollar ecosystem tokens from @juicedollar/jusd package
  if (numericChainId) {
    const chainAddresses = ADDRESS[numericChainId]
    if (chainAddresses) {
      for (const [key, address] of Object.entries(chainAddresses)) {
        // Skip contract addresses
        if (CONTRACT_KEYS.has(key as keyof ChainAddress) || !address) {
          continue
        }

        const metadata = TOKEN_METADATA[key]
        if (!metadata || !metadata.displayInUI) {
          continue
        }

        const token = buildTokenCurrencyInfo({ chainId, address, metadata })
        addToken(token)
      }
    }
  }

  return tokens
}

// ============================================================================
// Exported Constants
// ============================================================================

/**
 * Pre-computed token lists for each Citrea chain
 */
export const CITREA_MAINNET_TOKENS: CurrencyInfo[] = getAllKnownTokens(UniverseChainId.CitreaMainnet)
export const CITREA_TESTNET_TOKENS: CurrencyInfo[] = getAllKnownTokens(UniverseChainId.CitreaTestnet)

/**
 * Combined map of all known tokens by chain
 */
export const ALL_KNOWN_TOKENS: Map<UniverseChainId, CurrencyInfo[]> = new Map([
  [UniverseChainId.CitreaMainnet, CITREA_MAINNET_TOKENS],
  [UniverseChainId.CitreaTestnet, CITREA_TESTNET_TOKENS],
])

export function getLogoUrlBySymbol(symbol: string | undefined): string | undefined {
  if (!symbol) {
    return undefined
  }
  const entry = Object.values(TOKEN_METADATA).find(
    (m) => m.symbol.toLowerCase() === symbol.toLowerCase(),
  )
  return entry?.logoUrl
}

/**
 * Get the logo URL for a known token by address
 */
export function getTokenLogoFromRegistry(chainId: UniverseChainId, address: string): string | undefined {
  const tokens = ALL_KNOWN_TOKENS.get(chainId)
  if (!tokens) {
    return undefined
  }

  const normalizedAddress = address.toLowerCase()
  const token = tokens.find(
    (t) => !t.currency.isNative && (t.currency as { address: string }).address.toLowerCase() === normalizedAddress,
  )

  return token?.logoUrl as string | undefined
}
