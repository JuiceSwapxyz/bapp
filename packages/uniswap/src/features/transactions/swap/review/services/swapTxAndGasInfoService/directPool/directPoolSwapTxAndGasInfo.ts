import type { Address } from 'viem'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__'
import type { GasFeeResult } from 'uniswap/src/features/gas/types'
import type { ClassicSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { ClassicTrade, JusdDirectPoolTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import {
  buildJusdDirectPoolSwapTx,
  buildJusdRouterApprovalTx,
} from 'uniswap/src/features/transactions/swap/utils/jusdDirectPool'
import { DIRECT_POOL_ROUTING } from 'uniswap/src/features/transactions/swap/utils/routing'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import type { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'

// Gas for these txns is paid at execution time; we don't have a local estimate here, so surface a
// zero-valued (but valid) gas fee result. NOTE: this under-reports gas in the review UI. It does
// not affect the actual on-chain gas the user pays.
const ZERO_GAS_FEE_RESULT: GasFeeResult = {
  value: '0',
  displayValue: '0',
  isLoading: false,
  error: null,
}

/**
 * Builds a Classic-shaped SwapTxAndGasInfo for a JUSD direct-pool trade from local data only — no
 * api calls. `allowance` is the caller's current JUSD allowance to SwapRouter02; when insufficient
 * we attach a plain ERC20 approve (SwapRouter02 pulls via `transferFrom`, so no Permit2 is
 * involved).
 *
 * Slippage is taken from `trade.quote.quote.slippageToleranceBps` — the value baked from the user's
 * live setting at getTrade time and the SAME one that backs `trade.minAmountOut`. So the executed
 * `amountOutMinimum` is always exactly the "minimum received" the review UI promised: single source
 * of truth, no display/execution divergence.
 *
 * The result rides the same Classic validation/step path as Satsuma/Gateway (see
 * validateSwapTxContext / generateSwapTransactionSteps).
 */
export function buildJusdDirectPoolSwapTxAndGasInfo({
  trade,
  allowance,
}: {
  trade: JusdDirectPoolTrade
  allowance: bigint
}): ClassicSwapTxAndGasInfo {
  const { quote } = trade.quote
  const chainId = quote.chainId
  const swapper = quote.swapper as Address
  const amountIn = BigInt(quote.amountIn)

  const swapTx = buildJusdDirectPoolSwapTx({
    quote: {
      poolAddress: quote.poolAddress as Address,
      fee: quote.fee,
      amountIn,
      amountOut: BigInt(quote.amountOut),
      tokenIn: quote.tokenIn as Address,
      tokenOut: quote.tokenOut as Address,
    },
    recipient: swapper,
    slippageToleranceBps: quote.slippageToleranceBps,
    outputIsNative: quote.outputIsNative,
  })

  const swapTxRequest: ValidatedTransactionRequest = {
    to: swapTx.to,
    from: swapper,
    data: swapTx.data,
    value: swapTx.value.toString(),
    chainId,
  }

  // Approve SwapRouter02 for JUSD when the current allowance can't cover this swap. We approve the
  // exact input amount rather than MaxUint256 to keep the grant tight; a re-quote after the user
  // raises the amount re-checks and re-approves.
  const needsApproval = allowance < amountIn
  const approvalCall = buildJusdRouterApprovalTx(amountIn)
  const approveTxRequest: ValidatedTransactionRequest | undefined = needsApproval
    ? validateTransactionRequest({
        to: approvalCall.to,
        from: swapper,
        data: approvalCall.data,
        value: approvalCall.value.toString(),
        chainId,
      })
    : undefined

  return {
    routing: DIRECT_POOL_ROUTING as unknown as Routing.CLASSIC,
    trade: trade as unknown as ClassicTrade,
    gasFee: ZERO_GAS_FEE_RESULT,
    gasFeeEstimation: {},
    approveTxRequest,
    revocationTxRequest: undefined,
    txRequests: [swapTxRequest],
    permit: undefined,
    swapRequestArgs: undefined,
    unsigned: false,
    includesDelegation: false,
  }
}
