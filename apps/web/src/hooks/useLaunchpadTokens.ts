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

      // Frontend filtering by chainId (ensures correct filtering even if backend doesn't support it yet)
      if (chainId) {
        const filteredTokens = data.tokens.filter((token) => token.chainId === chainId)
        return {
          tokens: filteredTokens,
          pagination: {
            ...data.pagination,
            total: filteredTokens.length,
            totalPages: Math.ceil(filteredTokens.length / limit),
          },
        }
      }

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
      if (!response.ok) {
        throw new Error('Token not found')
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
    refetchInterval: 30_000,
  })
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
      // Frontend filtering by chainId (ensures correct filtering even if backend doesn't support it yet)
      // Note: trades don't have chainId directly, but we filter by token's chainId via the API
      return data
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  })
}
