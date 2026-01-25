import { ADDRESS } from '@juicedollar/jusd'
import { Currency } from '@juiceswapxyz/sdk-core'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { CurrencyId } from 'uniswap/src/types/currency'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

const JUSD_CITREA = ADDRESS[5115]!.juiceDollar
const USDT_POLYGON = '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'
const USDT_ETHEREUM = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const USDC_ETHEREUM = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

// L0 bridged tokens on Citrea
const WBTC_E_CITREA = '0xDF240DC08B0FdaD1d93b74d5048871232f6BEA3d'
const USDC_E_CITREA = '0xE045e6c36cF77FAA2CfB54466D71A3aEF7bbE839'
const USDT_E_CITREA = '0x9f3096Bac87e7F03DC09b0B416eB0DF837304dc4'

const localCurrencyInfo: CurrencyInfo[] = [
  {
    currency: buildCurrency({
      chainId: UniverseChainId.Bitcoin,
      address: getChainInfo(UniverseChainId.Bitcoin).nativeCurrency.address,
      decimals: getChainInfo(UniverseChainId.Bitcoin).nativeCurrency.decimals,
      symbol: getChainInfo(UniverseChainId.Bitcoin).nativeCurrency.symbol,
      name: getChainInfo(UniverseChainId.Bitcoin).nativeCurrency.name,
    }) as Currency,
    currencyId: buildCurrencyId(UniverseChainId.Bitcoin, getChainInfo(UniverseChainId.Bitcoin).nativeCurrency.address),
    logoUrl: 'https://docs.juiceswap.com/media/icons/cbtc.png',
  },
  {
    currency: buildCurrency({
      chainId: UniverseChainId.LightningNetwork,
      address: getChainInfo(UniverseChainId.LightningNetwork).nativeCurrency.address,
      decimals: getChainInfo(UniverseChainId.LightningNetwork).nativeCurrency.decimals,
      symbol: getChainInfo(UniverseChainId.LightningNetwork).nativeCurrency.symbol,
      name: getChainInfo(UniverseChainId.LightningNetwork).nativeCurrency.name,
    }) as Currency,
    currencyId: buildCurrencyId(
      UniverseChainId.LightningNetwork,
      getChainInfo(UniverseChainId.LightningNetwork).nativeCurrency.address,
    ),
    logoUrl: 'https://docs.juiceswap.com/media/icons/cbtc.png',
  },
  {
    currency: buildCurrency({
      chainId: UniverseChainId.CitreaTestnet,
      address: JUSD_CITREA,
      decimals: 18,
      symbol: 'JUSD',
      name: 'JuiceSwap USD',
    }) as Currency,
    currencyId: buildCurrencyId(UniverseChainId.CitreaTestnet, JUSD_CITREA),
    logoUrl: 'https://docs.juiceswap.com/media/icons/jusd.png',
  },
  {
    currency: buildCurrency({
      chainId: UniverseChainId.Polygon,
      address: USDT_POLYGON,
      decimals: 6,
      symbol: 'USDT',
      name: 'Tether USD',
    }) as Currency,
    currencyId: buildCurrencyId(UniverseChainId.Polygon, USDT_POLYGON),
    logoUrl: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  },
  {
    currency: buildCurrency({
      chainId: UniverseChainId.Mainnet,
      address: USDT_ETHEREUM,
      decimals: 6,
      symbol: 'USDT',
      name: 'Tether USD',
    }) as Currency,
    currencyId: buildCurrencyId(UniverseChainId.Mainnet, USDT_ETHEREUM),
    logoUrl: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  },
  {
    currency: buildCurrency({
      chainId: UniverseChainId.Mainnet,
      address: USDC_ETHEREUM,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
    }) as Currency,
    currencyId: buildCurrencyId(UniverseChainId.Mainnet, USDC_ETHEREUM),
    logoUrl: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
  },
  // L0 bridged tokens on Citrea
  {
    currency: buildCurrency({
      chainId: UniverseChainId.CitreaTestnet,
      address: WBTC_E_CITREA,
      decimals: 8,
      symbol: 'WBTC.e',
      name: 'Wrapped BTC (LayerZero)',
    }) as Currency,
    currencyId: buildCurrencyId(UniverseChainId.CitreaTestnet, WBTC_E_CITREA),
    logoUrl: 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png',
  },
  {
    currency: buildCurrency({
      chainId: UniverseChainId.CitreaTestnet,
      address: USDC_E_CITREA,
      decimals: 6,
      symbol: 'USDC.e',
      name: 'USD Coin (LayerZero)',
    }) as Currency,
    currencyId: buildCurrencyId(UniverseChainId.CitreaTestnet, USDC_E_CITREA),
    logoUrl: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
  },
  {
    currency: buildCurrency({
      chainId: UniverseChainId.CitreaTestnet,
      address: USDT_E_CITREA,
      decimals: 6,
      symbol: 'USDT.e',
      name: 'Tether USD (LayerZero)',
    }) as Currency,
    currencyId: buildCurrencyId(UniverseChainId.CitreaTestnet, USDT_E_CITREA),
    logoUrl: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  },
]

export function useLocalCurrencyInfo(currencyId?: CurrencyId): CurrencyInfo | undefined {
  if (!currencyId) {
    return undefined
  }
  const normalizedId = currencyId.toLowerCase()
  return localCurrencyInfo.find((c) => c.currencyId.toLowerCase() === normalizedId)
}
