/**
 * Hook for fetching launchpad tokens from API (which proxies to Ponder)
 */
import { useQuery } from '@tanstack/react-query'
import { ipfsToHttp, useTokenMetadata } from 'hooks/useTokenMetadata'

// API URL with failover - API proxies to Ponder with automatic retry/failover
const API_URL =
  process.env.REACT_APP_TRADING_API_URL_OVERRIDE ||
  process.env.REACT_APP_UNISWAP_GATEWAY_DNS ||
  'https://api.juiceswap.com'

export type LaunchpadFilterType = 'all' | 'active' | 'graduating' | 'graduated'
export type LaunchpadSortType = 'newest' | 'volume' | 'trades'

export interface LaunchpadToken {
  id: string
  address: `0x${string}`
  factory: `0x${string}`
  chainId: number
  name: string
  symbol: string
  creator: `0x${string}`
  baseAsset: `0x${string}`
  metadataURI: string | null // IPFS/Arweave/HTTPS URI to token metadata JSON - nullable for pre-v2.1.0 tokens
  createdAt: string // bigint as string
  createdAtBlock: string
  txHash: `0x${string}`
  graduated: boolean
  canGraduate: boolean
  v2Pair: `0x${string}` | null
  graduatedAt: string | null
  totalBuys: number
  totalSells: number
  totalVolumeBase: string // bigint as string
  lastTradeAt: string | null
  progress: number // Bonding curve progress in basis points (0-10000)
  devBuyEnabled: boolean
  devBuyBaseAmount: string | null
  devBuyTokenAmount: string | null
  devBuyTxHash: `0x${string}` | null
  devBuyAtBlock: string | null
}

export interface LaunchpadTokensResponse {
  tokens: LaunchpadToken[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface LaunchpadStatsResponse {
  totalTokens: number
  graduatedTokens: number
  activeTokens: number
  graduatingTokens: number
  totalTrades: number
  totalVolumeBase: string
}

export interface LaunchpadTrade {
  id: string
  tokenAddress: `0x${string}`
  trader: `0x${string}`
  isBuy: boolean
  isDevBuy: boolean
  baseAmount: string
  tokenAmount: string
  timestamp: string
  txHash: `0x${string}`
  tokenName?: string
  tokenSymbol?: string
}

export interface LaunchpadTradesResponse {
  trades: LaunchpadTrade[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type LaunchpadCandleInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

export interface LaunchpadCandle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volumeBase: number
  volumeToken: number
  tradeCount: number
}

export interface LaunchpadUserTradeMarker {
  time: number
  side: 'buy' | 'sell'
  price: number
  baseAmount: number
  tokenAmount: number
  txHash: `0x${string}`
  blockNumber: number
}

export interface LaunchpadCandlesResponse {
  range: {
    from: number
    to: number
    interval: LaunchpadCandleInterval
    intervalSeconds: number
    limit: number
  }
  source: 'bonding_curve' | 'bonding_curve_pre_graduation'
  priceBasis: 'execution_price'
  currency: 'base'
  candles: LaunchpadCandle[]
  latest: { price: number; timestamp: number } | null
  userTrades?: LaunchpadUserTradeMarker[]
}

export interface UseLaunchpadTokensOptions {
  filter?: LaunchpadFilterType
  page?: number
  limit?: number
  sort?: 'newest' | 'volume' | 'trades'
  /** Chain ID to filter tokens by. Required to show only tokens for the current network. */
  chainId?: number
}

/**
 * Fetch launchpad tokens with filtering and pagination
 * @param options - Fetch options including chainId for network filtering
 */
export function useLaunchpadTokens(options: UseLaunchpadTokensOptions = {}) {
  const { filter = 'all', page = 0, limit = 20, sort = 'newest', chainId } = options
  return useQuery({
    queryKey: ['launchpad-tokens', filter, page, limit, sort, chainId],
    queryFn: async (): Promise<LaunchpadTokensResponse> => {
      const params = new URLSearchParams({
        filter,
        page: page.toString(),
        limit: limit.toString(),
        sort,
      })
      // Send chainId to API if provided (for future backend filtering support)
      if (chainId) {
        params.set('chainId', chainId.toString())
      }
      const response = await fetch(`${API_URL}/v1/launchpad/tokens?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch launchpad tokens')
      }
      const data: LaunchpadTokensResponse = await response.json()

      // Backend handles chainId filtering correctly
      return data
    },
    staleTime: 10_000, // 10 seconds
    refetchInterval: 30_000, // 30 seconds
  })
}

/**
 * Fetch a single launchpad token by address
 * @param address - Token address
 * @param chainId - Optional chain ID to verify token is on the expected network
 */
export function useLaunchpadToken(address: string | undefined, chainId?: number) {
  return useQuery({
    queryKey: ['launchpad-token', address, chainId],
    queryFn: async (): Promise<{ token: LaunchpadToken } | null> => {
      const response = await fetch(`${API_URL}/v1/launchpad/token/${address}`)
      if (response.status === 404) {
        return null // Not a launchpad token
      }
      if (!response.ok) {
        throw new Error('Failed to fetch launchpad token')
      }
      const data: { token: LaunchpadToken } = await response.json()
      // Verify token is on the expected chain (prevents showing testnet token on mainnet)
      if (chainId && data.token.chainId !== chainId) {
        return null
      }
      return data
    },
    enabled: !!address,
    staleTime: 10_000,
    retry: false,
    refetchInterval: (query) => (query.state.data ? 30_000 : false),
  })
}

export function useLaunchpadTokenLogoUrl(address: string | undefined, chainId?: number): string | undefined {
  const { data: launchpadData } = useLaunchpadToken(address, chainId)
  const metadataURI = launchpadData?.token.metadataURI ?? null
  const { data: metadata } = useTokenMetadata(metadataURI)

  if (metadata?.image) {
    return ipfsToHttp(metadata.image)
  }
  return undefined
}

/**
 * Fetch launchpad stats
 * @param chainId - Optional chain ID to filter stats by network
 */
export function useLaunchpadStats(chainId?: number) {
  return useQuery({
    queryKey: ['launchpad-stats', chainId],
    queryFn: async (): Promise<LaunchpadStatsResponse> => {
      const params = new URLSearchParams()
      if (chainId) {
        params.set('chainId', chainId.toString())
      }
      const queryString = params.toString()
      const url = queryString ? `${API_URL}/v1/launchpad/stats?${queryString}` : `${API_URL}/v1/launchpad/stats`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch launchpad stats')
      }
      return response.json()
    },
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // 1 minute
  })
}

export interface UseLaunchpadTradesOptions {
  address: string | undefined
  page?: number
  limit?: number
}

/**
 * Fetch trades for a specific token with pagination
 */
export function useLaunchpadTrades(options: UseLaunchpadTradesOptions) {
  const { address, page = 0, limit = 50 } = options
  return useQuery({
    queryKey: ['launchpad-trades', address, page, limit],
    queryFn: async (): Promise<LaunchpadTradesResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      const response = await fetch(`${API_URL}/v1/launchpad/token/${address}/trades?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch trades')
      }
      return response.json()
    },
    enabled: !!address,
    staleTime: 10_000,
    refetchInterval: 15_000, // 15 seconds
  })
}

export function useLaunchpadCandles({
  address,
  chainId,
  interval = '5m',
  trader,
}: {
  address: string | undefined
  chainId?: number
  interval?: LaunchpadCandleInterval
  trader?: string
}) {
  return useQuery({
    queryKey: ['launchpad-candles', address, chainId, interval, trader],
    queryFn: async (): Promise<LaunchpadCandlesResponse> => {
      const params = new URLSearchParams({
        interval,
        limit: '240',
        fill: 'last',
        currency: 'base',
      })
      if (chainId) {
        params.set('chainId', chainId.toString())
      }
      if (trader) {
        params.set('trader', trader)
      }

      const response = await fetch(`${API_URL}/v1/launchpad/token/${address}/candles?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch launchpad candles')
      }
      return response.json()
    },
    enabled: !!address,
    staleTime: 10_000,
    refetchInterval: 10_000,
  })
}

export interface UseRecentLaunchpadTradesOptions {
  limit?: number
  /** Chain ID to filter trades by. Required to show only trades for the current network. */
  chainId?: number
}

/**
 * Fetch recent trades across all tokens
 * @param options - Options including limit and chainId for network filtering
 */
export function useRecentLaunchpadTrades(options: UseRecentLaunchpadTradesOptions = {}) {
  const { limit = 20, chainId } = options
  return useQuery({
    queryKey: ['launchpad-recent-trades', limit, chainId],
    queryFn: async (): Promise<{ trades: LaunchpadTrade[] }> => {
      const params = new URLSearchParams({
        limit: limit.toString(),
      })
      if (chainId) {
        params.set('chainId', chainId.toString())
      }
      const response = await fetch(`${API_URL}/v1/launchpad/recent-trades?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch recent trades')
      }
      const data: { trades: LaunchpadTrade[] } = await response.json()
      // Backend handles chainId filtering via the joined token's chainId
      return data
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  })
}
