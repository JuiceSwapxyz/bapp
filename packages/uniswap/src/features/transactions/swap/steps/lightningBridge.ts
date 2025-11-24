import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'

export interface LightningBridgeLockTransactionStep {
  type: TransactionStepType.LightningBridgeLockTransactionStep
}

export const createLightningBridgeLockTransactionStep = (): LightningBridgeLockTransactionStep => {
  // Here we can collect stuff for my saga to run
  return {
    type: TransactionStepType.LightningBridgeLockTransactionStep,
  }
}
