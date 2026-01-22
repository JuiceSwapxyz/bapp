import { OnChainTransactionFields, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'

/**
 * Step for creating and initializing a new pool before adding liquidity.
 * This is used in Gateway flow when the pool doesn't exist yet.
 *
 * The createPool transaction calls createAndInitializePoolIfNecessary on the
 * NonfungiblePositionManager contract, which is idempotent (no-op if pool exists).
 */
export interface CreatePoolTransactionStep extends OnChainTransactionFields {
  type: TransactionStepType.CreatePoolTransaction
}

export function createCreatePoolStep(
  txRequest: ValidatedTransactionRequest | undefined,
): CreatePoolTransactionStep | undefined {
  if (!txRequest) {
    return undefined
  }

  return {
    type: TransactionStepType.CreatePoolTransaction,
    txRequest,
  }
}
