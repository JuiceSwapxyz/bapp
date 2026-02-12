import { SingleHistogramData } from 'components/Charts/VolumeChart/renderer'
import { ChartType } from 'components/Charts/utils'
import { ChartQueryResult, checkDataQuality, withUTCTimestamp } from 'components/Tokens/TokenDetails/ChartSection/util'
import { PDPChartQueryVars, historyDurationToString } from 'hooks/usePoolPriceChartData'
import { useMemo } from 'react'
import { PoolVolumeHistoryEntry } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { usePoolVolumeHistory } from 'uniswap/src/data/apiClients/tradingApi/usePoolVolumeHistory'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'

export function usePDPVolumeChartData({
  variables,
}: {
  variables: PDPChartQueryVars
}): ChartQueryResult<SingleHistogramData, ChartType.VOLUME> {
  const { defaultChainId } = useEnabledChains()
  const chainId = fromGraphQLChain(variables.chain) ?? defaultChainId

  const { data, isLoading: loading } = usePoolVolumeHistory({
    address: variables.addressOrId,
    chainId,
    duration: historyDurationToString(variables.duration),
  })

  return useMemo(() => {
    const entries =
      data
        ?.filter((entry: PoolVolumeHistoryEntry) => entry.value > 0)
        .map((entry: PoolVolumeHistoryEntry) => withUTCTimestamp({ value: entry.value, timestamp: entry.timestamp })) ??
      []

    const dataQuality = checkDataQuality({ data: entries, chartType: ChartType.VOLUME, duration: variables.duration })

    return { chartType: ChartType.VOLUME, entries, loading, dataQuality }
  }, [data, loading, variables.duration])
}
