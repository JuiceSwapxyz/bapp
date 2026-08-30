import type { Address } from 'viem'
import type { DirectPoolQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { TradeType } from 'uniswap/src/data/tradingApi/__generated__'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import type { ValidatedTradeInput } from 'uniswap/src/features/transactions/swap/services/tradeService/transformations/buildQuoteRequest'
import { JusdDirectPoolTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import {
  getJusdDirectPoolQuote,
  isJusdDirectPoolSupported,
  slippagePercentToBps,
} from 'uniswap/src/features/transactions/swap/utils/jusdDirectPool'

/**
 * Client-side fallback for selling JUSD when the JuiceSwap Gateway quote fails (e.g. the gateway is
 * paused because the savings rate is 0%). Reads a real on-chain JUSD/WCBTC V3 pool and, if one is
 * seeded, returns a locally-constructed `JusdDirectPoolTrade`. Returns `null` when the pair/chain is
 * not supported, the trade is not exact-input, or no funded pool exists yet — in which case the
 * caller should surface the original gateway error.
 *
 * This performs read-only RPC calls only; it never mutates state.
 */
export async function tryBuildJusdDirectPoolTrade(
  validatedInput: ValidatedTradeInput,
  customSlippageTolerance: number | undefined,
): Promise<JusdDirectPoolTrade | null> {
  const { currencyIn, currencyOut, amount, requestTradeType, activeAccountAddress } = validatedInput

  // The direct-pool math is exact-input only.
  if (requestTradeType !== TradeType.EXACT_INPUT) {
    return null
  }

  const chainId = currencyIn.chainId
  if (!isUniverseChainId(chainId) || chainId !== UniverseChainId.CitreaMainnet) {
    return null
  }

  if (
    !isJusdDirectPoolSupported({
      chainId,
      tokenInAddress: validatedInput.tokenInAddress as Address,
      tokenOutAddress: validatedInput.tokenOutAddress as Address,
    })
  ) {
    return null
  }

  const amountInRaw = BigInt(amount.quotient.toString())

  // The fallback must never mask the caller's original gateway error: any RPC/read failure here
  // resolves to `null` so the caller re-throws the gateway error instead of a confusing pool error.
  let poolQuote
  try {
    poolQuote = await getJusdDirectPoolQuote(amountInRaw)
  } catch {
    return null
  }
  if (!poolQuote) {
    return null
  }

  // Bake the user's live slippage into the quote so display (minAmountOut/slippageTolerance) and
  // execution (amountOutMinimum) share one value and can never diverge. getTrade re-runs each poll
  // with the current setting, so this stays current within one poll interval after a change.
  const slippageToleranceBps = slippagePercentToBps(customSlippageTolerance)

  const quote: DirectPoolQuoteResponse = {
    // requestId is used as the swap-tx-info query key; it includes the slippage so the swap tx
    // refetches when the user changes slippage, and is otherwise stable per (amountIn, amountOut).
    requestId: `direct-pool-${poolQuote.tokenIn}-${poolQuote.tokenOut}-${poolQuote.fee}-${poolQuote.amountIn.toString()}-${poolQuote.amountOut.toString()}-${slippageToleranceBps}`,
    routing: 'DIRECT_POOL',
    permitData: null,
    quote: {
      chainId,
      swapper: activeAccountAddress ?? '',
      amountIn: poolQuote.amountIn.toString(),
      amountOut: poolQuote.amountOut.toString(),
      poolAddress: poolQuote.poolAddress,
      fee: poolQuote.fee,
      tokenIn: poolQuote.tokenIn,
      tokenOut: poolQuote.tokenOut,
      outputIsNative: currencyOut.isNative,
      slippageToleranceBps,
    },
  }

  return new JusdDirectPoolTrade({
    quote,
    currencyIn,
    currencyOut,
    tradeType: TradeType.EXACT_INPUT,
  })
}
