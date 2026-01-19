import GNOSIS_ICON from 'assets/images/gnosis.png'
import COINBASE_ICON from 'assets/wallets/coinbase-icon.svg'
import METAMASK_ICON from 'assets/wallets/metamask-icon.svg'
import UNIWALLET_ICON from 'assets/wallets/uniswap-wallet-icon.png'
import WALLET_CONNECT_ICON from 'assets/wallets/walletconnect-icon.svg'
import { atomWithStorage, useAtomValue } from 'jotai/utils'
import { CONNECTION_PROVIDER_NAMES } from 'uniswap/src/constants/web3'

export const CONNECTOR_ICON_OVERRIDE_MAP: { [name in string]?: string } = {
  [CONNECTION_PROVIDER_NAMES.METAMASK]: METAMASK_ICON,
  [CONNECTION_PROVIDER_NAMES.UNISWAP_WALLET]: UNIWALLET_ICON,
  [CONNECTION_PROVIDER_NAMES.COINBASE_SDK]: COINBASE_ICON,
  [CONNECTION_PROVIDER_NAMES.WALLET_CONNECT]: WALLET_CONNECT_ICON,
  [CONNECTION_PROVIDER_NAMES.SAFE]: GNOSIS_ICON,
}

// Used to track which connector was used most recently for UI states.
export const recentConnectorIdAtom = atomWithStorage<string | undefined>('recentConnectorId', undefined)
export function useRecentConnectorId() {
  return useAtomValue(recentConnectorIdAtom)
}

// No hardcoded fallback - must be set via env var or left undefined
export const PLAYWRIGHT_CONNECT_ADDRESS = process.env.REACT_APP_PLAYWRIGHT_WALLET_ADDRESS as
  | `0x${string}`
  | undefined
