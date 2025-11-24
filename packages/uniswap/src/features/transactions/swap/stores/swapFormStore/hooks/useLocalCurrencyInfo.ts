import { Currency } from '@juiceswapxyz/sdk-core'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { CurrencyId } from 'uniswap/src/types/currency'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

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
]

export function useLocalCurrencyInfo(currencyId?: CurrencyId): CurrencyInfo | undefined {
  if (!currencyId) {
    return undefined
  }
  return localCurrencyInfo.find((c) => c.currencyId === currencyId)
}
