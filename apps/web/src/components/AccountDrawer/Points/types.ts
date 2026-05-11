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
  /**
   * One-time stacking bonuses tracked by the indexer. Optional because older
   * /points API versions don't return this block; treat the absence as "all
   * false / 0 JP".
   */
  bonuses?: {
    memeTokenCreated: boolean
    memeTokenPoints: number
    memeTokenGraduated: boolean
    memeTokenGraduatedPoints: number
    points: number
  }
}

export interface UsePointsResult {
  data?: PointsBreakdown
  isLoading: boolean
  isError: boolean
}
