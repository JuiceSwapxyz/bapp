import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { clientToProvider } from 'hooks/useEthersProvider'
import { useCallback } from 'react'
import { EvmLockup, getLdsBridgeManager, prefix0x } from 'uniswap/src/features/lds-bridge'
import { refundCoinSwap, refundErc20Swap } from 'uniswap/src/features/lds-bridge/transactions/evm'
import { logger } from 'utilities/src/logger/logger'
import { getConnectorClient, switchChain } from 'wagmi/actions'

// Contract addresses by chain
const CONTRACT_ADDRESSES: Record<number, { coinSwap?: string; erc20Swap: string }> = {
  4114: {
    // Citrea Mainnet
    coinSwap: '0xFD92F846fe6E7d08d28D6A88676BB875E5D906ab',
    erc20Swap: '0x7397F25F230f7d5A83c18e1B68b32511bf35F860',
  },
  5115: {
    // Citrea Testnet
    coinSwap: '0xd02731fD8c5FDD53B613A699234FAd5EE8851B65',
    erc20Swap: '0xf2e019a371e5Fd32dB2fC564Ad9eAE9E433133cc',
  },
  137: {
    // Polygon Mainnet
    erc20Swap: '0x2E21F58Da58c391F110467c7484EdfA849C1CB9B',
  },
  80002: {
    // Polygon Testnet (Amoy)
    erc20Swap: '0x2E21F58Da58c391F110467c7484EdfA849C1CB9B',
  },
  1: {
    // Ethereum Mainnet
    erc20Swap: '0x2E21F58Da58c391F110467c7484EdfA849C1CB9B',
  },
}

export function useEvmRefund() {
  const executeRefund = useCallback(async (lockup: EvmLockup): Promise<string> => {
    try {
      const chainId = Number(lockup.chainId)

      if (!(chainId in CONTRACT_ADDRESSES)) {
        throw new Error(`Unsupported chain ID: ${lockup.chainId}`)
      }

      const chainContracts = CONTRACT_ADDRESSES[chainId]

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

      const swaps = await getLdsBridgeManager().getSwaps()
      const currentSwap = Object.values(swaps).find(
        (swap) => prefix0x(swap.preimageHash) === prefix0x(lockup.preimageHash),
      )
      if (currentSwap) {
        currentSwap.refundTx = txHash
        await getLdsBridgeManager().updateSwapRefundTx(currentSwap.id, txHash)
      }

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
