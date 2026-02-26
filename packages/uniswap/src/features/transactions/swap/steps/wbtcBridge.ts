import { WbtcBridgeDirection } from 'uniswap/src/data/apiClients/tradingApi/utils/isBitcoinBridge'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { Erc20ChainSwapSubStep } from 'uniswap/src/features/transactions/swap/steps/erc20ChainSwap'

export { Erc20ChainSwapSubStep as WbtcBridgeSubStep }

export interface WbtcBridgeStep {
  type: TransactionStepType.WbtcBridgeStep
  direction: WbtcBridgeDirection
  subStep?: Erc20ChainSwapSubStep
}

export const createWbtcBridgeStep = (direction: WbtcBridgeDirection): WbtcBridgeStep => {
  return {
    type: TransactionStepType.WbtcBridgeStep,
    direction,
  }
}
