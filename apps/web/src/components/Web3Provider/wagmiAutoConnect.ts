import { PLAYWRIGHT_CONNECT_ADDRESS } from 'components/Web3Provider/constants'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { isAddress } from 'viem'
import { connect } from 'wagmi/actions'
import { mock } from 'wagmi/connectors'

export function setupWagmiAutoConnect() {
  const isEagerlyConnect = !window.location.search.includes('eagerlyConnect=false')
  const eagerlyConnectAddress = window.location.search.includes('eagerlyConnectAddress=')
    ? window.location.search.split('eagerlyConnectAddress=')[1]
    : undefined

  // Automatically connect if running under Playwright (used by E2E tests)
  // Skip mock auto-connect if REACT_APP_USE_REAL_WALLET is set
  if (isPlaywrightEnv() && isEagerlyConnect && process.env.REACT_APP_USE_REAL_WALLET !== 'true') {
    const connectAddress =
      eagerlyConnectAddress && isAddress(eagerlyConnectAddress)
        ? (eagerlyConnectAddress as `0x${string}`)
        : PLAYWRIGHT_CONNECT_ADDRESS

    // Only connect if we have a valid address
    if (connectAddress && isAddress(connectAddress)) {
      // setTimeout avoids immediate disconnection caused by race condition in wagmi mock connector
      setTimeout(() => {
        connect(wagmiConfig, {
          connector: mock({
            features: {},
            accounts: [connectAddress],
          }),
        })
      }, 1)
    }
  }
}
