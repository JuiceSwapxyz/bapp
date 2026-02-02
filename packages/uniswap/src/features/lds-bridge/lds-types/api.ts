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

export interface LockupCheckResponse {
  lockups: {
    amount: string
    claimAddress: string
    claimTxHash: string
    claimed: boolean
    preimageHash: string
    preimage: string
    refundAddress: string
    refundTxHash: string
    refunded: boolean
    timelock: number
  } | null
}

export interface HelpMeClaimRequest {
  preimage: string
  preimageHash: string
  chainId: number
}

export interface HelpMeClaimResponse {
  txHash: string
}

export interface CreateSubmarineSwapRequest {
  from: string
  to: string
  invoice: string
  pairHash: string
  referralId: string
  refundPublicKey: string
}

export interface CreateReverseSwapRequest {
  from: string
  to: string
  pairHash: string
  preimageHash: string
  claimAddress: string
  invoiceAmount: number
}

export interface CreateReverseSwapResponse {
  invoice: string
  id: string
  lockupAddress: string
  onchainAmount: number
  refundAddress: string
  timeoutBlockHeight: number
}

export interface ChainPairInfo {
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
      server: number
      user: {
        claim: number
        lockup: number
      }
    }
  }
}

export interface CreateChainSwapRequest {
  from: string
  to: string
  preimageHash: string
  claimPublicKey?: string
  claimAddress: string
  refundPublicKey?: string
  pairHash: string
  referralId: string
  userLockAmount: number
}

export interface CreateChainSwapResponse {
  id: string
  referralId: string
  claimDetails: {
    blindingKey?: string
    serverPublicKey?: string
    refundAddress?: string
    amount: number
    lockupAddress: string
    timeoutBlockHeight: number
    swapTree?: {
      claimLeaf: {
        version: number
        output: string
      }
      refundLeaf: {
        version: number
        output: string
      }
    }
  }
  lockupDetails: {
    blindingKey?: string
    serverPublicKey?: string
    claimAddress?: string
    amount: number
    lockupAddress: string
    timeoutBlockHeight: number
    swapTree?: {
      claimLeaf: {
        version: number
        output: string
      }
      refundLeaf: {
        version: number
        output: string
      }
    }
    bip21?: string
  }
}

export interface ChainTransactionsResponse {
  userLock?: {
    transaction: {
      id: string
      hex: string
    }
    timeout: {
      eta: number
      blockHeight: number
    }
  }
  serverLock?: {
    transaction: {
      hex: string
      id: string
    }
    timeout: {
      eta: number
      blockHeight: number
    }
  }
}

export interface ClaimChainSwapRequest {
  preimage: string
  toSign: {
    index: number
    transaction: string
    pubNonce: string
  }
}

export interface ClaimChainSwapResponse {
  pubNonce: string
  partialSignature: string
}

export type ChainPairsResponse = Record<string, Record<string, ChainPairInfo>>

export interface RegisterPreimageRequest {
  preimageHash: string
  preimage: string
  swapId?: string
}

export interface RegisterPreimageResponse {
  success: boolean
}

export interface EvmLockup {
  preimageHash: string
  chainId: number
  amount: string
  claimAddress: string
  refundAddress: string
  timelock: string
  tokenAddress: string
  swapType: string
  claimed: boolean
  refunded: boolean
  claimTxHash: string | null
  refundTxHash: string | null
}

export interface LockupsResponse {
  data: {
    refundable: {
      items: EvmLockup[]
    }
    claimable: {
      items: EvmLockup[]
    }
  }
}

export interface UserClaimItem {
  preimageHash: string
  claimTxHash: string
}

export interface UserRefundItem {
  preimageHash: string
  refundTxHash: string
}

export interface UserClaimsAndRefundsResponse {
  data: {
    myClaims: {
      items: UserClaimItem[]
    }
    myRefunds: {
      items: UserRefundItem[]
    }
  }
}

export interface UserClaimsAndRefunds {
  claims: UserClaimItem[]
  refunds: UserRefundItem[]
}

