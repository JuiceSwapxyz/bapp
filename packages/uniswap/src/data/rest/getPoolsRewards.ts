import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import { UseQueryResult } from '@tanstack/react-query'
import { getRewards } from '@uniswap/client-pools/dist/pools/v1/api-PoolsService_connectquery'
import { GetRewardsRequest, GetRewardsResponse } from '@uniswap/client-pools/dist/pools/v1/api_pb'
import { uniswapGetTransport } from 'uniswap/src/data/rest/base'

/**
 * JuiceSwap: Pool Rewards API is disabled
 * The Uniswap REST BE service GetRewards endpoint is not available on JuiceSwap backend.
 * This hook returns empty data to disable the rewards feature.
 */
export function useGetPoolsRewards(
  input?: PartialMessage<GetRewardsRequest>,
  _enabled = true,
): UseQueryResult<GetRewardsResponse, ConnectError> {
  // Disabled: JuiceSwap does not have a pool rewards endpoint
  return useQuery(getRewards, input, { transport: uniswapGetTransport, enabled: false })
}
