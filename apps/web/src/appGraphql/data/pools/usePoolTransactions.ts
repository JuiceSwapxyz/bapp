import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import {
  PoolTransactionEntry,
  PoolTransactionsResponse,
  fetchPoolTransactions,
} from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import {
  PoolTransactionType,
  ProtocolVersion,
  Token,
  V2PairTransactionsQuery,
  V4PoolTransactionsQuery,
  useV2PairTransactionsQuery,
  useV4PoolTransactionsQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import i18n from 'uniswap/src/i18n'

export enum PoolTableTransactionType {
  BUY = 'Buy',
  SELL = 'Sell',
  REMOVE = 'Remove',
  ADD = 'Add',
}

export const getPoolTableTransactionTypeTranslation = (type: PoolTableTransactionType): string => {
  switch (type) {
    case PoolTableTransactionType.BUY:
      return i18n.t('common.buy.label')
    case PoolTableTransactionType.SELL:
      return i18n.t('common.sell.label')
    case PoolTableTransactionType.REMOVE:
      return i18n.t('common.remove.label')
    case PoolTableTransactionType.ADD:
      return i18n.t('common.add.label')
    default:
      return ''
  }
}

export interface PoolTableTransaction {
  timestamp: number
  transaction: string
  pool: {
    token0: {
      id: string | null
      symbol: string
    }
    token1: {
      id: string | null
      symbol: string
    }
  }
  maker: string
  amount0: number
  amount1: number
  amountUSD: number
  type: PoolTableTransactionType
}

const PoolTransactionDefaultQuerySize = 25

/**
 * Map a transaction (REST or GraphQL shape) to PoolTableTransaction.
 * Handles both shapes transparently.
 */
function mapTransaction(
  tx: {
    timestamp: number
    hash: string
    account: string
    token0: { address?: string | null; symbol?: string | null }
    token1: { address?: string | null; symbol?: string | null }
    token0Quantity: string
    token1Quantity: string
    usdValue: { value: number }
    type: string
  },
  opts: { token0Address: string | undefined; filter: PoolTableTransactionType[] },
): PoolTableTransaction | undefined {
  const { token0Address, filter } = opts
  const tokenIn = parseFloat(tx.token0Quantity) > 0 ? tx.token0 : tx.token1
  const isSell = tokenIn.address?.toLowerCase() === token0Address?.toLowerCase()
  const type =
    tx.type === PoolTransactionType.Swap || tx.type === 'SWAP'
      ? isSell
        ? PoolTableTransactionType.SELL
        : PoolTableTransactionType.BUY
      : tx.type === PoolTransactionType.Remove
        ? PoolTableTransactionType.REMOVE
        : PoolTableTransactionType.ADD
  if (!filter.includes(type)) {
    return undefined
  }
  return {
    timestamp: tx.timestamp,
    transaction: tx.hash,
    pool: {
      token0: {
        id: tx.token0.address ?? null,
        symbol: tx.token0.symbol ?? '',
      },
      token1: {
        id: tx.token1.address ?? null,
        symbol: tx.token1.symbol ?? '',
      },
    },
    maker: tx.account,
    amount0: parseFloat(tx.token0Quantity),
    amount1: parseFloat(tx.token1Quantity),
    amountUSD: tx.usdValue.value,
    type,
  }
}

export function usePoolTransactions({
  address,
  chainId,
  filter = [
    PoolTableTransactionType.BUY,
    PoolTableTransactionType.SELL,
    PoolTableTransactionType.REMOVE,
    PoolTableTransactionType.ADD,
  ],
  token0,
  protocolVersion = ProtocolVersion.V3,
  first = PoolTransactionDefaultQuerySize,
}: {
  address: string
  chainId?: UniverseChainId
  filter?: PoolTableTransactionType[]
  token0?: Token
  protocolVersion?: ProtocolVersion
  first?: number
}) {
  const { defaultChainId } = useEnabledChains()
  const variables = { first, chain: toGraphQLChain(chainId ?? defaultChainId) }

  // V4 - GraphQL
  const {
    loading: loadingV4,
    error: errorV4,
    data: dataV4,
    fetchMore: fetchMoreV4,
  } = useV4PoolTransactionsQuery({
    variables: { ...variables, poolId: address },
    skip: protocolVersion !== ProtocolVersion.V4,
  })

  // V3 - REST API (managed with useState + useEffect)
  const [v3Transactions, setV3Transactions] = useState<PoolTransactionEntry[]>([])
  const [loadingV3, setLoadingV3] = useState(protocolVersion === ProtocolVersion.V3)
  const [errorV3, setErrorV3] = useState<Error | null>(null)
  const fetchGeneration = useRef(0)

  useEffect(() => {
    if (protocolVersion !== ProtocolVersion.V3 || !address) {
      return
    }
    const currentGeneration = ++fetchGeneration.current
    setV3Transactions([])
    setLoadingV3(true)
    setErrorV3(null)
    fetchPoolTransactions({
      address,
      chainId: chainId ?? defaultChainId,
      first,
    })
      .then((result: PoolTransactionsResponse) => {
        if (currentGeneration !== fetchGeneration.current) {
          return
        }
        setV3Transactions(result.v3Pool.transactions)
        setLoadingV3(false)
      })
      .catch((err: Error) => {
        if (currentGeneration !== fetchGeneration.current) {
          return
        }
        setErrorV3(err)
        setLoadingV3(false)
      })
  }, [address, chainId, defaultChainId, first, protocolVersion])

  // V2 - GraphQL
  const {
    loading: loadingV2,
    error: errorV2,
    data: dataV2,
    fetchMore: fetchMoreV2,
  } = useV2PairTransactionsQuery({
    variables: { ...variables, address },
    skip: !chainId || protocolVersion !== ProtocolVersion.V2,
  })

  const loadingMore = useRef(false)

  const loadMore = useCallback(
    ({ onComplete }: { onComplete?: () => void }) => {
      if (loadingMore.current) {
        return
      }
      loadingMore.current = true

      if (protocolVersion === ProtocolVersion.V3) {
        if (v3Transactions.length > 0) {
          const lastTx = v3Transactions[v3Transactions.length - 1]
          const cursor = lastTx.timestamp.toString()
          const currentGeneration = fetchGeneration.current
          fetchPoolTransactions({
            address,
            chainId: chainId ?? defaultChainId,
            first,
            cursor,
          })
            .then((result: PoolTransactionsResponse) => {
              if (currentGeneration !== fetchGeneration.current) {
                loadingMore.current = false
                return
              }
              if (result.v3Pool.transactions.length > 0) {
                setV3Transactions((prev) => [...prev, ...result.v3Pool.transactions])
              }
              onComplete?.()
              loadingMore.current = false
            })
            .catch((err: Error) => {
              if (currentGeneration !== fetchGeneration.current) {
                loadingMore.current = false
                return
              }
              setErrorV3(err)
              onComplete?.()
              loadingMore.current = false
            })
        } else {
          loadingMore.current = false
        }
        return
      }

      // V4 / V2 - GraphQL pagination
      const fetchMore = protocolVersion === ProtocolVersion.V4 ? fetchMoreV4 : fetchMoreV2
      const txList =
        protocolVersion === ProtocolVersion.V4 ? dataV4?.v4Pool?.transactions : dataV2?.v2Pair?.transactions
      fetchMore({
        variables: {
          cursor: txList?.[txList.length - 1]?.timestamp,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateQuery: (prev: any, { fetchMoreResult }: { fetchMoreResult: any }) => {
          if (!fetchMoreResult) {
            loadingMore.current = false
            return prev
          }
          onComplete?.()
          const mergedData =
            protocolVersion === ProtocolVersion.V4
              ? {
                  v4Pool: {
                    ...(fetchMoreResult as V4PoolTransactionsQuery).v4Pool,
                    transactions: [
                      ...((prev as V4PoolTransactionsQuery).v4Pool?.transactions ?? []),
                      ...((fetchMoreResult as V4PoolTransactionsQuery).v4Pool?.transactions ?? []),
                    ],
                  },
                }
              : {
                  v2Pair: {
                    ...(fetchMoreResult as V2PairTransactionsQuery).v2Pair,
                    transactions: [
                      ...((prev as V2PairTransactionsQuery).v2Pair?.transactions ?? []),
                      ...((fetchMoreResult as V2PairTransactionsQuery).v2Pair?.transactions ?? []),
                    ],
                  },
                }
          loadingMore.current = false
          return mergedData
        },
      })
    },
    [
      fetchMoreV4,
      fetchMoreV2,
      v3Transactions,
      dataV4?.v4Pool?.transactions,
      dataV2?.v2Pair?.transactions,
      protocolVersion,
      address,
      chainId,
      defaultChainId,
      first,
    ],
  )

  const token0Address = useMemo(() => {
    return token0?.address === NATIVE_CHAIN_ID
      ? WRAPPED_NATIVE_CURRENCY[chainId ?? UniverseChainId.Mainnet]?.address
      : token0?.address
  }, [token0?.address, chainId])

  const filteredTransactions = useMemo(() => {
    if (protocolVersion === ProtocolVersion.V3) {
      return v3Transactions
        .map((tx) => mapTransaction(tx, { token0Address, filter }))
        .filter((value): value is PoolTableTransaction => value !== undefined)
    }

    const gqlTransactions =
      protocolVersion === ProtocolVersion.V4 ? dataV4?.v4Pool?.transactions : dataV2?.v2Pair?.transactions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((gqlTransactions ?? []) as any[])
      .map((tx) => {
        if (!tx) {
          return undefined
        }
        return mapTransaction(tx, { token0Address, filter })
      })
      .filter((value): value is PoolTableTransaction => value !== undefined)
  }, [protocolVersion, v3Transactions, dataV4, dataV2, token0Address, filter])

  const loading =
    protocolVersion === ProtocolVersion.V4 ? loadingV4 : protocolVersion === ProtocolVersion.V3 ? loadingV3 : loadingV2
  const error =
    protocolVersion === ProtocolVersion.V4 ? errorV4 : protocolVersion === ProtocolVersion.V3 ? errorV3 : errorV2

  return useMemo(() => {
    return {
      transactions: filteredTransactions,
      loading,
      loadMore,
      error,
    }
  }, [filteredTransactions, loading, loadMore, error])
}
