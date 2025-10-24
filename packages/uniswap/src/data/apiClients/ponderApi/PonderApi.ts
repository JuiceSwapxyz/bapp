import { UseQueryResult, useQuery as useTanstackQuery } from '@tanstack/react-query'
import { createApiClientWithFallback } from 'uniswap/src/data/apiClients/createApiClientWithFallback'
import {
  CampaignProgressResponse,
  DailyGrowthResponse,
  HourlyCompletionStatsResponse,
} from 'uniswap/src/data/apiClients/ponderApi/types'

const ponderApiUrl = process.env.REACT_APP_PONDER_JUICESWAP_URL || 'https://ponder.juiceswap.com'
const ponderFallbackApiUrl = process.env.REACT_APP_PONDER_FALLBACK_JUICESWAP_URL || 'https://dev.ponder.juiceswap.com'

const ponderApiClient = createApiClientWithFallback(ponderApiUrl, ponderFallbackApiUrl)

export const createPonderApiClient = (): ReturnType<typeof createApiClientWithFallback> => ponderApiClient

export const useDailyGrowthQuery = (days: number): UseQueryResult<DailyGrowthResponse, Error> => {
  return useTanstackQuery<DailyGrowthResponse, Error>({
    queryKey: ['dailyGrowth', days],
    queryFn: () =>
      ponderApiClient.get<DailyGrowthResponse>('/campaign/daily-growth', { params: { days, chainId: 5115 } }),
  })
}

export const useHourlyCompletionStatsQuery = (hours: number): UseQueryResult<HourlyCompletionStatsResponse, Error> => {
  return useTanstackQuery<HourlyCompletionStatsResponse, Error>({
    queryKey: ['hourlyCompletionStats', hours],
    queryFn: () =>
      ponderApiClient.get<HourlyCompletionStatsResponse>('/campaign/hourly-completion-stats', {
        params: { hours, chainId: 5115 },
      }),
  })
}

export const useCampaignProgressQuery = (walletAddress: string): UseQueryResult<CampaignProgressResponse, Error> => {
  return useTanstackQuery<CampaignProgressResponse, Error>({
    queryKey: ['campaignProgress', walletAddress],
    queryFn: () =>
      ponderApiClient.get<CampaignProgressResponse>('/campaign/progress', { params: { walletAddress, chainId: 5115 } }),
    enabled: !!walletAddress,
  })
}
