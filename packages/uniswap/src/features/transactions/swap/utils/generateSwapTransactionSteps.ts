import { BridgeQuote } from 'uniswap/src/data/tradingApi/__generated__'
import { BitcoinBridgeDirection, LightningBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import { Erc20ChainSwapDirection } from 'uniswap/src/data/apiClients/tradingApi/utils/isBitcoinBridge'
import { createApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'
import { createPermit2SignatureStep } from 'uniswap/src/features/transactions/steps/permit2Signature'
import { createPermit2TransactionStep } from 'uniswap/src/features/transactions/steps/permit2Transaction'
import { createRevocationTransactionStep } from 'uniswap/src/features/transactions/steps/revoke'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { createBitcoinBridgeTransactionStep } from 'uniswap/src/features/transactions/swap/steps/bitcoinBridge'
import { orderClassicSwapSteps } from 'uniswap/src/features/transactions/swap/steps/classicSteps'
import { createErc20ChainSwapStep } from 'uniswap/src/features/transactions/swap/steps/erc20ChainSwap'
import { createLightningBridgeTransactionStep } from 'uniswap/src/features/transactions/swap/steps/lightningBridge'
import { createSignUniswapXOrderStep } from 'uniswap/src/features/transactions/swap/steps/signOrder'
import {
  createSwapTransactionAsyncStep,
  createSwapTransactionStep,
  createSwapTransactionStepBatched,
} from 'uniswap/src/features/transactions/swap/steps/swap'
import { orderUniswapXSteps } from 'uniswap/src/features/transactions/swap/steps/uniswapxSteps'
import { SwapTxAndGasInfo, isValidSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import {
  isBitcoinBridge,
  isBridge,
  isClassic,
  isErc20ChainSwap,
  isLightningBridge,
  isUniswapX,
} from 'uniswap/src/features/transactions/swap/utils/routing'

export function generateSwapTransactionSteps(txContext: SwapTxAndGasInfo, _v4Enabled?: boolean): TransactionStep[] {
  const isValidSwap = isValidSwapTxContext(txContext)

  if (isValidSwap) {
    const { trade, approveTxRequest, revocationTxRequest } = txContext

    const revocation = createRevocationTransactionStep(revocationTxRequest, trade.inputAmount.currency.wrapped)
    const approval = createApprovalTransactionStep({ txRequest: approveTxRequest, amountIn: trade.inputAmount })

    if (isClassic(txContext)) {
      const { swapRequestArgs } = txContext

      if (txContext.unsigned) {
        return orderClassicSwapSteps({
          revocation,
          approval,
          permit: createPermit2SignatureStep(txContext.permit.typedData, trade.inputAmount.currency),
          swap: createSwapTransactionAsyncStep(swapRequestArgs),
        })
      }
      if (txContext.txRequests.length > 1) {
        return orderClassicSwapSteps({
          permit: undefined,
          swap: createSwapTransactionStepBatched(txContext.txRequests),
        })
      }

      const permit = txContext.permit
        ? createPermit2TransactionStep({
            txRequest: txContext.permit.txRequest,
            amountIn: trade.inputAmount,
          })
        : undefined

      return orderClassicSwapSteps({
        revocation,
        approval,
        permit,
        swap: createSwapTransactionStep(txContext.txRequests[0]),
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
      // Check if this is an ERC20 chain swap by looking at the quote direction
      // ERC20 chain swaps have routing BRIDGE but have Erc20ChainSwapDirection
      const quoteDirection = (trade.quote.quote as BridgeQuote).direction
      const isErc20ChainSwapDirection = quoteDirection === Erc20ChainSwapDirection.PolygonToCitrea || 
                                         quoteDirection === Erc20ChainSwapDirection.CitreaToPolygon ||
                                         quoteDirection === Erc20ChainSwapDirection.EthereumToCitrea ||
                                         quoteDirection === Erc20ChainSwapDirection.CitreaToEthereum
      
      if (isErc20ChainSwapDirection) {
        const direction = quoteDirection as Erc20ChainSwapDirection
        return [createErc20ChainSwapStep(direction)]
      }
      
      // Regular bridge swaps require txRequests
      if (txContext.txRequests && txContext.txRequests.length > 1) {
        return orderClassicSwapSteps({
          permit: undefined,
          swap: createSwapTransactionStepBatched(txContext.txRequests),
        })
      }
      if (txContext.txRequests && txContext.txRequests.length > 0) {
        return orderClassicSwapSteps({
          revocation,
          approval,
          permit: undefined,
          swap: createSwapTransactionStep(txContext.txRequests[0]),
        })
      }
    }
  }

  return []
}
