import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'

export interface LightningBridgeTransactionStep {
  type: TransactionStepType.LightningBridgeTransactionStep
  invoice?: string
}

export const createLightningBridgeTransactionStep = (): LightningBridgeTransactionStep => {
  // Here we can collect stuff for my saga to run
  return {
    type: TransactionStepType.LightningBridgeTransactionStep,
  }
}
