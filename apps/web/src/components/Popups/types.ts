import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FORTransaction } from 'uniswap/src/features/fiatOnRamp/types'
import { CurrencyId } from 'uniswap/src/types/currency'

export enum PopupType {
  Transaction = 'transaction',
  Order = 'order',
  FailedSwitchNetwork = 'failedSwitchNetwork',
  SwitchNetwork = 'switchNetwork',
  Bridge = 'bridge',
  Mismatch = 'mismatch',
  FORTransaction = 'forTransaction',
  CampaignTaskCompleted = 'campaignTaskCompleted',
  LightningBridge = 'lightningBridge',
  BitcoinBridge = 'bitcoinBridge',
  Erc20ChainSwap = 'erc20ChainSwap',
  RefundableSwaps = 'refundableSwaps',
  RefundsInProgress = 'refundsInProgress',
  RefundsCompleted = 'refundsCompleted',
  ClaimInProgress = 'claimInProgress',
  ClaimCompleted = 'claimCompleted',
}

export enum SwitchNetworkAction {
  Swap = 'swap',
  Send = 'send',
  Buy = 'buy',
  Sell = 'sell',
  Limit = 'limit',
  LP = 'lp',
  PoolFinder = 'poolFinder',
}

export enum LightningBridgeDirection {
  Submarine = 'submarine',
  Reverse = 'reverse',
}

export enum BitcoinBridgeDirection {
  BitcoinToCitrea = 'bitcoin-to-citrea',
  CitreaToBitcoin = 'citrea-to-bitcoin',
}

export enum LdsBridgeStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Failed = 'failed',
}

export type PopupContent =
  | {
      type: PopupType.Transaction
      hash: string
    }
  | {
      type: PopupType.Order
      orderHash: string
    }
  | {
      type: PopupType.FailedSwitchNetwork
      failedSwitchNetwork: UniverseChainId
    }
  | {
      type: PopupType.SwitchNetwork
      chainId: UniverseChainId
      action: SwitchNetworkAction
    }
  | {
      type: PopupType.Bridge
      inputChainId: UniverseChainId
      outputChainId: UniverseChainId
    }
  | {
      type: PopupType.Mismatch
    }
  | {
      type: PopupType.FORTransaction
      transaction: FORTransaction
      currencyId: CurrencyId
    }
  | {
      type: PopupType.CampaignTaskCompleted
      taskName: string
      progress: number
    }
  | {
      type: PopupType.LightningBridge
      id: string
      direction: LightningBridgeDirection
      status: LdsBridgeStatus
    }
  | {
      type: PopupType.BitcoinBridge
      id: string
      status: LdsBridgeStatus
      direction: BitcoinBridgeDirection
    }
  | {
      type: PopupType.Erc20ChainSwap
      id: string
      status: LdsBridgeStatus
      fromChainId: UniverseChainId
      toChainId: UniverseChainId
      fromAsset: string
      toAsset: string
      url?: string
    }
  | {
      type: PopupType.RefundableSwaps
      count: number
    }
  | {
      type: PopupType.RefundsInProgress
      count: number
    }
  | {
      type: PopupType.RefundsCompleted
      count: number
    }
  | {
      type: PopupType.ClaimInProgress
      count: number
    }
  | {
      type: PopupType.ClaimCompleted
      count: number
    }
