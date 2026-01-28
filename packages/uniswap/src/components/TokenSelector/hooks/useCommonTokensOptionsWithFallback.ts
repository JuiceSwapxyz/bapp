import { useMemo } from 'react'
import { applyTokenDisplayRules } from 'uniswap/src/components/TokenSelector/tokenDisplayRules'
import { useCommonTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/useCommonTokensOptions'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { GqlResult } from 'uniswap/src/data/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { hardcodedCommonBaseCurrencies } from 'uniswap/src/features/tokens/hardcodedTokens'
import { Address } from 'viem'

export function useCommonTokensOptionsWithFallback(
  address: Address | undefined,
  chainFilter: UniverseChainId | null,
): GqlResult<TokenOption[] | undefined> {
  const { refetch, loading } = useCommonTokensOptions(address, chainFilter)

  // Filter hardcoded currencies by chainFilter if present
  const filteredCurrencies = useMemo(() => {
    if (!chainFilter) {
      return hardcodedCommonBaseCurrencies
    }
    return hardcodedCommonBaseCurrencies.filter((currencyInfo) => currencyInfo.currency.chainId === chainFilter)
  }, [chainFilter])

  const commonBasesTokenOptions = useCurrencyInfosToTokenOptions({
    currencyInfos: filteredCurrencies,
    portfolioBalancesById: {},
  })

  const filteredTokenOptions = useMemo(() => {
    if (!commonBasesTokenOptions) {
      return undefined
    }
    const tokensWithZeroBalance = commonBasesTokenOptions.map((token) => ({ ...token, quantity: 0 }))
    return applyTokenDisplayRules(tokensWithZeroBalance)
  }, [commonBasesTokenOptions])

  return useMemo(
    () => ({
      data: filteredTokenOptions,
      error: undefined,
      refetch,
      loading,
    }),
    [filteredTokenOptions, refetch, loading],
  )
}
