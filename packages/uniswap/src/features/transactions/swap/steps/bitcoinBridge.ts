import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'

export interface BitcoinBridgeLockTransactionStep {
  type: TransactionStepType.BitcoinBridgeLockTransactionStep
}

export const createBitcoinBridgeLockTransactionStep = (): BitcoinBridgeLockTransactionStep => {
  // Here we can collect stuff for my saga to run
  return {
    type: TransactionStepType.BitcoinBridgeLockTransactionStep,
  }
}
