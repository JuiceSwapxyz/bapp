import type { GasStrategy } from 'uniswap/src/data/tradingApi/types'
import type { SwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import { getBridgeSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import type { BridgeTrade } from 'uniswap/src/features/transactions/swap/types/trade'

export function createErc20ChainSwapTxAndGasInfoService(_ctx: {
  gasStrategy: GasStrategy
}): SwapTxAndGasInfoService<BridgeTrade> {
  const service: SwapTxAndGasInfoService<BridgeTrade> = {
    async getSwapTxAndGasInfo(params) {
      // For ERC20 chain swaps via Boltz, we don't call the trading API
      // The swap is handled by the Boltz API after token approval
      // Provide zero gas fees since the actual swap gas is paid through Boltz fees
      const mockSwapTxInfo = {
        gasFeeResult: {
          value: '0',
          displayValue: '0',
          isLoading: false,
          error: null,
        },
        txRequests: undefined,
        gasEstimate: {
          swapEstimate: undefined,
        },
        includesDelegation: false,
        swapRequestArgs: undefined,
      }

      const mockApprovalTxInfo = {
        approvalGasFeeResult: {
          value: '0',
          displayValue: '0',
          isLoading: false,
          error: null,
        },
        revokeGasFeeResult: {
          value: '0',
          displayValue: '0',
          isLoading: false,
          error: null,
        },
        tokenApprovalInfo: params.approvalTxInfo.tokenApprovalInfo,
      }

      return getBridgeSwapTxAndGasInfo({
        trade: params.trade,
        swapTxInfo: mockSwapTxInfo,
        approvalTxInfo: mockApprovalTxInfo,
      })
    },
  }

  return service
}
