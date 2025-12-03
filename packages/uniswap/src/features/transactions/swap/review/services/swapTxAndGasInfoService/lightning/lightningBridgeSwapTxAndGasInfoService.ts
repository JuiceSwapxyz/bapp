import type { GasStrategy } from 'uniswap/src/data/tradingApi/types'
import type { SwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import { getLightningBridgeSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import type { LightningBridgeTrade } from 'uniswap/src/features/transactions/swap/types/trade'

export function createLightningBridgeSwapTxAndGasInfoService(_ctx: {
  gasStrategy: GasStrategy
}): SwapTxAndGasInfoService<LightningBridgeTrade> {
  const service: SwapTxAndGasInfoService<LightningBridgeTrade> = {
    async getSwapTxAndGasInfo(params) {
      // For Lightning bridge, we don't have EVM transactions or trading API quotes
      // Provide zero gas fees since Lightning bridge uses its own fee mechanism
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

      return getLightningBridgeSwapTxAndGasInfo({
        trade: params.trade,
        swapTxInfo: mockSwapTxInfo,
        approvalTxInfo: mockApprovalTxInfo,
        destinationAddress: params.bitcoinDestinationAddress,
      })
    },
  }

  return service
}
