import { createContext, useContext } from 'react'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

/** Optional hook to resolve a token logo URL by address (e.g. from launchpad metadata). */
type CurrencyLogoOverrideHook = (address: string) => string | undefined

export const CurrencyLogoOverrideContext = createContext<CurrencyLogoOverrideHook | null>(null)

const noopLogoOverride: CurrencyLogoOverrideHook = () => undefined

function useCurrencyLogoOverride(): CurrencyLogoOverrideHook {
  return useContext(CurrencyLogoOverrideContext) ?? noopLogoOverride
}

export function useEffectiveLogoUrl(currencyInfo: CurrencyInfo | null | undefined): string | undefined {
  const overrideUrl = useCurrencyLogoOverride()(
    currencyInfo?.currency.isToken ? currencyInfo.currency.address : '',
  )
  return overrideUrl ?? currencyInfo?.logoUrl ?? undefined
}
