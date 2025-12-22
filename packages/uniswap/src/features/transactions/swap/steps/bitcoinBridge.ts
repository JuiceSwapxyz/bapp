import { BitcoinBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'

export interface BitcoinBridgeCitreaToBitcoinStep {
  type: TransactionStepType.BitcoinBridgeCitreaToBitcoinStep
}

export interface BitcoinBridgeBitcoinToCitreaStep {
  type: TransactionStepType.BitcoinBridgeBitcoinToCitreaStep
  bip21?: string
}

export type BitcoinBridgeTransactionStep = BitcoinBridgeCitreaToBitcoinStep | BitcoinBridgeBitcoinToCitreaStep

export const createBitcoinBridgeTransactionStep = (direction: BitcoinBridgeDirection): BitcoinBridgeTransactionStep => {
  if (direction === BitcoinBridgeDirection.CitreaToBitcoin) {
    return {
      type: TransactionStepType.BitcoinBridgeCitreaToBitcoinStep,
    }
  }
  return {
    type: TransactionStepType.BitcoinBridgeBitcoinToCitreaStep,
  }
}
