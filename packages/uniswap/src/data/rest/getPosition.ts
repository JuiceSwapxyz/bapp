import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { UseQueryResult, keepPreviousData, useQuery as useTanstackQuery } from '@tanstack/react-query'
import { GetPositionRequest, GetPositionResponse } from '@uniswap/client-pools/dist/pools/v1/api_pb'
import { PoolPosition } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'

const juiceSwapApiClient = createApiClient({
  baseUrl: process.env.REACT_APP_JUICESWAP_API_URL as string,
})

async function fetchPositionFromCustomServer(input?: PartialMessage<GetPositionRequest>): Promise<GetPositionResponse> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await juiceSwapApiClient.get<any>(`/v1/positions/${input?.tokenId}?chainId=${input?.chainId}`)

  const transformedData = {
    position: data.position
      ? {
          position: {
            case: 'v3Position' as const,
            value: new PoolPosition(data.position.v3Position),
          },
          status: data.position.status || 0,
        }
      : undefined,
  }

  return transformedData as GetPositionResponse
}

export function useGetPositionQuery(
  input?: PartialMessage<GetPositionRequest>,
): UseQueryResult<GetPositionResponse, ConnectError> {
  return useTanstackQuery({
    queryKey: ['position', input],
    queryFn: () => fetchPositionFromCustomServer(input),
    enabled: !!input,
    placeholderData: keepPreviousData,
  })
}
