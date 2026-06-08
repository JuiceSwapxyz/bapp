import { SwapV2 } from 'components/Icons/SwapV2'
import { MenuItem } from 'components/NavBar/CompanyMenu/Content'
import { useCrossChainSwapsEnabled } from 'hooks/useCrossChainSwapsEnabled'
import { useTheme } from 'lib/styled-components'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { useIsBAppsCampaignVisible } from 'services/bappsCampaign/hooks'
import { useIsFirstSqueezerCampaignVisible } from 'services/firstSqueezerCampaign/hooks'
import { useIsJuicerCampaignVisible } from 'services/juicerCampaign/hooks'
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
  const showJuicerTab = useIsJuicerCampaignVisible()
  const crossChainSwapsEnabled = useCrossChainSwapsEnabled()

  const baseItems = [
    {
      title: t('common.swap'),
      href: '/swap',
      isActive: pathname.startsWith('/swap'),
      icon: <SwapV2 fill={theme.accent1} />,
    },
    ...(crossChainSwapsEnabled
      ? [
          {
            title: 'Bridge',
            href: '/swap?inputCurrency=BTC&outputCurrency=cBTC',
            isActive: false,
            icon: <Text fontSize={16}>🌉</Text>,
            items: [
              { label: 'BTC → cBTC', href: '/swap?inputCurrency=BTC&outputCurrency=cBTC', internal: true },
              { label: 'lnBTC → cBTC', href: '/swap?inputCurrency=lnBTC&outputCurrency=cBTC', internal: true },
              {
                label: 'WBTC (ETH) → cBTC',
                href: '/swap?chain=ethereum&inputCurrency=WBTC&outputCurrency=cBTC',
                internal: true,
              },
              {
                label: 'USDT (ETH) → JUSD',
                href: '/swap?chain=ethereum&inputCurrency=USDT&outputCurrency=JUSD&outputChain=citrea',
                internal: true,
              },
              {
                label: 'USDT (Polygon) → JUSD',
                href: '/swap?chain=polygon&inputCurrency=USDT&outputCurrency=JUSD&outputChain=citrea',
                internal: true,
              },
              {
                label: 'USDC (ETH) → JUSD',
                href: '/swap?chain=ethereum&inputCurrency=USDC&outputCurrency=JUSD&outputChain=citrea',
                internal: true,
              },
              { label: 'View Bridge Swaps', href: '/bridge-swaps', internal: true },
            ],
          },
        ]
      : []),
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
    {
      title: t('common.launchpad'),
      href: '/launchpad',
      isActive: pathname.startsWith('/launchpad'),
      icon: <Text fontSize={16}>🚀</Text>,
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

  // Add Juicer NFT tab if campaign is visible (replaces First Squeezer in the navbar).
  // The First Squeezer route still exists for previously eligible wallets, but it
  // is no longer surfaced in the primary navigation.
  if (showJuicerTab || showFirstSqueezerTab) {
    conditionalTabs.push({
      title: 'Juicer NFT',
      href: '/juicer',
      isActive: pathname.startsWith('/juicer'),
      icon: <Text fontSize={16}>🍊</Text>,
    })
  }

  return [...baseItems, ...conditionalTabs]
}
