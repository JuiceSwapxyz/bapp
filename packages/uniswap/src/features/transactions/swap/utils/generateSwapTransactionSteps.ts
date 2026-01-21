import { BridgeQuote } from 'uniswap/src/data/tradingApi/__generated__'
import { BitcoinBridgeDirection, LightningBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import { createApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'
import { createPermit2SignatureStep } from 'uniswap/src/features/transactions/steps/permit2Signature'
import { createPermit2TransactionStep } from 'uniswap/src/features/transactions/steps/permit2Transaction'
import { createRevocationTransactionStep } from 'uniswap/src/features/transactions/steps/revoke'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { createBitcoinBridgeTransactionStep } from 'uniswap/src/features/transactions/swap/steps/bitcoinBridge'
import { orderClassicSwapSteps } from 'uniswap/src/features/transactions/swap/steps/classicSteps'
import { createLightningBridgeTransactionStep } from 'uniswap/src/features/transactions/swap/steps/lightningBridge'
import { createSignUniswapXOrderStep } from 'uniswap/src/features/transactions/swap/steps/signOrder'
import {
  createSwapTransactionAsyncStep,
  createSwapTransactionStep,
  createSwapTransactionStepBatched,
} from 'uniswap/src/features/transactions/swap/steps/swap'
import { orderUniswapXSteps } from 'uniswap/src/features/transactions/swap/steps/uniswapxSteps'
import { ClassicSwapTxAndGasInfo, GatewayJusdSwapTxAndGasInfo, SwapTxAndGasInfo, isValidSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import {
  isBitcoinBridge,
  isBridge,
  isClassic,
  isGatewayJusd,
  isLightningBridge,
  isUniswapX,
} from 'uniswap/src/features/transactions/swap/utils/routing'

export function generateSwapTransactionSteps(txContext: SwapTxAndGasInfo): TransactionStep[] {
  const isValidSwap = isValidSwapTxContext(txContext)

  if (isValidSwap) {
    const { trade, approveTxRequest, revocationTxRequest } = txContext

    const revocation = createRevocationTransactionStep(revocationTxRequest, trade.inputAmount.currency.wrapped)
    const approval = createApprovalTransactionStep({ txRequest: approveTxRequest, amountIn: trade.inputAmount })

    if (isClassic(txContext) || isGatewayJusd(txContext)) {
      // Cast to the union type since TypeScript has trouble narrowing with || on complex unions
      const classicContext = txContext as ClassicSwapTxAndGasInfo | GatewayJusdSwapTxAndGasInfo
      const { swapRequestArgs } = classicContext

      if (classicContext.unsigned && classicContext.permit && 'typedData' in classicContext.permit) {
        return orderClassicSwapSteps({
          revocation,
          approval,
          permit: createPermit2SignatureStep(classicContext.permit.typedData, trade.inputAmount.currency),
          swap: createSwapTransactionAsyncStep(swapRequestArgs),
        })
      }
      if (classicContext.txRequests && classicContext.txRequests.length > 1) {
        return orderClassicSwapSteps({
          permit: undefined,
          swap: createSwapTransactionStepBatched(classicContext.txRequests),
        })
      }

      const permit = classicContext.permit && 'txRequest' in classicContext.permit
        ? createPermit2TransactionStep({
            txRequest: classicContext.permit.txRequest,
            amountIn: trade.inputAmount,
          })
        : undefined

      // At this point txRequests should exist since we're past the unsigned check
      if (!classicContext.txRequests) {
        return []
      }

      return orderClassicSwapSteps({
        revocation,
        approval,
        permit,
        swap: createSwapTransactionStep(classicContext.txRequests[0]),
      })
    } else if (isUniswapX(txContext)) {
      return orderUniswapXSteps({
        revocation,
        approval,
        signOrder: createSignUniswapXOrderStep(txContext.permit.typedData, txContext.trade.quote.quote),
      })
    } else if (isBitcoinBridge(txContext)) {
      const direction =
        ((txContext.trade.quote.quote as BridgeQuote).direction as BitcoinBridgeDirection | undefined) ??
        BitcoinBridgeDirection.CitreaToBitcoin
      return [createBitcoinBridgeTransactionStep(direction)]
    } else if (isLightningBridge(txContext)) {
      const direction =
        ((txContext.trade.quote.quote as BridgeQuote).direction as LightningBridgeDirection | undefined) ??
        LightningBridgeDirection.Submarine
      return [createLightningBridgeTransactionStep(direction)]
    } else if (isBridge(txContext)) {
      if (txContext.txRequests.length > 1) {
        return orderClassicSwapSteps({
          permit: undefined,
          swap: createSwapTransactionStepBatched(txContext.txRequests),
        })
      }
      return orderClassicSwapSteps({
        revocation,
        approval,
        permit: undefined,
        swap: createSwapTransactionStep(txContext.txRequests[0]),
      })
    }
  }

  return []
}
