import { useAccount } from 'hooks/useAccount'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { endSwitchingChain, startSwitchingChain } from 'state/wallets/reducer'
import { useIsSupportedChainIdCallback } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { ERC20_CHAIN_SWAP_SOURCE_CHAINS } from 'uniswap/src/features/chains/utils'
import { useSwitchChain as useSwitchChainWagmi } from 'wagmi'

export function useSwitchChain() {
  const dispatch = useDispatch()
  const isSupportedChainCallback = useIsSupportedChainIdCallback()
  const { switchChain } = useSwitchChainWagmi()
  const account = useAccount()

  return useCallback(
    (chainId: EVMUniverseChainId) => {
      const isSupportedChain = isSupportedChainCallback(chainId)
      const isCrossChainSwapSource = ERC20_CHAIN_SWAP_SOURCE_CHAINS.includes(chainId)

      if (!isSupportedChain && !isCrossChainSwapSource) {
        throw new Error(`Chain ${chainId} not supported for connector (${account.connector?.name})`)
      }
      if (account.chainId === chainId) {
        // some wallets (e.g. SafeWallet) only support single-chain & will throw error on `switchChain` even if already on the correct chain
        return undefined
      }
      return new Promise<void>((resolve, reject) => {
        dispatch(startSwitchingChain(chainId))
        switchChain(
          { chainId },
          {
            onSettled(_, error) {
              dispatch(endSwitchingChain())
              if (error) {
                reject(error)
              } else {
                resolve()
              }
            },
          },
        )
      })
    },
    [isSupportedChainCallback, account.chainId, account.connector?.name, dispatch, switchChain],
  )
}
