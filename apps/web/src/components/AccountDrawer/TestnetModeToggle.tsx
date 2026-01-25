import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { useCallback } from 'react'
import { isCitreaMainnetAvailable } from 'uniswap/src/features/chains/utils'

export function TestnetModeToggle() {
  const handleToggle = useCallback(() => {
    // Toggle does nothing - always stays on
  }, [])

  // Disable testnet toggle until CitreaMainnet is available
  const isDisabled = !isCitreaMainnetAvailable()

  return (
    <SettingsToggle
      title="Testnet mode"
      isActive={true}
      toggle={handleToggle}
      disabled={isDisabled}
      description={isDisabled ? 'Available when Citrea Mainnet launches' : undefined}
    />
  )
}
