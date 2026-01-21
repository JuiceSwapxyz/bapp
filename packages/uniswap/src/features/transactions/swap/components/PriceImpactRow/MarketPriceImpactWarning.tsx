import { TFunction } from 'i18next'
import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Text, useSporeColors } from 'ui/src'
import { ChartBar } from 'ui/src/components/icons/ChartBar'
import { zIndexes } from 'ui/src/theme'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isUniswapX, TradeRouting } from 'uniswap/src/features/transactions/swap/utils/routing'
import { isWeb } from 'utilities/src/platform'

function getPriceImpactCaption({
  t,
  routing,
  missing,
}: {
  t: TFunction
  routing: TradeRouting
  missing: boolean
}): string {
  if (isUniswapX({ routing })) {
    if (missing) {
      return t('swap.impactOfTrade.uniswapx.missing')
    } else {
      return t('swap.impactOfTrade.uniswapx')
    }
  } else {
    return t('swap.impactOfTrade')
  }
}

export function MarketPriceImpactWarningModal({
  children,
  routing,
  missing,
}: PropsWithChildren<{ routing: TradeRouting; missing: boolean }>): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const caption = getPriceImpactCaption({ t, routing, missing })

  return (
    <WarningInfo
      modalProps={{
        hideIcon: isWeb,
        icon: <ChartBar color="$neutral1" size="$icon.18" />,
        backgroundIconColor: colors.surface2.get(),
        captionComponent: (
          <Text color="$neutral2" textAlign={isWeb ? 'left' : 'center'} variant={isWeb ? 'body4' : 'body2'}>
            {caption}
          </Text>
        ),
        rejectText: t('common.button.close'),
        modalName: ModalName.NetworkFeeInfo,
        severity: WarningSeverity.None,
        title: t('swap.priceImpact'),
        zIndex: zIndexes.popover,
      }}
      tooltipProps={{ text: caption, placement: 'top' }}
      analyticsTitle="Price Impact"
    >
      {children}
    </WarningInfo>
  )
}
