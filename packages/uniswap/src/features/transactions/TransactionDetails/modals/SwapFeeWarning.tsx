import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Text, useSporeColors } from 'ui/src'
import { AlertCircleFilled } from 'ui/src/components/icons/AlertCircleFilled'
import { zIndexes } from 'ui/src/theme'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import { isWeb } from 'utilities/src/platform'

export function SwapFeeWarning({ noFee, children }: PropsWithChildren<{ noFee: boolean }>): JSX.Element {
  const priceUXEnabled = usePriceUXEnabled()
  const colors = useSporeColors()
  const { t } = useTranslation()

  const caption = priceUXEnabled
    ? t('fee.uniswap.description')
    : noFee
      ? t('swap.warning.uniswapFee.message.default')
      : t('swap.warning.uniswapFee.message.included')

  return (
    <WarningInfo
      modalProps={{
        icon: <AlertCircleFilled color="$neutral1" size="$icon.20" />,
        backgroundIconColor: colors.surface2.get(),
        captionComponent: (
          <Text color="$neutral2" textAlign={isWeb ? 'left' : 'center'} variant={isWeb ? 'body4' : 'body2'}>
            {caption}
          </Text>
        ),
        rejectText: t('common.button.close'),
        modalName: ModalName.NetworkFeeInfo,
        severity: WarningSeverity.None,
        title: t('swap.warning.uniswapFee.title'),
        zIndex: zIndexes.popover,
      }}
      tooltipProps={{ text: caption, placement: 'top' }}
      analyticsTitle="Swap fee"
    >
      {children}
    </WarningInfo>
  )
}
