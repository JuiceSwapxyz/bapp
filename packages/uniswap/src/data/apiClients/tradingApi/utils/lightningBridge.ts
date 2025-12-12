interface LightningBridgePairInfo {
  hash: string
  rate: number
  limits: {
    maximal: number
    minimal: number
    maximalZeroConf: number
  }
  fees: {
    percentage: number
    minerFees: number
  }
}

export interface LightningBridgeSubmarineGetResponse {
  [fromToken: string]: {
    [toToken: string]: LightningBridgePairInfo
  }
}

export interface LightningBridgeSubmarineLockResponse {
  acceptZeroConf: boolean
  expectedAmount: number
  id: string
  address: string
  referralId: string
  claimAddress: string
  timeoutBlockHeight: number
}

interface LightningBridgeReversePairInfo {
  hash: string
  rate: number
  limits: {
    maximal: number
    minimal: number
    maximalZeroConf: number
  }
  fees: {
    percentage: number
    minerFees: {
      claim: number
      lockup: number
    }
  }
}

export interface LightningBridgeReverseGetResponse {
  [fromToken: string]: {
    [toToken: string]: LightningBridgeReversePairInfo
  }
}
