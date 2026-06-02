import { ADDRESS_ZERO } from '@juiceswapxyz/v3-sdk'
import { fetchSwap } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { getTradeSettingsDeadline } from 'uniswap/src/data/apiClients/tradingApi/utils/getTradeSettingsDeadline'
import type { CreateSwapRequest } from 'uniswap/src/data/tradingApi/__generated__'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__'
import type { GasStrategy } from 'uniswap/src/data/tradingApi/types'
import { convertGasFeeToDisplayValue } from 'uniswap/src/features/gas/hooks'
import type { TransactionSettings } from 'uniswap/src/features/transactions/components/settings/types'
import { resolveJuiceSwapSlippageTolerance } from 'uniswap/src/features/transactions/swap/constants/juiceSwapSlippage'
import type {
  SwapTxAndGasInfoParameters,
  SwapTxAndGasInfoService,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import {
  createApprovalFields,
  createGasFields,
  type TransactionRequestInfo,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import type {
  ClassicSwapTxAndGasInfo,
  SwapTxAndGasInfo,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { ClassicTrade, SatsumaTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { SATSUMA_ROUTING } from 'uniswap/src/features/transactions/swap/utils/routing'
import { validateTransactionRequests } from 'uniswap/src/features/transactions/swap/utils/trade'

/**
 * Satsuma swap service — handles direct Satsuma USDC.e/ctUSD swaps.
 *
 * Mirrors the Gateway service: the JuiceSwap api builds the calldata
 * server-side via /v1/swap and we wrap it as a ClassicSwapTxAndGasInfo so
 * downstream consumers (review screen, submit pipeline) treat it like a
 * normal token-token swap. Only the routing tag and the target router
 * address differ from CLASSIC.
 */
export function createSatsumaSwapTxAndGasInfoService(ctx: {
  gasStrategy: GasStrategy
  transactionSettings: TransactionSettings
}): SwapTxAndGasInfoService<SatsumaTrade> {
  const { gasStrategy, transactionSettings } = ctx

  const service: SwapTxAndGasInfoService<SatsumaTrade> = {
    async getSwapTxAndGasInfo(params: SwapTxAndGasInfoParameters<SatsumaTrade>): Promise<SwapTxAndGasInfo> {
      const { trade, approvalTxInfo } = params

      const currencyIn = trade.inputAmount.currency
      const currencyOut = trade.outputAmount.currency
      const customSwapData = {
        chainId: currencyIn.chainId,
        tokenInChainId: currencyIn.chainId,
        tokenInAddress: currencyIn.isNative ? ADDRESS_ZERO : currencyIn.address,
        tokenInDecimals: currencyIn.decimals,
        tokenOutChainId: currencyOut.chainId,
        tokenOutAddress: currencyOut.isNative ? ADDRESS_ZERO : currencyOut.address,
        tokenOutDecimals: currencyOut.decimals,
        slippageTolerance: resolveJuiceSwapSlippageTolerance(transactionSettings.customSlippageTolerance),
      }
      const deadline = getTradeSettingsDeadline(transactionSettings.customDeadline)

      // The api's /v1/swap endpoint detects routing=SATSUMA and emits Algebra
      // SwapRouter exactInputSingle calldata.
      const swapResponse = await fetchSwap({
        quote: trade.quote.quote as unknown as CreateSwapRequest['quote'],
        deadline,
        customSwapData,
      })

      const swapTxInfo: TransactionRequestInfo = {
        txRequests: [swapResponse.swap],
        gasFeeResult: {
          value: swapResponse.gasFee,
          displayValue: convertGasFeeToDisplayValue(swapResponse.gasFee, gasStrategy),
          isLoading: false,
          error: null,
        },
        gasEstimate: {},
        swapRequestArgs: undefined,
      }

      const txRequests = validateTransactionRequests(swapTxInfo.txRequests)

      const result: ClassicSwapTxAndGasInfo = {
        routing: SATSUMA_ROUTING as unknown as Routing.CLASSIC,
        trade: trade as unknown as ClassicTrade,
        ...createGasFields({ swapTxInfo, approvalTxInfo }),
        ...createApprovalFields({ approvalTxInfo }),
        txRequests,
        permit: undefined,
        swapRequestArgs: undefined,
        unsigned: false,
        includesDelegation: false,
      }

      return result
    },
  }

  return service
}
