import { PoolStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { PoolOption } from 'uniswap/src/components/lists/items/types'

// Hardcoded pools have been removed - pools come from API/Ponder only

export function getHardcodedCitreaPoolsOptions(): PoolOption[] {
  return []
}

export function getHardcodedCitreaPoolsSearchData(): PoolStats[] {
  return []
}
