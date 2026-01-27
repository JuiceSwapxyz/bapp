import { ChainId, Currency, WETH9 } from '@juiceswapxyz/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { JUICE_ADDRESSES, JUSD_ADDRESSES } from 'uniswap/src/features/tokens/jusdAbstraction'
import { loadAllPackageTokens } from 'uniswap/src/features/tokens/npmPackageTokens'

// Addresses from canonical packages - single source of truth
const JUSD_ADDRESS = JUSD_ADDRESSES[UniverseChainId.CitreaTestnet] ?? ''
const JUICE_ADDRESS = JUICE_ADDRESSES[UniverseChainId.CitreaTestnet] ?? ''

const JUSD_MAINNET_ADDRESS = JUSD_ADDRESSES[UniverseChainId.CitreaMainnet] ?? ''

const citreaNativeCurrency = {
  currency: buildCurrency({
    chainId: UniverseChainId.CitreaTestnet,
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    symbol: 'cBTC',
    name: 'cBTC',
  }) as Currency,
  currencyId: `${UniverseChainId.CitreaTestnet}-0x0000000000000000000000000000000000000000`,
  logoUrl: 'https://docs.juiceswap.com/media/icons/cbtc.png',
}

const citreaNativeMainnetCurrency = {
  currency: buildCurrency({
    chainId: UniverseChainId.CitreaMainnet,
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    symbol: 'cBTC',
    name: 'cBTC',
  }) as Currency,
  currencyId: `${UniverseChainId.CitreaMainnet}-0x0000000000000000000000000000000000000000`,
  logoUrl: 'https://docs.juiceswap.com/media/icons/cbtc.png',
}

const citreaWrappedNativeCurrency = {
  currency: buildCurrency({
    chainId: UniverseChainId.CitreaTestnet,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    address: WETH9[ChainId.CITREA_TESTNET]!.address,
    decimals: 18,
    symbol: 'WcBTC',
    name: 'Wrapped Citrea BTC',
  }) as Currency,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  currencyId: `${UniverseChainId.CitreaTestnet}-${WETH9[ChainId.CITREA_TESTNET]!.address}`,
  logoUrl: 'https://docs.juiceswap.com/media/icons/cbtc.png',
}

const citreaWrappedNativeMainnetCurrency = {
  currency: buildCurrency({
    chainId: UniverseChainId.CitreaMainnet,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    address: WETH9[ChainId.CITREA_MAINNET]!.address,
    decimals: 18,
    symbol: 'WcBTC',
    name: 'Wrapped Citrea BTC',
  }) as Currency,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  currencyId: `${UniverseChainId.CitreaMainnet}-${WETH9[ChainId.CITREA_MAINNET]!.address}`,
  logoUrl: 'https://docs.juiceswap.com/media/icons/cbtc.png',
}

// Most Citrea tokens are now loaded dynamically from npm packages.
// See loadAllPackageTokens() in npmPackageTokens.ts
// Only hardcode tokens that are NOT in npm packages (like testnet-specific tokens)

// Testnet-only tokens (not in npm package)
const citreaNusdCurrency = {
  currency: buildCurrency({
    chainId: UniverseChainId.CitreaTestnet,
    address: '0x9B28B690550522608890C3C7e63c0b4A7eBab9AA',
    decimals: 18,
    symbol: 'NUSD',
    name: 'Nectra USD',
  }) as Currency,
  currencyId: `${UniverseChainId.CitreaTestnet}-0x9B28B690550522608890C3C7e63c0b4A7eBab9AA`,
  logoUrl: 'https://docs.juiceswap.com/media/icons/nusd.png',
}

const citreaCusdCurrency = {
  currency: buildCurrency({
    chainId: UniverseChainId.CitreaTestnet,
    address: '0x2fFC18aC99D367b70dd922771dF8c2074af4aCE0',
    decimals: 18,
    symbol: 'cUSD',
    name: 'Citrus Dollar',
  }) as Currency,
  currencyId: `${UniverseChainId.CitreaTestnet}-0x2fFC18aC99D367b70dd922771dF8c2074af4aCE0`,
  logoUrl: 'https://docs.juiceswap.com/media/icons/cusd.png',
}

export function getSuggestedCitreaTokens(chainId: UniverseChainId): CurrencyInfo[] {
  const tokens: CurrencyInfo[] = []
  
  if (chainId === UniverseChainId.CitreaTestnet) {
    tokens.push(citreaNativeCurrency)
    tokens.push(citreaWrappedNativeCurrency)
    tokens.push(...loadAllPackageTokens(UniverseChainId.CitreaTestnet))
    tokens.push(citreaNusdCurrency)
    tokens.push(citreaCusdCurrency)
  } else if (chainId === UniverseChainId.CitreaMainnet) {
    tokens.push(citreaNativeMainnetCurrency)
    tokens.push(citreaWrappedNativeMainnetCurrency)
    tokens.push(...loadAllPackageTokens(UniverseChainId.CitreaMainnet))
  }
  
  return tokens
}

export const suggestedCitreaTokens: CurrencyInfo[] = [
  ...getSuggestedCitreaTokens(UniverseChainId.CitreaTestnet),
  ...getSuggestedCitreaTokens(UniverseChainId.CitreaMainnet),
]

/**
 * Get common base currencies for token selection.
 * Dynamically includes all tokens from npm packages for Citrea chains.
 */
export function getHardcodedCommonBaseCurrencies(): CurrencyInfo[] {
  const baseTokens: CurrencyInfo[] = [
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
    {
      currency: buildCurrency({
        chainId: UniverseChainId.Sepolia,
        address: '0x14ADf6B87096Ef750a956756BA191fc6BE94e473',
        decimals: 18,
        symbol: 'TFC',
        name: 'TaprootFreakCoin',
      }) as Currency,
      currencyId: `${UniverseChainId.Sepolia}-0x14ADf6B87096Ef750a956756BA191fc6BE94e473`,
      logoUrl: 'https://docs.juiceswap.com/media/icons/tfc.png',
    },
    
    // TFC on Citrea testnet
    {
      currency: buildCurrency({
        chainId: UniverseChainId.CitreaTestnet,
        address: '0x14ADf6B87096Ef750a956756BA191fc6BE94e473',
        decimals: 18,
        symbol: 'TFC',
        name: 'TaprootFreakCoin',
      }) as Currency,
      currencyId: `${UniverseChainId.CitreaTestnet}-0x14ADf6B87096Ef750a956756BA191fc6BE94e473`,
      logoUrl: 'https://docs.juiceswap.com/media/icons/tfc.png',
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
  
  baseTokens.push(...getSuggestedCitreaTokens(UniverseChainId.CitreaTestnet))
  baseTokens.push(...getSuggestedCitreaTokens(UniverseChainId.CitreaMainnet))
  
  return baseTokens
}

export const hardcodedCommonBaseCurrencies: CurrencyInfo[] = getHardcodedCommonBaseCurrencies()

/**
 * Checks if a given currency is a hardcoded trusted token that should not show safety warnings
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
