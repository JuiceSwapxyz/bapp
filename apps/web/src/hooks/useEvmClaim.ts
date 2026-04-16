import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { LDS_BRIDGE_LOCKUP_CONTRACTS_BY_CHAIN_ID } from 'constants/ldsBridgeContracts'
import { clientToProvider } from 'hooks/useEthersProvider'
import { useCallback } from 'react'
import { fetchBridgeSwapByPreimageHash } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  EvmLockup,
  HelpMeClaimResponse,
  SomeSwap,
  claimCoinSwap,
  claimErc20Swap,
  getLdsBridgeManager,
  getLockup,
  helpMeClaim,
  prefix0x,
} from 'uniswap/src/features/lds-bridge'
import { logger } from 'utilities/src/logger/logger'
import { getConnectorClient, switchChain } from 'wagmi/actions'

function isNativeToken(tokenAddress: string | undefined): boolean {
  return !tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000'
}

export function useEvmClaim() {
  const executeSponsoredClaimIndexed = useCallback(async (lockup: EvmLockup): Promise<HelpMeClaimResponse> => {
    const preimage = lockup.knownPreimage?.preimage
    if (!preimage) {
      throw new Error('Preimage not found')
    }
    return helpMeClaim({
      preimage: prefix0x(preimage),
      preimageHash: prefix0x(lockup.preimageHash),
      chainId: Number(lockup.chainId),
    })
  }, [])

  const executeSponsoredClaimLocal = useCallback(async (swap: SomeSwap): Promise<HelpMeClaimResponse> => {
    return getLdsBridgeManager().autoClaimSwap(swap)
  }, [])

  const executeSponsoredClaim = useCallback(
    async (lockup: EvmLockup): Promise<HelpMeClaimResponse> => {
      const swap = await fetchBridgeSwapByPreimageHash({ preimageHash: lockup.preimageHash }).catch(() => null)
      if (swap) {
        return executeSponsoredClaimLocal(swap)
      }
      return executeSponsoredClaimIndexed(lockup)
    },
    [executeSponsoredClaimIndexed, executeSponsoredClaimLocal],
  )

  const executeUserSignedClaim = useCallback(async (lockup: EvmLockup): Promise<HelpMeClaimResponse> => {
    const chainId = Number(lockup.chainId)

    let preimage = lockup.knownPreimage?.preimage ?? null

    if (!preimage) {
      const swap = await fetchBridgeSwapByPreimageHash({ preimageHash: lockup.preimageHash }).catch(() => null)
      preimage = swap?.preimage ?? null
    }

    if (!preimage) {
      const lockupData = await getLockup(lockup.preimageHash, chainId).catch(() => null)
      preimage = lockupData?.data.lockups?.preimage ?? null
    }

    if (!preimage) {
      throw new Error('Preimage not found')
    }

    const chainContracts = LDS_BRIDGE_LOCKUP_CONTRACTS_BY_CHAIN_ID[chainId]
    if (!chainContracts) {
      throw new Error(`Unsupported chain ID: ${chainId}`)
    }

    const isNative = isNativeToken(lockup.tokenAddress)
    const contractAddress = isNative ? chainContracts.coinSwap : chainContracts.erc20Swap
    if (!contractAddress) {
      throw new Error(`No ${isNative ? 'coin swap' : 'ERC20 swap'} contract for chain ${chainId}`)
    }

    try {
      await switchChain(wagmiConfig, { chainId: chainId as any })
    } catch (error) {
      logger.warn('useEvmClaim', 'executeUserSignedClaim', 'Failed to switch chain, continuing anyway', { error })
    }

    const client = await getConnectorClient(wagmiConfig, { chainId: chainId as any })
    const provider = clientToProvider(client, chainId)
    const signer = provider!.getSigner()

    const amount = BigInt(lockup.amount)
    const timelock = Number(lockup.timelock)

    let txHash: string

    if (isNative) {
      txHash = await claimCoinSwap({
        signer,
        contractAddress,
        preimage: prefix0x(preimage),
        amount,
        refundAddress: lockup.refundAddress,
        timelock,
      })
    } else {
      txHash = await claimErc20Swap({
        signer,
        contractAddress,
        tokenAddress: lockup.tokenAddress,
        preimage: prefix0x(preimage),
        amount,
        refundAddress: lockup.refundAddress,
        timelock,
      })
    }

    return { txHash, success: true, pending: false }
  }, [])

  const executeClaim = useCallback(
    async (lockup: EvmLockup): Promise<HelpMeClaimResponse> => {
      const chainId = Number(lockup.chainId) as UniverseChainId
      const isSponsoredAvailable = await getLdsBridgeManager().isSponsoredClaimWalletEligible(chainId)

      if (isSponsoredAvailable) {
        return executeSponsoredClaim(lockup)
      }

      return executeUserSignedClaim(lockup)
    },
    [executeSponsoredClaim, executeUserSignedClaim],
  )

  return { executeClaim }
}
