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
