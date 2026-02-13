import { BitcoinBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'

/**
 * Sub-steps for Bitcoin Bridge BTC→Citrea to provide granular UI feedback
 */
export enum BtcToCitreaSubStep {
  CheckingAuth = 'checking_auth',
  WaitingForAuth = 'waiting_for_auth',
  Authenticating = 'authenticating',
  ShowingInvoice = 'showing_invoice',
  WaitingForMempool = 'waiting_for_mempool',
  Claiming = 'claiming',
  Complete = 'complete',
}

/**
 * Sub-steps for Bitcoin Bridge Citrea→BTC to provide granular UI feedback
 */
export enum CitreaToBtcSubStep {
  CheckingAuth = 'checking_auth',
  WaitingForAuth = 'waiting_for_auth',
  Authenticating = 'authenticating',
  LockingTokens = 'locking_tokens',
  WaitingForBridge = 'waiting_for_bridge',
  ClaimingBtc = 'claiming_btc',
  Complete = 'complete',
}

export interface BitcoinBridgeCitreaToBitcoinStep {
  type: TransactionStepType.BitcoinBridgeCitreaToBitcoinStep
  backendAccepted?: boolean
  subStep?: CitreaToBtcSubStep
}

export interface BitcoinBridgeBitcoinToCitreaStep {
  type: TransactionStepType.BitcoinBridgeBitcoinToCitreaStep
  bip21?: string
  backendAccepted?: boolean
  subStep?: BtcToCitreaSubStep
}

export type BitcoinBridgeTransactionStep = BitcoinBridgeCitreaToBitcoinStep | BitcoinBridgeBitcoinToCitreaStep

export const createBitcoinBridgeTransactionStep = (direction: BitcoinBridgeDirection): BitcoinBridgeTransactionStep => {
  if (direction === BitcoinBridgeDirection.CitreaToBitcoin) {
    return {
      type: TransactionStepType.BitcoinBridgeCitreaToBitcoinStep,
    }
  }
  return {
    type: TransactionStepType.BitcoinBridgeBitcoinToCitreaStep,
  }
}
