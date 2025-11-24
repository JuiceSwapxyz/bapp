import { memo, useCallback, useMemo, useRef } from 'react'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { useCommonTokensOptionsWithFallback } from 'uniswap/src/components/TokenSelector/hooks/useCommonTokensOptionsWithFallback'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { OnSelectCurrency, TokenSectionsHookProps } from 'uniswap/src/components/TokenSelector/types'
import { OnchainItemSectionName, type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { TokenSelectorOption } from 'uniswap/src/components/lists/items/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { GqlResult } from 'uniswap/src/data/types'
import { useBridgingTokensOptions } from 'uniswap/src/features/bridging/hooks/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { suggestedCitreaTokens } from 'uniswap/src/features/tokens/hardcodedTokens'

function useTokenSectionsForSwap({
  activeAccountAddress,
  chainFilter,
  oppositeSelectedToken,
}: TokenSectionsHookProps): GqlResult<OnchainItemSection<TokenSelectorOption>[]> {
  const { defaultChainId } = useEnabledChains()

  const {
    data: commonTokenOptions,
    refetch: refetchCommonTokenOptions,
    loading: commonTokenOptionsLoading,
    // if there is no chain filter, first check if the input token has a chainId, fallback to defaultChainId
  } = useCommonTokensOptionsWithFallback(
    activeAccountAddress as `0x${string}` | undefined,
    chainFilter ?? oppositeSelectedToken?.chainId ?? defaultChainId,
  )

  const {
    data: bridgingTokenOptions,
    refetch: refetchBridgingTokenOptions,
    loading: bridgingTokenOptionsLoading,
    shouldNest: shouldNestBridgingTokens,
  } = useBridgingTokensOptions({ oppositeSelectedToken, walletAddress: activeAccountAddress, chainFilter })

  const loading = !commonTokenOptions && commonTokenOptionsLoading && bridgingTokenOptionsLoading

  const refetchAllRef = useRef<() => void>(() => {})

  refetchAllRef.current = (): void => {
    refetchCommonTokenOptions?.()
    refetchBridgingTokenOptions?.()
  }

  const refetch = useCallback(() => {
    refetchAllRef.current()
  }, [])

  // we draw the Suggested pills as a single item of a section list, so `data` is TokenOption[][]

  const suggestedSectionOptions = useMemo(() => [commonTokenOptions ?? []], [commonTokenOptions])
  const suggestedSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.SuggestedTokens,
    options: suggestedSectionOptions,
  })

  const yourTokensSectionOptions = useCurrencyInfosToTokenOptions({
    currencyInfos: suggestedCitreaTokens,
    portfolioBalancesById: {},
  })

  const yourTokensSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.YourTokens,
    options: yourTokensSectionOptions,
  })

  const bridgingSectionTokenOptions: TokenSelectorOption[] = useMemo(
    () => (shouldNestBridgingTokens ? [bridgingTokenOptions ?? []] : bridgingTokenOptions ?? []),
    [bridgingTokenOptions, shouldNestBridgingTokens],
  )

  const bridgingSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.BridgingTokens,
    options: bridgingSectionTokenOptions,
  })

  const sections = useMemo(() => {
    if (commonTokenOptionsLoading) {
      return undefined
    }

    return [...(suggestedSection ?? []), ...(bridgingSection ?? []), ...(yourTokensSection ?? [])]
  }, [commonTokenOptionsLoading, suggestedSection, yourTokensSection, bridgingSection])

  return useMemo(
    () => ({
      data: sections,
      loading,
      error: undefined,
      refetch,
    }),
    [loading, refetch, sections],
  )
}

function _TokenSelectorSwapList({
  onSelectCurrency,
  activeAccountAddress,
  chainFilter,
  oppositeSelectedToken,
}: TokenSectionsHookProps & {
  onSelectCurrency: OnSelectCurrency
  chainFilter: UniverseChainId | null
}): JSX.Element {
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForSwap({
    activeAccountAddress,
    chainFilter,
    oppositeSelectedToken,
  })

  return (
    <TokenSelectorList
      showTokenAddress
      chainFilter={chainFilter}
      hasError={Boolean(error)}
      loading={loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={true}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSwapList = memo(_TokenSelectorSwapList)
