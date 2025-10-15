import { SwapV2 } from 'components/Icons/SwapV2'
import { MenuItem } from 'components/NavBar/CompanyMenu/Content'
import { useTheme } from 'lib/styled-components'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { useIsBAppsCampaignVisible } from 'services/bappsCampaign/hooks'
import { useIsFirstSqueezerCampaignVisible } from 'services/firstSqueezerCampaign/hooks'
import { Text } from 'ui/src'
import { Compass } from 'ui/src/components/icons/Compass'
import { Pools } from 'ui/src/components/icons/Pools'

export type TabsSection = {
  title: string
  href: string
  isActive?: boolean
  items?: TabsItem[]
  closeMenu?: () => void
  icon?: JSX.Element
}

export type TabsItem = MenuItem & {
  icon?: JSX.Element
}

export const useTabsContent = (): TabsSection[] => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const theme = useTheme()
  const showBAppsTab = useIsBAppsCampaignVisible()
  const showFirstSqueezerTab = useIsFirstSqueezerCampaignVisible()

  const baseItems = [
    {
      title: t('common.swap'),
      href: '/swap',
      isActive: pathname.startsWith('/swap'),
      icon: <SwapV2 fill={theme.accent1} />,
    },
    {
      title: t('common.explore'),
      href: '/explore',
      isActive: pathname.startsWith('/explore') || pathname.startsWith('/nfts'),
      icon: <Compass color="$accent1" size="$icon.20" />,
      items: [
        { label: t('common.tokens'), href: '/explore/tokens', internal: true },
        { label: t('common.pools'), href: '/explore/pools', internal: true },
        {
          label: t('common.transactions'),
          href: '/explore/transactions',
          internal: true,
        },
      ],
    },
    {
      title: t('common.pool'),
      href: '/positions',
      isActive: pathname.startsWith('/positions'),
      icon: <Pools color="$accent1" size="$icon.20" />,
      items: [
        {
          label: t('nav.tabs.viewPositions'),
          href: '/positions',
          internal: true,
        },
        {
          label: t('nav.tabs.createPosition'),
          href: '/positions/create',
          internal: true,
        },
      ],
    },
  ]

  // Collect conditional tabs
  const conditionalTabs: TabsSection[] = []

  // Add bApps tab if campaign is visible
  if (showBAppsTab) {
    conditionalTabs.push({
      title: '₿apps',
      href: '/bapps',
      isActive: pathname.startsWith('/bapps'),
      icon: <Text fontSize={16}>₿</Text>,
    })
  }

  // Add First Squeezer tab if campaign is visible
  if (showFirstSqueezerTab) {
    conditionalTabs.push({
      title: 'First Squeezer',
      href: '/first-squeezer',
      isActive: pathname.startsWith('/first-squeezer'),
      icon: <Text fontSize={16}>🍋</Text>,
    })
  }

  return [...baseItems, ...conditionalTabs]
}
