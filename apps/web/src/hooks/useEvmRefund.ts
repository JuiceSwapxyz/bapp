import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { clientToProvider } from 'hooks/useEthersProvider'
import { useCallback } from 'react'
import { fetchBridgeSwapByPreimageHash } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { EvmLockup, SWAP_CONTRACT_ADDRESSES, getLdsBridgeManager } from 'uniswap/src/features/lds-bridge'
import { refundCoinSwap, refundErc20Swap } from 'uniswap/src/features/lds-bridge/transactions/evm'
import { logger } from 'utilities/src/logger/logger'
import { getConnectorClient, switchChain } from 'wagmi/actions'

export function useEvmRefund() {
  const executeRefund = useCallback(async (lockup: EvmLockup): Promise<string> => {
    try {
      const chainId = Number(lockup.chainId)

      if (!(chainId in SWAP_CONTRACT_ADDRESSES)) {
        throw new Error(`Unsupported chain ID: ${lockup.chainId}`)
      }

      const chainContracts = SWAP_CONTRACT_ADDRESSES[chainId]

      // Check if it's a native token (cBTC) or ERC20
      const isNativeToken = !lockup.tokenAddress || lockup.tokenAddress === '0x0000000000000000000000000000000000000000'

      // Get the appropriate contract address based on token type
      const contractAddress = isNativeToken ? chainContracts.coinSwap : chainContracts.erc20Swap

      if (!contractAddress) {
        throw new Error(
          `No ${isNativeToken ? 'coin swap' : 'ERC20 swap'} contract address for chain ID: ${lockup.chainId}`,
        )
      }

      // Switch to the correct chain
      try {
        await switchChain(wagmiConfig, { chainId: chainId as any })
      } catch (error) {
        logger.warn('useEvmRefund', 'executeRefund', 'Failed to switch chain, continuing anyway', { error })
      }

      // Get connector client for the chain
      const client = await getConnectorClient(wagmiConfig, { chainId: chainId as any })

      const provider = clientToProvider(client)
      const signer = provider!.getSigner()

      const amount = BigInt(lockup.amount)
      const timelock = Number(lockup.timelock)

      let txHash: string

      if (isNativeToken) {
        // Native token refund (cBTC) - uses COIN_SWAP_ABI with 4 parameters
        txHash = await refundCoinSwap({
          signer,
          contractAddress,
          preimageHash: lockup.preimageHash,
          amount,
          claimAddress: lockup.claimAddress,
          timelock,
        })
      } else {
        // ERC20 token refund - uses ERC20_SWAP_ABI with 6 parameters
        txHash = await refundErc20Swap({
          signer,
          contractAddress,
          tokenAddress: lockup.tokenAddress,
          preimageHash: lockup.preimageHash,
          amount,
          claimAddress: lockup.claimAddress,
          refundAddress: lockup.refundAddress,
          timelock,
        })
      }

      const swap = await fetchBridgeSwapByPreimageHash({ preimageHash: lockup.preimageHash })
      swap.refundTx = txHash
      await getLdsBridgeManager().updateSwapRefundTx(swap.id, txHash)

      logger.info('useEvmRefund', 'executeRefund', `Refund successful: ${txHash}`)
      return txHash
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), {
        tags: { file: 'useEvmRefund', function: 'executeRefund' },
        extra: { lockup },
      })
      throw error
    }
  }, [])

  return { executeRefund }
}
