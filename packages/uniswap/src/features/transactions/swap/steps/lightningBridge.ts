import { LightningBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'

export interface LightningBridgeSubmarineStep {
  type: TransactionStepType.LightningBridgeSubmarineStep
  backendAccepted?: boolean
}

export interface LightningBridgeReverseStep {
  type: TransactionStepType.LightningBridgeReverseStep
  invoice?: string
  backendAccepted?: boolean
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
