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
   * Stacking bonuses tracked by the indexer. Optional because older /points
   * API versions don't return this block; treat the absence as zeros.
   * One-time fields (`memeToken*`) are credited the moment the indexer
   * observes the event; daily fields accrue per UTC day.
   */
  bonuses?: {
    memeTokenCreated: boolean
    memeTokenPoints: number
    memeTokenGraduated: boolean
    memeTokenGraduatedPoints: number

    /** JUSD parked in the Savings Vault — 1 JP per JUSD per UTC day. */
    savings?: {
      jusdSaved: number
      points: number
    }
    /** JUICE held in wallet — 1 JP per 10 JUICE per UTC day. */
    juiceHold?: {
      juiceHeld: number
      points: number
    }
    /** USD value minted against collateral on the Minting Hub — 5 JP per $1 per UTC day. */
    lending?: {
      usdLent: number
      points: number
    }

    /** Sum of all bonus categories. */
    points: number
  }
}

export interface UsePointsResult {
  data?: PointsBreakdown
  isLoading: boolean
  isError: boolean
}
