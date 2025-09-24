import { NavDropdown, NavDropdownDefaultWrapper } from 'components/NavBar/NavDropdown/index'
import { NavIcon } from 'components/NavBar/NavIcon'
import { CurrencySettings } from 'components/NavBar/PreferencesMenu/Currency'
import { PreferenceSettings } from 'components/NavBar/PreferencesMenu/Preferences'
import { PreferencesView } from 'components/NavBar/PreferencesMenu/shared'
import { useCallback, useState } from 'react'
import { AnimateTransition, Popover, useMedia } from 'ui/src'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'

export function getSettingsViewIndex(view: PreferencesView) {
  if (view === PreferencesView.SETTINGS) {
    return 0
  } else {
    return 1
  }
}

export function PreferenceMenu() {
  const media = useMedia()

  const [settingsView, setSettingsView] = useState<PreferencesView>(PreferencesView.SETTINGS)
  const [isOpen, setIsOpen] = useState(false)
  const handleExitMenu = useCallback(() => setSettingsView(PreferencesView.SETTINGS), [setSettingsView])
  const onOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open)
      if (!open) {
        handleExitMenu()
      }
    },
    [handleExitMenu, setIsOpen],
  )

  return (
    <Popover placement="bottom" stayInFrame allowFlip onOpenChange={onOpenChange}>
      <Popover.Trigger>
        <NavIcon isActive={isOpen}>
          <MoreHorizontal size={20} color="$neutral2" cursor="pointer" />
        </NavIcon>
      </Popover.Trigger>
      <NavDropdown isOpen={isOpen} minWidth={325} padded mr={12}>
        <NavDropdownDefaultWrapper>
          <AnimateTransition
            currentIndex={getSettingsViewIndex(settingsView)}
            animationType={settingsView === PreferencesView.SETTINGS ? 'forward' : 'backward'}
          >
            <PreferenceSettings
              showThemeLabel={!media.sm}
              setSettingsView={(view: PreferencesView) => setSettingsView(view)}
            />
            <CurrencySettings onExitMenu={handleExitMenu} />
          </AnimateTransition>
        </NavDropdownDefaultWrapper>
      </NavDropdown>
    </Popover>
  )
}
