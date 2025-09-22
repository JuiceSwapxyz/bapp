import { Percent } from '@juiceswapxyz/sdk-core'
import { ExploreStatsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { PoolSortFields } from 'appGraphql/data/pools/useTopPools'
import { OrderDirection } from 'appGraphql/data/util'
import { ExternalArrowLink } from 'components/Liquidity/ExternalArrowLink'
import { HARDCODED_CITREA_POOLS } from 'constants/hardcodedPools'
import { TopPoolsSection } from 'pages/Positions/TopPoolsSection'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useTopPools } from 'state/explore/topPools'
import { PoolStat } from 'state/explore/types'
import { Flex, useMedia } from 'ui/src'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ALL_NETWORKS_ARG } from 'uniswap/src/data/rest/base'
import { useExploreStatsQuery } from 'uniswap/src/data/rest/exploreStats'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { selectIsCitreaOnlyEnabled } from 'uniswap/src/features/settings/selectors'

export function TopPools({ chainId }: { chainId: UniverseChainId | null }) {
  const { t } = useTranslation()
  const media = useMedia()
  const isBelowXlScreen = !media.xl
  const isCitreaOnlyEnabled = useSelector(selectIsCitreaOnlyEnabled)

  // Always call hooks before any conditional returns
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

  // Early return if not below XL screen
  if (!isBelowXlScreen) {
    return null
  }

  // If Citrea Only is enabled or Citrea testnet is selected, show hardcoded pools
  if (isCitreaOnlyEnabled || chainId === UniverseChainId.CitreaTestnet) {
    // Convert hardcoded pools to minimal format needed for TopPoolsSection
    const citreaPools = HARDCODED_CITREA_POOLS.map((pool) => ({
      id: pool.id,
      chain: Chain.UnknownChain, // Use UnknownChain since Citrea is not in the enum
      protocolVersion: 'v3',
      token0: {
        address: pool.token0.address,
        symbol: pool.token0.symbol,
        name: pool.token0.name,
        decimals: pool.token0.decimals,
        project: { name: pool.token0.name },
      } as any,
      token1: {
        address: pool.token1.address,
        symbol: pool.token1.symbol,
        name: pool.token1.name,
        decimals: pool.token1.decimals,
        project: { name: pool.token1.name },
      } as any,
      feeTier: {
        feeAmount: pool.feeTier,
        tickSpacing: 60,
        isDynamic: false,
      },
      totalLiquidity: { value: pool.tvlUSD } as any,
      volume1Day: { value: pool.volume24hUSD } as any,
      apr: new Percent(Math.round(pool.apr * 100), 10000),
      volOverTvl: pool.volume24hUSD / pool.tvlUSD,
    })) as PoolStat[]

    return (
      <Flex gap={48}>
        <Flex gap="$gap20">
          <TopPoolsSection title={t('pool.top.tvl')} pools={citreaPools} isLoading={false} />
          <ExternalArrowLink href="/explore/pools/citrea_testnet" openInNewTab={false}>
            {t('explore.more.pools')}
          </ExternalArrowLink>
        </Flex>
      </Flex>
    )
  }

  const displayTopPools = topPools && topPools.length > 0

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
