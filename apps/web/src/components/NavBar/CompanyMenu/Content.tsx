import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export interface MenuItem {
  label: string
  href: string
  internal?: boolean
  overflow?: boolean
  closeMenu?: () => void
  icon?: React.ReactNode
  body?: string
}

export interface MenuSection {
  title: string
  items: MenuItem[]
  closeMenu?: () => void
}

export enum MenuSectionTitle {
  Products = 'Products',
  Protocol = 'Protocol',
  Company = 'Company',
  NeedHelp = 'NeedHelp',
}


export const useMenuContent = (args?: {
  keys?: MenuSectionTitle[]
}): Partial<{ [key in MenuSectionTitle]: MenuSection }> => {
  const { t } = useTranslation()
  const { keys } = args || {}

  return useMemo(() => {
    const menuContent = {
      [MenuSectionTitle.Products]: {
        title: t('common.products'),
        items: [],
      },
      [MenuSectionTitle.Protocol]: {
        title: t('common.protocol'),
        items: [
          { label: t('common.developers'), href: 'https://docs.juiceswap.xyz/' },
        ],
      },
      [MenuSectionTitle.Company]: {
        title: t('common.company'),
        items: [],
      },
      [MenuSectionTitle.NeedHelp]: {
        title: t('common.needHelp'),
        items: [],
      },
    }

    if (keys) {
      const filteredEntries = Object.entries(menuContent).filter(([key]) => keys.includes(key as MenuSectionTitle))
      return Object.fromEntries(filteredEntries) as Partial<{ [key in MenuSectionTitle]: MenuSection }>
    }

    return menuContent
  }, [t, keys])
}
