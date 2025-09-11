import { Limit } from 'components/Icons/Limit'
import { SwapV2 } from 'components/Icons/SwapV2'
import { MenuItem } from 'components/NavBar/CompanyMenu/Content'
import { useTheme } from 'lib/styled-components'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { CoinConvert } from 'ui/src/components/icons/CoinConvert'
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

  return [
    {
      title: t('common.trade'),
      href: '/swap',
      isActive: pathname.startsWith('/swap') || pathname.startsWith('/limit') || pathname.startsWith('/send'),
      icon: <CoinConvert color="$accent1" size="$icon.20" />,
      items: [
        {
          label: t('common.swap'),
          icon: <SwapV2 fill={theme.neutral2} />,
          href: '/swap',
          internal: true,
        },
        {
          label: t('swap.limit'),
          icon: <Limit fill={theme.neutral2} />,
          href: '/limit',
          internal: true,
        },
        // OnRamp disabled - Buy and Sell tabs removed
      ],
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
}
