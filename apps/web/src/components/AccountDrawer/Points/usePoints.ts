import { useQuery } from '@tanstack/react-query'
import { fetchPointsForAddress } from 'components/AccountDrawer/Points/api'
import { UsePointsResult } from 'components/AccountDrawer/Points/types'

const QUERY_KEY = 'juicePoints'
const REFETCH_INTERVAL_MS = 30_000

export function usePoints(address?: string): UsePointsResult {
  const query = useQuery({
    queryKey: [QUERY_KEY, address?.toLowerCase()],
    queryFn: () => fetchPointsForAddress(address as string),
    enabled: !!address,
    refetchInterval: REFETCH_INTERVAL_MS,
    staleTime: REFETCH_INTERVAL_MS / 2,
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
