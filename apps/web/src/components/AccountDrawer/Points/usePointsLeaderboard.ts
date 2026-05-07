import { useQuery } from '@tanstack/react-query'
import { fetchLeaderboard } from 'components/AccountDrawer/Points/api'

const QUERY_KEY = 'juicePointsLeaderboard'
const REFETCH_INTERVAL_MS = 30_000

export const LEADERBOARD_MAX_ENTRIES = 100
export const LEADERBOARD_PAGE_SIZE = 35

export interface LeaderboardEntry {
  rank: number
  address: string
  points: number
}

export interface LeaderboardData {
  entries: LeaderboardEntry[]
  total: number
  updatedAt: number
}

export function usePointsLeaderboard() {
  const query = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchLeaderboard,
    refetchInterval: REFETCH_INTERVAL_MS,
    staleTime: REFETCH_INTERVAL_MS / 2,
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
