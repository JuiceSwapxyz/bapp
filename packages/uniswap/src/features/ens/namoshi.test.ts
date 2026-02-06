import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { createEthersProvider } from 'uniswap/src/features/providers/createEthersProvider'
import { CITREA_MAINNET_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/citrea-mainnet'

describe('Namoshi ENS Configuration', () => {
    it('should have ENS registry configured in chain info', () => {
        expect(CITREA_MAINNET_CHAIN_INFO.contracts?.ensRegistry?.address).toBeDefined()
        expect(CITREA_MAINNET_CHAIN_INFO.contracts?.ensRegistry?.address).toBe('0x9fA2e2370dF8014EE485172bF79d10D6756034A8')
    })

    it('should create a provider with custom ENS address for Citrea Mainnet', () => {
        const provider = createEthersProvider({ chainId: UniverseChainId.CitreaMainnet })
        expect(provider).toBeDefined()
        if (!provider) return

        // accessing internal network property to verify ensAddress
        // @ts-ignore
        const network = provider.network
        expect(network.ensAddress).toBe('0x9fA2e2370dF8014EE485172bF79d10D6756034A8')
    })

    it('should resolve nemo.citrea to a valid address', async () => {
        const provider = createEthersProvider({ chainId: UniverseChainId.CitreaMainnet })
        expect(provider).toBeDefined()
        if (!provider) return

        const address = await provider.resolveName('nemo.citrea')
        // Check that the address is a valid Ethereum address format
        // Note: The actual address may change if the domain is transferred
        expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    }, 15000) // increase timeout for network request
})
