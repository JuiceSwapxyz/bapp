import { Erc20ChainSwapDirection } from 'uniswap/src/data/apiClients/tradingApi/utils/isBitcoinBridge'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'

export interface Erc20ChainSwapStep {
  type: TransactionStepType.Erc20ChainSwapStep
  direction: Erc20ChainSwapDirection
}

export const createErc20ChainSwapTransactionStep = (
  direction: Erc20ChainSwapDirection,
): Erc20ChainSwapStep => {
  return {
    type: TransactionStepType.Erc20ChainSwapStep,
    direction,
  }
}
