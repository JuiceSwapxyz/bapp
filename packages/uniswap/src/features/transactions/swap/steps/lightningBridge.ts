import { LightningBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'

/**
 * Sub-steps for Lightning Bridge Reverse (LN→Citrea) to provide granular UI feedback
 */
export enum LnReverseSubStep {
  CheckingAuth = 'checking_auth',
  WaitingForAuth = 'waiting_for_auth',
  Authenticating = 'authenticating',
  ShowingInvoice = 'showing_invoice',
  Claiming = 'claiming',
  Complete = 'complete',
}

/**
 * Sub-steps for Lightning Bridge Submarine (Citrea→LN) to provide granular UI feedback
 */
export enum LnSubmarineSubStep {
  CheckingAuth = 'checking_auth',
  WaitingForAuth = 'waiting_for_auth',
  Authenticating = 'authenticating',
  LockingTokens = 'locking_tokens',
  WaitingForBridge = 'waiting_for_bridge',
  Complete = 'complete',
}

export interface LightningBridgeSubmarineStep {
  type: TransactionStepType.LightningBridgeSubmarineStep
  backendAccepted?: boolean
  subStep?: LnSubmarineSubStep
}

export interface LightningBridgeReverseStep {
  type: TransactionStepType.LightningBridgeReverseStep
  invoice?: string
  backendAccepted?: boolean
  subStep?: LnReverseSubStep
}

export type LightningBridgeTransactionStep = LightningBridgeSubmarineStep | LightningBridgeReverseStep

export const createLightningBridgeTransactionStep = (
  direction: LightningBridgeDirection,
): LightningBridgeTransactionStep => {
  if (direction === LightningBridgeDirection.Submarine) {
    return {
      type: TransactionStepType.LightningBridgeSubmarineStep,
    }
  }
  return {
    type: TransactionStepType.LightningBridgeReverseStep,
  }
}
