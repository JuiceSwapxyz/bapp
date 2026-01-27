import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { setIsTestnetModeEnabled } from 'uniswap/src/features/settings/slice'

export function TestnetModeToggle() {
  const dispatch = useDispatch()
  const { isTestnetModeEnabled } = useEnabledChains()
  const handleToggle = useCallback(() => {
    dispatch(setIsTestnetModeEnabled())
  }, [dispatch])

  return <SettingsToggle title="Testnet mode" isActive={isTestnetModeEnabled} toggle={handleToggle} />
}
