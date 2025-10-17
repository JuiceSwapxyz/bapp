import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { useOnchainDisplayName } from 'uniswap/src/features/accounts/useOnchainDisplayName'
import { shortenAddress } from 'utilities/src/addresses'

// Hook exported for use by other components
export function useWalletDisplay(walletAddress: string | undefined) {
  const displayName = useOnchainDisplayName(walletAddress, {
    showShortenedEns: true,
    includeUnitagSuffix: true,
  })

  return {
    displayName: displayName?.name ?? shortenAddress(walletAddress),
    showUnitagIcon: displayName?.type === DisplayNameType.Unitag,
    showShortAddress: displayName?.type === DisplayNameType.Unitag || displayName?.type === DisplayNameType.ENS,
    shortAddress: shortenAddress(walletAddress),
  }
}

// Embedded wallet feature removed - this modal is no longer used
export function RecentlyConnectedModal() {
  // This component is now a no-op since embedded wallet feature was removed
  return null
}
