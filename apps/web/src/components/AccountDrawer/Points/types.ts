export interface PointsBreakdown {
  total: number
  swaps: {
    count: number
    points: number
  }
  liquidity: {
    days: number
    points: number
    currentUsdValue: number
    meetsMinimum: boolean
  }
}

export interface UsePointsResult {
  data?: PointsBreakdown
  isLoading: boolean
  isError: boolean
}
