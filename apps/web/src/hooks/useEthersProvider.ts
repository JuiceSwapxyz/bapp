import { Web3Provider } from '@ethersproject/providers'
import { useAccount } from 'hooks/useAccount'
import { useMemo } from 'react'
import type { Chain, Client, Transport } from 'viem'
import { useClient, useConnectorClient } from 'wagmi'

const providers = new WeakMap<Client, Web3Provider>()

export function clientToProvider(client?: Client<Transport, Chain>, chainId?: number) {
  if (!client) {
    return undefined
  }
  const { chain } = client

  const ensAddress = chain.contracts?.ensRegistry?.address
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const network = chain
    ? {
        chainId: chain.id,
        name: chain.name,
        ensAddress,
      }
    : chainId
      ? { chainId, name: 'Unsupported' }
      : undefined
  if (!network) {
    return undefined
  }

  if (providers.has(client)) {
    return providers.get(client)
  } else {
    // Convert viem client to EIP-1193 provider for ethers Web3Provider
    // The client.request method is EIP-1193 compatible, but we need to wrap it
    // to handle wallets like Rabby that require proper EIP-1193 provider format
    const eip1193Provider = {
      request: client.request.bind(client),
    }
    const provider = new Web3Provider(eip1193Provider, network)
    providers.set(client, provider)
    return provider
  }
}

/** Hook to convert a viem Client to an ethers.js Provider with a default disconnected Network fallback. */
export function useEthersProvider({ chainId }: { chainId?: number } = {}) {
  const account = useAccount()
  const { data: client } = useConnectorClient({ chainId })
  const disconnectedClient = useClient({ chainId })
  return useMemo(
    () => clientToProvider(account.chainId !== chainId ? disconnectedClient : client ?? disconnectedClient, chainId),
    [account.chainId, chainId, client, disconnectedClient],
  )
}

/** Hook to convert a connected viem Client to an ethers.js Provider. */
export function useEthersWeb3Provider({ chainId }: { chainId?: number } = {}) {
  const { data: client } = useConnectorClient({ chainId })
  return useMemo(() => clientToProvider(client, chainId), [chainId, client])
}
