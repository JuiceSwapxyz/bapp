import { ExploreStatsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { PoolSortFields } from 'appGraphql/data/pools/useTopPools'
import { OrderDirection } from 'appGraphql/data/util'
import { ExternalArrowLink } from 'components/Liquidity/ExternalArrowLink'
import { TopPoolsSection } from 'pages/Positions/TopPoolsSection'
import { useTranslation } from 'react-i18next'
import { useTopPools } from 'state/explore/topPools'
import { Flex, useMedia } from 'ui/src'
import { useExploreStatsQuery } from 'uniswap/src/data/rest/exploreStats'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export function TopPools({ chainId }: { chainId: UniverseChainId | null }) {
  const { t } = useTranslation()
  const media = useMedia()
  const isBelowXlScreen = !media.xl
  const { isTestnetModeEnabled } = useEnabledChains()

  // Determine the effective chainId for the API call
  // Use CitreaMainnet as default when no chain is selected and not in testnet mode
  const effectiveChainId =
    chainId ?? (isTestnetModeEnabled ? UniverseChainId.CitreaTestnet : UniverseChainId.CitreaMainnet)

  // Pools come from API/Ponder only - no hardcoded fallbacks
  const {
    data: exploreStatsData,
    isLoading: exploreStatsLoading,
    error: exploreStatsError,
  } = useExploreStatsQuery<ExploreStatsResponse>({
    chainId: effectiveChainId,
    enabled: true,
  })

  const { topPools } = useTopPools({
    topPoolData: { data: exploreStatsData, isLoading: exploreStatsLoading, isError: !!exploreStatsError },
    sortState: { sortDirection: OrderDirection.Desc, sortBy: PoolSortFields.TVL },
  })

  if (!isBelowXlScreen) {
    return null
  }

  const displayTopPools = topPools && topPools.length > 0
  const exploreLink = isTestnetModeEnabled ? '/explore/pools/citrea_testnet' : '/explore/pools'

  return (
    <Flex gap={48}>
      {displayTopPools && (
        <Flex gap="$gap20">
          <TopPoolsSection title={t('pool.top.tvl')} pools={topPools} isLoading={exploreStatsLoading} />
          <ExternalArrowLink href={exploreLink} openInNewTab={false}>
            {t('explore.more.pools')}
          </ExternalArrowLink>
        </Flex>
      )}
    </Flex>
  )
}
