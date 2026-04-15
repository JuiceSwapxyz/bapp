import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
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

const CONTRACT_ADDRESSES: Partial<Record<number, { coinSwap?: string; erc20Swap: string }>> = {
  4114: {
    coinSwap: '0xFD92F846fe6E7d08d28D6A88676BB875E5D906ab',
    erc20Swap: '0x7397F25F230f7d5A83c18e1B68b32511bf35F860',
  },
  5115: {
    coinSwap: '0xd02731fD8c5FDD53B613A699234FAd5EE8851B65',
    erc20Swap: '0xf2e019a371e5Fd32dB2fC564Ad9eAE9E433133cc',
  },
  137: {
    erc20Swap: '0x2E21F58Da58c391F110467c7484EdfA849C1CB9B',
  },
  80002: {
    erc20Swap: '0x2E21F58Da58c391F110467c7484EdfA849C1CB9B',
  },
  1: {
    erc20Swap: '0x2E21F58Da58c391F110467c7484EdfA849C1CB9B',
  },
}

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

    const chainContracts = CONTRACT_ADDRESSES[chainId]
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
