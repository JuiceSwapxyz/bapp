import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { clientToProvider } from 'hooks/useEthersProvider'
import { useCallback } from 'react'
import { fetchBridgeSwapByPreimageHash } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import {
  EvmLockup,
  SWAP_CONTRACT_ADDRESSES,
  getLdsBridgeManager,
  helpMeClaim,
  prefix0x,
} from 'uniswap/src/features/lds-bridge'
import { claimCoinSwap, claimErc20Swap } from 'uniswap/src/features/lds-bridge/transactions/evm'
import { logger } from 'utilities/src/logger/logger'
import { getConnectorClient, switchChain } from 'wagmi/actions'

export function useEvmClaim() {
  const executeClaimIndexed = useCallback(async (lockup: EvmLockup): Promise<string> => {
    try {
      const preimage = lockup.knownPreimage?.preimage
      if (!preimage) {
        throw new Error('Preimage not found')
      }
      const { txHash } = await helpMeClaim({
        preimage: prefix0x(preimage),
        preimageHash: prefix0x(lockup.preimageHash),
        chainId: Number(lockup.chainId),
      })

      return txHash
    } catch (error) {
      logger.error(error, { tags: { file: 'useEvmClaim', function: 'executeClaimIndexed' } })
      throw error
    }
  }, [])

  const executeClaimLocal = useCallback(async (lockup: EvmLockup): Promise<string> => {
    try {
      const swap = await fetchBridgeSwapByPreimageHash({ preimageHash: lockup.preimageHash })

      const claimedSwap = await getLdsBridgeManager().autoClaimSwap(swap)

      if (!claimedSwap.claimTx) {
        throw new Error('Claim transaction not found')
      }

      logger.info('useEvmClaim', 'executeClaim', `Claim successful: ${claimedSwap.claimTx}`)
      return claimedSwap.claimTx
    } catch (error) {
      logger.error(error, { tags: { file: 'useEvmClaim', function: 'executeClaim' } })
      throw error
    }
  }, [])

  const executeClaimDirect = useCallback(async (lockup: EvmLockup): Promise<string> => {
    const preimage = lockup.knownPreimage?.preimage
    if (!preimage) {
      throw new Error('Preimage not found')
    }

    const chainId = Number(lockup.chainId)

    if (!(chainId in SWAP_CONTRACT_ADDRESSES)) {
      throw new Error(`Unsupported chain ID: ${lockup.chainId}`)
    }

    const chainContracts = SWAP_CONTRACT_ADDRESSES[chainId]

    // Check if it's a native token (cBTC) or ERC20
    const isNativeToken = !lockup.tokenAddress || lockup.tokenAddress === '0x0000000000000000000000000000000000000000'

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
      logger.warn('useEvmClaim', 'executeClaimDirect', 'Failed to switch chain, continuing anyway', { error })
    }

    // Get connector client for the chain
    const client = await getConnectorClient(wagmiConfig, { chainId: chainId as any })
    const provider = clientToProvider(client)
    const signer = provider!.getSigner()

    const amount = BigInt(lockup.amount)
    const timelock = Number(lockup.timelock)

    let txHash: string

    if (isNativeToken) {
      txHash = await claimCoinSwap({
        signer,
        contractAddress,
        preimage,
        amount,
        refundAddress: lockup.refundAddress,
        timelock,
      })
    } else {
      txHash = await claimErc20Swap({
        signer,
        contractAddress,
        tokenAddress: lockup.tokenAddress,
        preimage,
        amount,
        refundAddress: lockup.refundAddress,
        timelock,
      })
    }

    // Best-effort local storage update
    try {
      const swap = await fetchBridgeSwapByPreimageHash({ preimageHash: lockup.preimageHash })
      await getLdsBridgeManager().updateSwapClaimTx(swap.id, txHash)
    } catch (storageError) {
      logger.warn('useEvmClaim', 'executeClaimDirect', 'Failed to update local storage', { storageError })
    }

    logger.info('useEvmClaim', 'executeClaimDirect', `Direct claim successful: ${txHash}`)
    return txHash
  }, [])

  const executeClaim = useCallback(
    async (lockup: EvmLockup): Promise<string> => {
      try {
        return await executeClaimLocal(lockup)
      } catch (localError) {
        logger.error(localError, { tags: { file: 'useEvmClaim', function: 'executeClaim.local' } })
        try {
          return await executeClaimIndexed(lockup)
        } catch (indexedError) {
          logger.error(indexedError, { tags: { file: 'useEvmClaim', function: 'executeClaim.indexed' } })
          return await executeClaimDirect(lockup)
        }
      }
    },
    [executeClaimDirect, executeClaimIndexed, executeClaimLocal],
  )

  return { executeClaim }
}
