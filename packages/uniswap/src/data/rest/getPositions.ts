import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { createQueryOptions } from '@connectrpc/connect-query'
import { Pair } from '@juiceswapxyz/v2-sdk'
import {
  InfiniteData,
  UseInfiniteQueryResult,
  UseQueryResult,
  keepPreviousData,
  useQueries,
  useInfiniteQuery as useTanstackInfiniteQuery,
  useQuery as useTanstackQuery,
} from '@tanstack/react-query'
import { getPosition } from '@uniswap/client-pools/dist/pools/v1/api-PoolsService_connectquery'
import {
  GetPositionResponse,
  ListPositionsRequest,
  ListPositionsResponse,
} from '@uniswap/client-pools/dist/pools/v1/api_pb'
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { useMemo } from 'react'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import { uniswapPostTransport } from 'uniswap/src/data/rest/base'
import { SerializedToken } from 'uniswap/src/features/tokens/slice/types'
import { deserializeToken } from 'uniswap/src/utils/currency'

const ponderApiClient = createApiClient({
  baseUrl: process.env.REACT_APP_PONDER_JUICESWAP_URL || 'https://ponder.juiceswap.com',
})

async function fetchPositionsFromCustomServer(
  input?: PartialMessage<ListPositionsRequest>,
): Promise<ListPositionsResponse> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await ponderApiClient.post<any>(`/positions/owner`, {
    body: JSON.stringify(input),
  })

  const transformedData = {
    positions: data.positions
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.positions.map((position: any) => {
          return {
            position: {
              case: 'v3Position' as const,
              value: position.v3Position,
            },
            status: position.status || 0,
          }
        })
      : [],
    nextPageToken: data.nextPageToken || '',
  }

  return transformedData as ListPositionsResponse
}

async function fetchPositionsInfiniteFromCustomServer({
  ...input
}: PartialMessage<ListPositionsRequest> & { pageToken?: string }): Promise<ListPositionsResponse> {
  const requestBody = {
    ...input,
    pageToken: input.pageToken || undefined,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await ponderApiClient.post<any>(`/positions/owner`, {
    body: JSON.stringify(requestBody),
  })

  const transformedData = {
    positions: data.positions
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.positions.map((position: any) => {
          return {
            position: {
              case: 'v3Position' as const,
              value: position.v3Position,
            },
            status: position.status || 0,
          }
        })
      : [],
    nextPageToken: data.nextPageToken || '',
  }

  return transformedData as ListPositionsResponse
}

export function useGetPositionsQuery(
  input?: PartialMessage<ListPositionsRequest>,
  disabled?: boolean,
): UseQueryResult<ListPositionsResponse, ConnectError> {
  return useTanstackQuery({
    queryKey: ['positions', input],
    queryFn: () => fetchPositionsFromCustomServer(input),
    enabled: !!input && !disabled,
    placeholderData: keepPreviousData,
  })
}

export function useGetPositionsInfiniteQuery(
  input: PartialMessage<ListPositionsRequest> & { pageToken: string },
  disabled?: boolean,
): UseInfiniteQueryResult<InfiniteData<ListPositionsResponse>, ConnectError> {
  return useTanstackInfiniteQuery({
    queryKey: ['positions-infinite', input],
    queryFn: ({ pageParam }) => fetchPositionsInfiniteFromCustomServer({ ...input, pageToken: pageParam }),
    enabled: !disabled,
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    placeholderData: keepPreviousData,
  })
}

export function useGetPositionsForPairs(
  serializedPairs: {
    [chainId: number]: {
      [key: string]: { token0: SerializedToken; token1: SerializedToken }
    }
  },
  account?: Address,
): UseQueryResult<GetPositionResponse, ConnectError>[] {
  const positionsQueryOptions = useMemo(() => {
    return Object.keys(serializedPairs)
      .flatMap((chainId) => {
        const pairsForChain = serializedPairs[Number(chainId)]
        if (!pairsForChain) {
          return []
        }
        return Object.keys(pairsForChain).map((pairId) => {
          const pair = pairsForChain[pairId]
          if (!pair) {
            return undefined
          }
          const [token0, token1] = [deserializeToken(pair.token0), deserializeToken(pair.token1)]
          const pairAddress = Pair.getAddress(token0, token1)
          return createQueryOptions(
            getPosition,
            account
              ? {
                  chainId: Number(chainId),
                  protocolVersion: ProtocolVersion.V2,
                  pairAddress,
                  owner: account,
                }
              : undefined,
            { transport: uniswapPostTransport },
          )
        })
      })
      .filter(isDefined)
  }, [serializedPairs, account])

  return useQueries({
    queries: positionsQueryOptions,
  })
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined
}
