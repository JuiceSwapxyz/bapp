import { PriceChartData } from 'components/Charts/PriceChart'
import { ChartType } from 'components/Charts/utils'
import { ChartQueryResult, DataQuality, checkDataQuality } from 'components/Tokens/TokenDetails/ChartSection/util'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'
import { PoolPriceHistoryEntry } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { usePoolPriceHistory } from 'uniswap/src/data/apiClients/tradingApi/usePoolPriceHistory'
import { Chain, HistoryDuration } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { removeOutliers } from 'utils/prices'

export type PDPChartQueryVars = {
  addressOrId: string
  chain: Chain
  duration: HistoryDuration
  isV2: boolean
  isV3: boolean
  isV4: boolean
}

export function historyDurationToString(duration: HistoryDuration): string {
  switch (duration) {
    case HistoryDuration.Hour:
      // REST endpoints don't support hourly granularity; fall back to DAY
      return 'DAY'
    case HistoryDuration.Day:
      return 'DAY'
    case HistoryDuration.Week:
      return 'WEEK'
    case HistoryDuration.Month:
      return 'MONTH'
    case HistoryDuration.Year:
      return 'YEAR'
    default:
      return 'DAY'
  }
}

export function usePoolPriceChartData({
  variables,
  priceInverted,
}: {
  variables?: PDPChartQueryVars
  priceInverted: boolean
}): ChartQueryResult<PriceChartData, ChartType.PRICE> {
  const { defaultChainId } = useEnabledChains()
  const chainId = fromGraphQLChain(variables?.chain) ?? defaultChainId

  const { data, isLoading: loading } = usePoolPriceHistory({
    address: variables?.addressOrId,
    chainId,
    duration: historyDurationToString(variables?.duration ?? HistoryDuration.Day),
  })

  return useMemo(() => {
    const entries =
      data
        ?.filter((price: PoolPriceHistoryEntry) => price.token0Price > 0 || price.token1Price > 0)
        .map((price: PoolPriceHistoryEntry) => {
          const value = priceInverted ? price.token0Price : price.token1Price

          return {
            time: price.timestamp as UTCTimestamp,
            value,
            open: value,
            high: value,
            low: value,
            close: value,
          }
        }) ?? []

    const filteredEntries = removeOutliers(entries)

    const dataQuality =
      loading || !data || data.length === 0
        ? DataQuality.INVALID
        : checkDataQuality({
            data: filteredEntries,
            chartType: ChartType.PRICE,
            duration: variables?.duration ?? HistoryDuration.Day,
          })

    return { chartType: ChartType.PRICE, entries: filteredEntries, loading, dataQuality }
  }, [data, loading, priceInverted, variables?.duration])
}
