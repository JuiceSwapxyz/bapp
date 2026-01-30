import { memo, useCallback, useMemo, useRef } from 'react'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { useHardcodedCommonTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/useHardcodedCommonTokensOptions'
import { usePortfolioTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioTokenOptions'
import { OnSelectCurrency, TokenSectionsHookProps } from 'uniswap/src/components/TokenSelector/types'
import { OnchainItemSectionName, type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { TokenSelectorOption } from 'uniswap/src/components/lists/items/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { GqlResult } from 'uniswap/src/data/types'
import { useBridgingTokensOptions } from 'uniswap/src/features/bridging/hooks/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

function useTokenSectionsForSwap({
  activeAccountAddress,
  chainFilter,
  oppositeSelectedToken,
}: TokenSectionsHookProps): GqlResult<OnchainItemSection<TokenSelectorOption>[]> {
  const { defaultChainId } = useEnabledChains()

  // Compute effective chain filter once, use for all hooks to ensure consistent filtering
  const effectiveChainFilter = chainFilter ?? oppositeSelectedToken?.chainId ?? defaultChainId

  const {
    data: commonTokenOptions,
    refetch: refetchCommonTokenOptions,
    loading: commonTokenOptionsLoading,
  } = useHardcodedCommonTokensOptions(effectiveChainFilter)

  const {
    data: portfolioTokenOptions,
    loading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptions({
    address: activeAccountAddress as `0x${string}` | undefined,
    chainFilter: effectiveChainFilter,
  })

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

  const suggestedSectionOptions = useMemo(() => [commonTokenOptions ?? []], [commonTokenOptions])
  const suggestedSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.SuggestedTokens,
    options: suggestedSectionOptions,
  })

  const yourTokensSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.YourTokens,
    options: portfolioTokenOptions,
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
    if (commonTokenOptionsLoading || portfolioTokenOptionsLoading) {
      return undefined
    }

    return [...(suggestedSection ?? []), ...(bridgingSection ?? []), ...(yourTokensSection ?? [])]
  }, [commonTokenOptionsLoading, portfolioTokenOptionsLoading, suggestedSection, yourTokensSection, bridgingSection])

  return useMemo(
    () => ({
      data: sections,
      loading: loading || portfolioTokenOptionsLoading,
      error: undefined,
      refetch,
    }),
    [loading, portfolioTokenOptionsLoading, refetch, sections],
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
