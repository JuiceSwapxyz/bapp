import { Erc20ChainSwapDirection } from 'uniswap/src/data/apiClients/tradingApi/utils/isBitcoinBridge'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'

/**
 * Sub-steps for ERC20 Chain Swap to provide granular UI feedback
 */
export enum Erc20ChainSwapSubStep {
  CheckingAuth = 'checking_auth',
  WaitingForAuth = 'waiting_for_auth',
  Authenticating = 'authenticating',
  CheckingAllowance = 'checking_allowance',
  WaitingForApproval = 'waiting_for_approval',
  ApprovingToken = 'approving_token',
  WaitingForLock = 'waiting_for_lock',
  LockingTokens = 'locking_tokens',
  WaitingForBridge = 'waiting_for_bridge',
  ClaimingTokens = 'claiming_tokens',
  Complete = 'complete',
}

export interface Erc20ChainSwapStep {
  type: TransactionStepType.Erc20ChainSwapStep
  direction: Erc20ChainSwapDirection
  subStep?: Erc20ChainSwapSubStep
  txHash?: string
  backendAccepted?: boolean
}

export const createErc20ChainSwapStep = (direction: Erc20ChainSwapDirection): Erc20ChainSwapStep => {
  return {
    type: TransactionStepType.Erc20ChainSwapStep,
    direction,
  }
}
