import { Currency } from '@juiceswapxyz/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'

export const hardcodedCommonBaseCurrencies: CurrencyInfo[] = [
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
    logoUrl: '',
  },
  {
    currency: buildCurrency({
      chainId: UniverseChainId.CitreaTestnet,
      address: '0x2fFC18aC99D367b70dd922771dF8c2074af4aCE0',
      decimals: 18,
      symbol: 'cUSD',
      name: 'Citrus Dollar',
    }) as Currency,
    currencyId: `${UniverseChainId.CitreaTestnet}-0x2fFC18aC99D367b70dd922771dF8c2074af4aCE0`,
    logoUrl: '',
  },
  {
    currency: buildCurrency({
      chainId: UniverseChainId.CitreaTestnet,
      address: '0x4370e27F7d91D9341bFf232d7Ee8bdfE3a9933a0',
      decimals: 18,
      symbol: 'WcBTC',
      name: 'Wrapped Citrea BTC',
    }) as Currency,
    currencyId: `${UniverseChainId.CitreaTestnet}-0x4370e27F7d91D9341bFf232d7Ee8bdfE3a9933a0`,
    logoUrl: '',
  },
  {
    currency: buildCurrency({
      chainId: UniverseChainId.CitreaTestnet,
      address: '0x36c16eaC6B0Ba6c50f494914ff015fCa95B7835F',
      decimals: 6,
      symbol: 'USDC',
      name: 'USDC (Satsuma)',
    }) as Currency,
    currencyId: `${UniverseChainId.CitreaTestnet}-0x36c16eaC6B0Ba6c50f494914ff015fCa95B7835F`,
    logoUrl: '',
  },
  {
    currency: buildCurrency({
      chainId: UniverseChainId.CitreaTestnet,
      address: '0x9B28B690550522608890C3C7e63c0b4A7eBab9AA',
      decimals: 18,
      symbol: 'NUSD',
      name: 'Nectra USD',
    }) as Currency,
    currencyId: `${UniverseChainId.CitreaTestnet}-0x9B28B690550522608890C3C7e63c0b4A7eBab9AA`,
    logoUrl: '',
  },
  {
    currency: buildCurrency({
      chainId: UniverseChainId.CitreaTestnet,
      address: '0x14ADf6B87096Ef750a956756BA191fc6BE94e473',
      decimals: 18,
      symbol: 'TFC',
      name: 'TaprootFreakCoin',
    }) as Currency,
    currencyId: `${UniverseChainId.CitreaTestnet}-0x14ADf6B87096Ef750a956756BA191fc6BE94e473`,
    logoUrl: '',
  },
]

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
