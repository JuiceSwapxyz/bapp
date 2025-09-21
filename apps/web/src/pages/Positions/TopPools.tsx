import { ExploreStatsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { PoolSortFields } from 'appGraphql/data/pools/useTopPools'
import { OrderDirection } from 'appGraphql/data/util'
import { ExternalArrowLink } from 'components/Liquidity/ExternalArrowLink'
import { TopPoolsSection } from 'pages/Positions/TopPoolsSection'
import { useTranslation } from 'react-i18next'
import { useTopPools } from 'state/explore/topPools'
import { Flex, useMedia } from 'ui/src'
import { ALL_NETWORKS_ARG } from 'uniswap/src/data/rest/base'
import { useExploreStatsQuery } from 'uniswap/src/data/rest/exploreStats'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export function TopPools({ chainId }: { chainId: UniverseChainId | null }) {
  const { t } = useTranslation()
  const media = useMedia()
  const isBelowXlScreen = !media.xl

  const {
    data: exploreStatsData,
    isLoading: exploreStatsLoading,
    error: exploreStatsError,
  } = useExploreStatsQuery<ExploreStatsResponse>({
    input: { chainId: chainId ? chainId.toString() : ALL_NETWORKS_ARG },
  })

  const { topPools } = useTopPools({
    topPoolData: { data: exploreStatsData, isLoading: exploreStatsLoading, isError: !!exploreStatsError },
    sortState: { sortDirection: OrderDirection.Desc, sortBy: PoolSortFields.TVL },
  })

  const displayTopPools = topPools && topPools.length > 0

  if (!isBelowXlScreen) {
    return null
  }

  return (
    <Flex gap={48}>
      {displayTopPools && (
        <Flex gap="$gap20">
          <TopPoolsSection title={t('pool.top.tvl')} pools={topPools} isLoading={exploreStatsLoading} />
          <ExternalArrowLink href="/explore/pools" openInNewTab={false}>
            {t('explore.more.pools')}
          </ExternalArrowLink>
        </Flex>
      )}
    </Flex>
  )
}
