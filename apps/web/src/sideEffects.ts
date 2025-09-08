import { setupWagmiAutoConnect } from 'components/Web3Provider/wagmiAutoConnect'
import { setupi18n } from 'uniswap/src/i18n/i18n-setup-interface'
import { setupVitePreloadErrorHandler } from 'utils/setupVitePreloadErrorHandler'

// adding these so webpack won't tree shake this away, sideEffects was giving trouble
// eslint-disable-next-line no-console
console.log('CLAUDE DEBUG: sideEffects.ts is running!')
setupi18n()
// eslint-disable-next-line no-console
console.log('CLAUDE DEBUG: setupi18n() completed')
setupWagmiAutoConnect()
setupVitePreloadErrorHandler()
