import { WbtcBridgeDirection } from 'uniswap/src/data/apiClients/tradingApi/utils/isBitcoinBridge'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'

export interface WbtcBridgeStep {
  type: TransactionStepType.WbtcBridgeStep
  direction: WbtcBridgeDirection
}

export const createWbtcBridgeStep = (direction: WbtcBridgeDirection): WbtcBridgeStep => {
  return {
    type: TransactionStepType.WbtcBridgeStep,
    direction,
  }
}
