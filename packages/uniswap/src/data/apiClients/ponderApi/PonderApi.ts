import { UseQueryResult, useQuery as useTanstackQuery } from '@tanstack/react-query'
import { createApiClientWithFallback } from 'uniswap/src/data/apiClients/createApiClientWithFallback'
import {
  CampaignProgressResponse,
  DailyGrowthResponse,
  HourlyCompletionStatsResponse,
} from 'uniswap/src/data/apiClients/ponderApi/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const ponderApiUrl = process.env.REACT_APP_PONDER_JUICESWAP_URL || 'https://ponder.juiceswap.com'
const ponderFallbackApiUrl = process.env.REACT_APP_PONDER_FALLBACK_JUICESWAP_URL || 'https://dev.ponder.juiceswap.com'

const ponderApiClient = createApiClientWithFallback(ponderApiUrl, ponderFallbackApiUrl)

export const createPonderApiClient = (): ReturnType<typeof createApiClientWithFallback> => ponderApiClient

export const useDailyGrowthQuery = (
  days: number,
  chainId: UniverseChainId = UniverseChainId.CitreaTestnet,
): UseQueryResult<DailyGrowthResponse, Error> => {
  return useTanstackQuery<DailyGrowthResponse, Error>({
    queryKey: ['dailyGrowth', days, chainId],
    queryFn: () =>
      ponderApiClient.get<DailyGrowthResponse>('/campaign/daily-growth', { params: { days, chainId } }),
  })
}

export const useHourlyCompletionStatsQuery = (
  hours: number,
  chainId: UniverseChainId = UniverseChainId.CitreaTestnet,
): UseQueryResult<HourlyCompletionStatsResponse, Error> => {
  return useTanstackQuery<HourlyCompletionStatsResponse, Error>({
    queryKey: ['hourlyCompletionStats', hours, chainId],
    queryFn: () =>
      ponderApiClient.get<HourlyCompletionStatsResponse>('/campaign/hourly-completion-stats', {
        params: { hours, chainId },
      }),
  })
}

export const useCampaignProgressQuery = (
  walletAddress: string,
  chainId: UniverseChainId = UniverseChainId.CitreaTestnet,
): UseQueryResult<CampaignProgressResponse, Error> => {
  return useTanstackQuery<CampaignProgressResponse, Error>({
    queryKey: ['campaignProgress', walletAddress, chainId],
    queryFn: () =>
      ponderApiClient.get<CampaignProgressResponse>('/campaign/progress', { params: { walletAddress, chainId } }),
    enabled: !!walletAddress,
  })
}
