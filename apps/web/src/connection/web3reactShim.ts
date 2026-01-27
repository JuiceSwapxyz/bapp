import { useAccount } from 'hooks/useAccount'
import { useEthersProvider } from 'hooks/useEthersProvider'
import { useMemo } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'

// eslint-disable-next-line import/no-unused-modules -- shim is used via a build alias in craco.config.cjs
export function useWeb3React() {
  const account = useAccount()
  const { defaultChainId } = useEnabledChains()
  const provider = useEthersProvider({ chainId: account.chainId })

  return useMemo(
    () => ({
      account: account.address,
      chainId: account.chainId ?? defaultChainId,
      provider,
    }),
    [account.address, account.chainId, defaultChainId, provider],
  )
}
