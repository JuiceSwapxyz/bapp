import { MenuLink } from 'components/NavBar/CompanyMenu/MenuDropdown'
import { NavDropdown } from 'components/NavBar/NavDropdown'
import { useTabsContent } from 'components/NavBar/Tabs/TabsContent'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

// eslint-disable-next-line import/no-unused-modules
export function MobileMenuDrawer({ isOpen, closeMenu }: { isOpen: boolean; closeMenu: () => void }) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  const tabsContent = useTabsContent()

  return (
    <NavDropdown dropdownRef={dropdownRef} isOpen={isOpen} dataTestId={TestID.CompanyMenuMobileDrawer}>
      <Flex pt="$spacing12" pb="$spacing32" px="$spacing24">
        <Flex gap="$spacing24">
          <Flex gap="10px">
            <Text variant="body4" color="$neutral2" mb="$spacing8">
              {t('common.app')}
            </Text>
            <Flex gap="10px">
              {tabsContent.map((tab, index) => (
                <MenuLink
                  key={`${tab.title}_${index}}`}
                  label={tab.title}
                  href={tab.href}
                  internal
                  closeMenu={closeMenu}
                  icon={tab.icon}
                />
              ))}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </NavDropdown>
  )
}
