import type { GasStrategy } from 'uniswap/src/data/tradingApi/types'
import type { TransactionSettings } from 'uniswap/src/features/transactions/components/settings/types'
import type { SwapTxAndGasInfoService, SwapTxAndGasInfoParameters } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import type { SwapTxAndGasInfo, ClassicSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { GatewayJusdTrade, ClassicTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { fetchSwap } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import type { CreateSwapRequest } from 'uniswap/src/data/tradingApi/__generated__'
import { validateTransactionRequests } from 'uniswap/src/features/transactions/swap/utils/trade'
import { convertGasFeeToDisplayValue } from 'uniswap/src/features/gas/hooks'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__'
import { GATEWAY_JUSD_ROUTING } from 'uniswap/src/features/transactions/swap/utils/routing'
import { createApprovalFields, createGasFields, type TransactionRequestInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import { getTradeSettingsDeadline } from 'uniswap/src/data/apiClients/tradingApi/utils/getTradeSettingsDeadline'
import { getCustomSwapTokenData } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapInstructionsService'

/**
 * Gateway JUSD swap service - handles JUSD/svJUSD abstraction swaps through JuiceSwapGateway
 *
 * Unlike ClassicTrade which uses Uniswap's swap endpoint format, Gateway trades
 * call the JuiceSwap API /swap endpoint which understands the Gateway quote structure.
 */
export function createGatewayJusdSwapTxAndGasInfoService(ctx: {
  gasStrategy: GasStrategy
  transactionSettings: TransactionSettings
}): SwapTxAndGasInfoService<GatewayJusdTrade> {
  const { gasStrategy, transactionSettings } = ctx

  const service: SwapTxAndGasInfoService<GatewayJusdTrade> = {
    async getSwapTxAndGasInfo(params: SwapTxAndGasInfoParameters<GatewayJusdTrade>): Promise<SwapTxAndGasInfo> {
      const { trade, approvalTxInfo } = params

      // Get custom swap data for the Gateway trade
      const customSwapData = getCustomSwapTokenData(trade, transactionSettings)
      const deadline = getTradeSettingsDeadline(transactionSettings.customDeadline)

      // fetchSwap has special handling for Gateway JUSD quotes
      // It detects the quote structure and calls the JuiceSwap API /swap endpoint
      const swapResponse = await fetchSwap({
        quote: trade.quote.quote as unknown as CreateSwapRequest['quote'],
        deadline,
        customSwapData, // Pass as nested property so fetchSwap can spread it into body
      })

      // Build transaction request info
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

      // Validate and return
      const txRequests = validateTransactionRequests(swapTxInfo.txRequests)

      const result: ClassicSwapTxAndGasInfo = {
        routing: GATEWAY_JUSD_ROUTING as unknown as Routing.CLASSIC,
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
