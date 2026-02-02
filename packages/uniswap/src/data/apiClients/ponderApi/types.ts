export interface DailyGrowthData {
  date: string
  newUsers: number
  cumulative: number
  uniqueActiveUsers: number
}

export interface DailyGrowthResponse {
  chainId: number
  period: string
  data: DailyGrowthData[]
  summary: {
    totalDays: number
    totalNewUsers: number
    averageDaily: number
  }
}

export interface HourlyCompletionData {
  hour: string
  totalParticipants: number
  completedAllTasks: number
  completionRate: number
}

export interface HourlyCompletionStatsResponse {
  chainId: number
  period: string
  data: HourlyCompletionData[]
  summary: {
    totalHours: number
    currentParticipants: number
    currentCompleted: number
    currentCompletionRate: number
  }
}

interface CampaignTask {
  id: number
  name: string
  description: string
  completed: boolean
  completedAt?: string
  txHash?: string
}

export interface CampaignProgressResponse {
  walletAddress: string
  chainId: number
  tasks: CampaignTask[]
  totalTasks: number
  completedTasks: number
  progress: number
  nftClaimed: boolean
  claimTxHash?: string
}

// ============================================================================
// Activity API Types
// ============================================================================

export interface PonderSwapData {
  id: string
  txHash: string
  chainId: number
  blockNumber: string
  blockTimestamp: string
  swapperAddress: string
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
  // Token metadata from joined tables
  tokenInSymbol: string | null
  tokenInDecimals: number | null
  tokenInName: string | null
  tokenOutSymbol: string | null
  tokenOutDecimals: number | null
  tokenOutName: string | null
}

export interface PonderLaunchpadTradeData {
  id: string
  txHash: string
  chainId: number
  blockNumber: string
  timestamp: string
  trader: string
  tokenAddress: string
  isBuy: boolean
  baseAmount: string
  tokenAmount: string
  // Token metadata from joined table
  tokenSymbol: string | null
  tokenName: string | null
}

export interface PonderActivityResponse {
  swaps: PonderSwapData[]
  launchpadTrades: PonderLaunchpadTradeData[]
  pagination: {
    limit: number
    offset: number
    swapCount: number
    tradeCount: number
  }
}
