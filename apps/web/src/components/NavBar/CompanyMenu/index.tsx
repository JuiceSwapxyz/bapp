import { NavIcon } from 'components/Logo/NavIcon'
import { MobileMenuDrawer } from 'components/NavBar/CompanyMenu/MobileMenuDrawer'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Flex, Popover, Text, useMedia } from 'ui/src'
import { Hamburger } from 'ui/src/components/icons/Hamburger'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export function CompanyMenu() {
  const popoverRef = useRef<Popover>(null)
  const media = useMedia()
  const isLargeScreen = !media.xxl
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const closeMenu = useCallback(() => {
    popoverRef.current?.close()
  }, [popoverRef])
  useEffect(() => closeMenu(), [location, closeMenu])

  if (media.md) {
    // Mobile: Show hamburger menu for navigation
    return (
      <Popover ref={popoverRef} placement="bottom" hoverable={false} stayInFrame allowFlip onOpenChange={setIsOpen}>
        <Popover.Trigger data-testid={TestID.NavCompanyMenu}>
          <Flex
            row
            alignItems="center"
            gap="$gap4"
            p="$spacing8"
            cursor="pointer"
            group
            $platform-web={{ containerType: 'normal' }}
          >
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Flex row alignItems="center" gap="$gap4" data-testid={TestID.NavUniswapLogo}>
                <NavIcon />
                {isLargeScreen && (
                  <Text variant="subheading1" color="$accent1" userSelect="none">
                    JuiceSwap
                  </Text>
                )}
              </Flex>
            </Link>
            <Hamburger size={22} color="$neutral2" cursor="pointer" ml="16px" />
          </Flex>
        </Popover.Trigger>
        <MobileMenuDrawer isOpen={isOpen} closeMenu={closeMenu} />
      </Popover>
    )
  }

  // Desktop: Just show logo, no dropdown
  return (
    <Flex row alignItems="center" gap="$gap4" p="$spacing8" $platform-web={{ containerType: 'normal' }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <Flex row alignItems="center" gap="$gap4" data-testid={TestID.NavUniswapLogo}>
          <NavIcon />
          {isLargeScreen && (
            <Text variant="subheading1" color="$accent1" userSelect="none">
              JuiceSwap
            </Text>
          )}
        </Flex>
      </Link>
    </Flex>
  )
}
