import { useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__'
import { useSwapReviewTransactionStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/useSwapReviewTransactionStore'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import { SwapTxStoreContext } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/SwapTxStoreContext'
import { useSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore'
import { isValidSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { buildCitreaWrapTransaction } from 'uniswap/src/features/transactions/swap/utils/buildCitreaWrapTransaction'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function usePrepareSwapTransactionEffect(): void {
  const { acceptedDerivedSwapInfo, isWrap } = useSwapReviewTransactionStore((s) => ({
    acceptedDerivedSwapInfo: s.acceptedDerivedSwapInfo,
    isWrap: s.isWrap,
  }))
  const prepareSwapTransaction = useSwapDependenciesStore((s) => s.prepareSwapTransaction)
  const swapTxContext = useSwapTxStore((s) => isValidSwapTxContext(s) ? s : undefined)
  const validSwapTxContext = swapTxContext
  const { evmAccount } = useWallet()
  const store = useContext(SwapTxStoreContext)

  // Prepare and sign transaction when component mounts or trade changes
  console.log('usePrepareSwapTransactionEffect: enabled check', {
    validSwapTxContext: !!validSwapTxContext,
    isWrap,
    acceptedDerivedSwapInfo: !!acceptedDerivedSwapInfo,
    prepareSwapTransaction: !!prepareSwapTransaction,
    enabled: Boolean((validSwapTxContext || isWrap) && acceptedDerivedSwapInfo && (prepareSwapTransaction || isWrap))
  })

  useQuery({
    queryKey: [
      ReactQueryCacheKey.PrepareSwapTransaction,
      isWrap ? 'wrap' : 'swap',
      acceptedDerivedSwapInfo?.chainId,
      acceptedDerivedSwapInfo?.currencyAmounts.input?.toExact(),
      evmAccount?.address,
    ],
    queryFn: async (): Promise<true | null> => {
      console.log('usePrepareSwapTransactionEffect: queryFn called', {
        isWrap,
        validSwapTxContext: !!validSwapTxContext,
        acceptedDerivedSwapInfo: !!acceptedDerivedSwapInfo,
      })
      // For Citrea wraps, we need to build the transaction ourselves
      if (isWrap && acceptedDerivedSwapInfo && evmAccount) {
        const wrapType = acceptedDerivedSwapInfo.wrapType
        const inputAmount = acceptedDerivedSwapInfo.currencyAmounts.input
        const chainId = acceptedDerivedSwapInfo.chainId

        if (wrapType !== WrapType.NotApplicable && inputAmount) {
          const txRequest = buildCitreaWrapTransaction({
            amount: inputAmount,
            wrapType,
            chainId,
            walletAddress: evmAccount.address,
          })

          if (txRequest && store) {
            // Create mock gas estimation for Citrea wrap
            // Calculate actual gas fee: 50000 gas limit * 10 gwei = 500000000000000 wei = 0.0005 cBTC
            const gasLimit = 50000
            const gasPrice = 10000000000 // 10 gwei in wei
            const totalGasFeeWei = gasLimit * gasPrice
            const gasFeeString = totalGasFeeWei.toString()

            console.log('Gas fee calculation:', {
              gasLimit,
              gasPrice,
              totalGasFeeWei,
              gasFeeString,
              gasFeeInCBTC: totalGasFeeWei / Math.pow(10, 18)
            })

            const mockGasFeeResult = {
              value: gasFeeString, // Calculated correctly
              displayValue: gasFeeString, // Same as value, raw wei amount
              isLoading: false,
              error: null,
              gasEstimate: {
                gasLimit: gasLimit.toString(),
                gasPrice: gasPrice.toString(),
                maxFeePerGas: gasPrice.toString(),
                maxPriorityFeePerGas: gasPrice.toString(),
              },
              params: {
                gasLimit: gasLimit.toString(),
                gasPrice: gasPrice.toString(),
              },
            }

            // Store the transaction request and gas estimation for later execution
            const newState = {
              ...swapTxContext,
              txRequests: [txRequest],
              isWrap: true,
              routing: (wrapType === WrapType.Wrap ? Routing.WRAP : Routing.UNWRAP) as Routing.WRAP | Routing.UNWRAP,
              gasFee: mockGasFeeResult,
              gasFeeEstimation: {
                wrapEstimate: mockGasFeeResult.gasEstimate,
              },
            }
            console.log('Setting store state with gas fee:', newState)
            console.log('Gas fee value breakdown:', {
              value: mockGasFeeResult.value,
              displayValue: mockGasFeeResult.displayValue,
              valueInEth: (parseInt(mockGasFeeResult.value) / 1e18).toFixed(6) + ' cBTC'
            })
            store.setState(newState)
            return true
          }
        }
      }

      // Normal swap flow
      if (!validSwapTxContext || !acceptedDerivedSwapInfo || !prepareSwapTransaction) {
        return null
      }
      try {
        await prepareSwapTransaction({
          swapTxContext: validSwapTxContext,
        })
        return true
      } catch (error) {
        logger.warn('SwapReviewContent', 'prepareAndSignSwapTransaction', 'Failed to prepare and sign transaction', {
          error,
        })
        return null
      }
    },
    enabled: Boolean((validSwapTxContext || isWrap) && acceptedDerivedSwapInfo && (prepareSwapTransaction || isWrap)),
    refetchInterval: false,
    staleTime: 0, // Force fresh execution
    gcTime: 0, // Don't cache results
  })
}
