import { WbtcBridgeDirection } from 'uniswap/src/data/apiClients/tradingApi/utils/isBitcoinBridge'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'

/**
 * Sub-steps for WBTC bridge (cBTC ↔ WBTC_ETH) to provide granular UI feedback.
 */
export enum WbtcBridgeSubStep {
  CheckingAllowance = 'checking_allowance',
  WaitingForApproval = 'waiting_for_approval',
  ApprovingToken = 'approving_token',
  WaitingForLock = 'waiting_for_lock',
  LockingTokens = 'locking_tokens',
  WaitingForBridge = 'waiting_for_bridge',
  ClaimingTokens = 'claiming_tokens',
  Complete = 'complete',
}

export interface WbtcBridgeStep {
  type: TransactionStepType.WbtcBridgeStep
  direction: WbtcBridgeDirection
  subStep?: WbtcBridgeSubStep
}

export const createWbtcBridgeStep = (direction: WbtcBridgeDirection): WbtcBridgeStep => {
  return {
    type: TransactionStepType.WbtcBridgeStep,
    direction,
  }
}
