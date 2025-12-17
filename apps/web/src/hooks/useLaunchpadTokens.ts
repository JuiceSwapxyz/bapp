/**
 * Hook for fetching launchpad tokens from API (which proxies to Ponder)
 */
import { useQuery } from '@tanstack/react-query'

// API URL with failover - API proxies to Ponder with automatic retry/failover
const API_URL =
  process.env.REACT_APP_TRADING_API_URL_OVERRIDE ||
  process.env.REACT_APP_UNISWAP_GATEWAY_DNS ||
  'https://api.juiceswap.com'

export type LaunchpadFilterType = 'all' | 'active' | 'graduating' | 'graduated'

export interface LaunchpadToken {
  id: string
  address: `0x${string}`
  chainId: number
  name: string
  symbol: string
  creator: `0x${string}`
  baseAsset: `0x${string}`
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

/**
 * Fetch launchpad tokens with filtering and pagination
 */
export function useLaunchpadTokens(
  filter: LaunchpadFilterType = 'all',
  page: number = 0,
  limit: number = 20,
  sort: 'newest' | 'volume' | 'trades' = 'newest'
) {
  return useQuery({
    queryKey: ['launchpad-tokens', filter, page, limit, sort],
    queryFn: async (): Promise<LaunchpadTokensResponse> => {
      const params = new URLSearchParams({
        filter,
        page: page.toString(),
        limit: limit.toString(),
        sort,
      })
      const response = await fetch(`${API_URL}/v1/launchpad/tokens?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch launchpad tokens')
      }
      return response.json()
    },
    staleTime: 10_000, // 10 seconds
    refetchInterval: 30_000, // 30 seconds
  })
}

/**
 * Fetch a single launchpad token by address
 */
export function useLaunchpadToken(address: string | undefined) {
  return useQuery({
    queryKey: ['launchpad-token', address],
    queryFn: async (): Promise<{ token: LaunchpadToken }> => {
      const response = await fetch(`${API_URL}/v1/launchpad/token/${address}`)
      if (!response.ok) {
        throw new Error('Token not found')
      }
      return response.json()
    },
    enabled: !!address,
    staleTime: 10_000,
    refetchInterval: 30_000,
  })
}

/**
 * Fetch launchpad stats
 */
export function useLaunchpadStats() {
  return useQuery({
    queryKey: ['launchpad-stats'],
    queryFn: async (): Promise<LaunchpadStatsResponse> => {
      const response = await fetch(`${API_URL}/v1/launchpad/stats`)
      if (!response.ok) {
        throw new Error('Failed to fetch launchpad stats')
      }
      return response.json()
    },
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // 1 minute
  })
}

/**
 * Fetch trades for a specific token with pagination
 */
export function useLaunchpadTrades(address: string | undefined, page: number = 0, limit: number = 50) {
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

/**
 * Fetch recent trades across all tokens
 */
export function useRecentLaunchpadTrades(limit: number = 20) {
  return useQuery({
    queryKey: ['launchpad-recent-trades', limit],
    queryFn: async (): Promise<{ trades: LaunchpadTrade[] }> => {
      const response = await fetch(`${API_URL}/v1/launchpad/recent-trades?limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch recent trades')
      }
      return response.json()
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  })
}
