import { generateChainSwapKeys } from 'state/sagas/transactions/chainSwapKeys'
import { BitcoinBridgeLockTransactionStep } from 'uniswap/src/features/transactions/swap/steps/bitcoinBridge'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'

interface HandleBitcoinBridgeLockTransactionStepParams {
  step: BitcoinBridgeLockTransactionStep
  setCurrentStep: SetCurrentStepFn
  trade: Trade
  account: AccountDetails
  destinationAddress?: string
  onTransactionHash?: (hash: string) => void
}

export function handleBitcoinBridgeLockTransactionStep(_params: HandleBitcoinBridgeLockTransactionStepParams): void {
  // TODO: Implement Bitcoin bridge lock transaction handling
  generateChainSwapKeys()
}
