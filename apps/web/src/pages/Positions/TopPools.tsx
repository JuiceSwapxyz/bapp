import { ExploreStatsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { PoolSortFields } from 'appGraphql/data/pools/useTopPools'
import { OrderDirection } from 'appGraphql/data/util'
import { ExternalArrowLink } from 'components/Liquidity/ExternalArrowLink'
import { useAccount } from 'hooks/useAccount'
import { TopPoolsSection } from 'pages/Positions/TopPoolsSection'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useTopPools } from 'state/explore/topPools'
import { Flex, useMedia } from 'ui/src'
import { ALL_NETWORKS_ARG } from 'uniswap/src/data/rest/base'
import { useExploreStatsQuery } from 'uniswap/src/data/rest/exploreStats'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { selectIsCitreaOnlyEnabled } from 'uniswap/src/features/settings/selectors'
import { HARDCODED_CITREA_POOLS } from 'constants/hardcodedPools'
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { PoolStat } from 'state/explore/types'
import { Percent } from '@juiceswapxyz/sdk-core'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

const MAX_BOOSTED_POOLS = 3

export function TopPools({ chainId }: { chainId: UniverseChainId | null }) {
  const account = useAccount()
  const { t } = useTranslation()
  const isLPIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)
  const media = useMedia()
  const isBelowXlScreen = !media.xl
  const isCitreaOnlyEnabled = useSelector(selectIsCitreaOnlyEnabled)

  // If Citrea Only is enabled or Citrea testnet is selected, show hardcoded pools
  if (isCitreaOnlyEnabled || chainId === UniverseChainId.CitreaTestnet) {
    if (!isBelowXlScreen) {
      return null
    }

    // Convert hardcoded pools to minimal format needed for TopPoolsSection
    const citreaPools = HARDCODED_CITREA_POOLS.map(pool => ({
      id: pool.id,
      chain: Chain.UnknownChain, // Use UnknownChain since Citrea is not in the enum
      protocolVersion: ProtocolVersion.V3,
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

  const {
    data: exploreStatsData,
    isLoading: exploreStatsLoading,
    error: exploreStatsError,
  } = useExploreStatsQuery<ExploreStatsResponse>({
    input: { chainId: chainId ? chainId.toString() : ALL_NETWORKS_ARG },
  })

  const { topPools, topBoostedPools } = useTopPools({
    topPoolData: { data: exploreStatsData, isLoading: exploreStatsLoading, isError: !!exploreStatsError },
    sortState: { sortDirection: OrderDirection.Desc, sortBy: PoolSortFields.TVL },
  })

  const displayBoostedPools =
    topBoostedPools && topBoostedPools.length > 0 && Boolean(account.address) && isLPIncentivesEnabled
  const displayTopPools = topPools && topPools.length > 0

  if (!isBelowXlScreen) {
    return null
  }

  return (
    <Flex gap={48}>
      {displayBoostedPools && (
        <Flex gap="$gap20">
          <TopPoolsSection
            title={t('pool.top.rewards')}
            pools={topBoostedPools.slice(0, MAX_BOOSTED_POOLS)}
            isLoading={exploreStatsLoading}
          />
          <ExternalArrowLink href="/explore/pools" openInNewTab={false}>
            {t('explore.more.unichain')}
          </ExternalArrowLink>
        </Flex>
      )}
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
