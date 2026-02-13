import { useMemo } from 'react'
import { filter } from 'uniswap/src/components/TokenSelector/filter'
import { usePortfolioBalancesForAddressById } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { OnchainItemListOptionType, TokenOption } from 'uniswap/src/components/lists/items/types'
import { GqlResult } from 'uniswap/src/data/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  sortPortfolioBalances,
  useTokenBalancesGroupedByVisibility,
} from 'uniswap/src/features/dataApi/balances/balances'
import { getTokenLogoFromRegistry } from 'uniswap/src/features/tokens/tokenRegistry'

export function usePortfolioTokenOptions({
  address,
  chainFilter,
  searchFilter,
}: {
  address: Address | undefined
  chainFilter: UniverseChainId | null
  searchFilter?: string
}): GqlResult<TokenOption[] | undefined> {
  const { data: portfolioBalancesById, error, refetch, loading } = usePortfolioBalancesForAddressById(address)
  const { isTestnetModeEnabled } = useEnabledChains()

  const { shownTokens } = useTokenBalancesGroupedByVisibility({
    balancesById: portfolioBalancesById,
  })

  const portfolioBalances: TokenOption[] | undefined = useMemo(
    () =>
      shownTokens
        ? sortPortfolioBalances({ balances: shownTokens, isTestnetModeEnabled }).map((balance) => {
            const { currencyInfo } = balance
            return {
              ...balance,
              currencyInfo: {
                ...currencyInfo,
                logoUrl:
                  currencyInfo.logoUrl ||
                  (!currencyInfo.currency.isNative
                    ? getTokenLogoFromRegistry(currencyInfo.currency.chainId, currencyInfo.currency.address)
                    : undefined),
              },
              type: OnchainItemListOptionType.Token,
            }
          })
        : undefined,
    [shownTokens, isTestnetModeEnabled],
  )

  const filteredPortfolioBalances = useMemo(
    () => portfolioBalances && filter({ tokenOptions: portfolioBalances, chainFilter, searchFilter }),
    [chainFilter, portfolioBalances, searchFilter],
  )

  return {
    data: filteredPortfolioBalances,
    error,
    refetch,
    loading,
  }
}
