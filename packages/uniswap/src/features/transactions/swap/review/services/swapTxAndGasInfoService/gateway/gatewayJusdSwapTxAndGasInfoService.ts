import { fetchSwap } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { getTradeSettingsDeadline } from 'uniswap/src/data/apiClients/tradingApi/utils/getTradeSettingsDeadline'
import type { CreateSwapRequest } from 'uniswap/src/data/tradingApi/__generated__'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__'
import type { GasStrategy } from 'uniswap/src/data/tradingApi/types'
import { convertGasFeeToDisplayValue } from 'uniswap/src/features/gas/hooks'
import type { TransactionSettings } from 'uniswap/src/features/transactions/components/settings/types'
import { getCustomSwapTokenData } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapInstructionsService'
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
import type { ClassicTrade, GatewayJusdTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { GATEWAY_JUSD_ROUTING } from 'uniswap/src/features/transactions/swap/utils/routing'
import { validateTransactionRequests } from 'uniswap/src/features/transactions/swap/utils/trade'

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

      // Build transaction request info from API response
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
