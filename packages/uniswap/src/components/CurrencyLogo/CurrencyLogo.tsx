import { iconSizes } from 'ui/src/theme'
import { useEffectiveLogoUrl } from 'uniswap/src/contexts/CurrencyLogoOverrideContext'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

interface CurrencyLogoProps {
  currencyInfo: Maybe<CurrencyInfo>
  size?: number
  hideNetworkLogo?: boolean
  networkLogoBorderWidth?: number
}

export const STATUS_RATIO = 0.4

export function CurrencyLogo({
  currencyInfo,
  size = iconSizes.icon40,
  hideNetworkLogo,
  networkLogoBorderWidth,
}: CurrencyLogoProps): JSX.Element | null {
  const effectiveLogoUrl = useEffectiveLogoUrl(currencyInfo)

  if (!currencyInfo) {
    return null
  }

  const { currency } = currencyInfo
  const { chainId, symbol, name } = currency

  return (
    <TokenLogo
      chainId={chainId}
      hideNetworkLogo={hideNetworkLogo}
      name={name}
      networkLogoBorderWidth={networkLogoBorderWidth}
      size={size}
      symbol={symbol}
      url={effectiveLogoUrl}
    />
  )
}
