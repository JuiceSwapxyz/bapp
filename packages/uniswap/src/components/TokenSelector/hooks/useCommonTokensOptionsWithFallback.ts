import { useMemo } from 'react'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { GqlResult } from 'uniswap/src/data/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { hardcodedCommonBaseCurrencies } from 'uniswap/src/features/tokens/hardcodedTokens'

export function useCommonTokensOptionsWithFallback(
  chainFilter: UniverseChainId | null,
): GqlResult<TokenOption[] | undefined> {
  const filteredCurrencies = useMemo(() => {
    if (!chainFilter) {
      return hardcodedCommonBaseCurrencies
    }
    return hardcodedCommonBaseCurrencies.filter(
      (currencyInfo) => currencyInfo.currency.chainId === chainFilter,
    )
  }, [chainFilter])

  const tokenOptions = useCurrencyInfosToTokenOptions({
    currencyInfos: filteredCurrencies,
    portfolioBalancesById: {},
  })

  return useMemo(
    () => ({
      data: tokenOptions?.map((token) => ({ ...token, quantity: 0 })),
      error: undefined,
      refetch: (): void => {},
      loading: false,
    }),
    [tokenOptions],
  )
}
