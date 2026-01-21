import type { PropsWithChildren } from 'react'
import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text, UniswapXText } from 'ui/src'
import { OrderRouting } from 'ui/src/components/icons/OrderRouting'
import { zIndexes } from 'ui/src/theme'
import { RouterLabel } from 'uniswap/src/components/RouterLabel/RouterLabel'
import RoutingDiagram from 'uniswap/src/components/RoutingDiagram/RoutingDiagram'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useUSDValueOfGasFee } from 'uniswap/src/features/gas/hooks'
import type { GasFeeResult } from 'uniswap/src/features/gas/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import {
  BestRouteTooltip,
  BestRouteUniswapXTooltip,
} from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormTooltips/BestRouteTooltip'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import { useSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore'
import { ClassicTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isClassic, isGatewayJusd, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import getRoutingDiagramEntries from 'uniswap/src/utils/getRoutingDiagramEntries'
import { NumberType } from 'utilities/src/format/types'
import { isWeb } from 'utilities/src/platform'

export function RoutingInfo({
  chainId,
  gasFee,
}: PropsWithChildren<{
  chainId: UniverseChainId
  gasFee: GasFeeResult
}>): JSX.Element | null {
  const priceUxEnabled = usePriceUXEnabled()
  const { t } = useTranslation()
  const trade = useSwapTxStore((s) => s.trade)
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { value: gasFeeUSD } = useUSDValueOfGasFee(chainId, gasFee.displayValue ?? undefined)
  const gasFeeFormatted =
    gasFeeUSD !== undefined ? convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice) : undefined

  // Gateway swaps also use ClassicTrade underneath
  const isClassicOrGateway = trade && (isClassic(trade) || isGatewayJusd(trade))
  const routes = useMemo(
    () => (isClassicOrGateway ? getRoutingDiagramEntries(trade as ClassicTrade) : []),
    [isClassicOrGateway, trade],
  )

  const caption = useMemo(() => {
    if (!trade) {
      return null
    }

    const textVariant = isWeb ? 'body4' : 'body2'
    const textAlign = isWeb ? 'left' : 'center'

    if (isUniswapX(trade)) {
      return (
        <Text variant={textVariant} textAlign={textAlign} color="$neutral2">
          <Trans
            i18nKey="uniswapX.aggregatesLiquidity"
            components={{
              logo: (
                <>
                  <UniswapXText variant={textVariant}>UniswapX</UniswapXText>
                </>
              ),
            }}
          />
        </Text>
      )
    }

    if (isClassic(trade) || isGatewayJusd(trade)) {
      return (
        <Flex gap="$spacing12">
          {isWeb && (
            <RoutingDiagram
              routes={routes}
              currencyIn={trade.inputAmount.currency}
              currencyOut={trade.outputAmount.currency}
            />
          )}
          <Text variant={textVariant} textAlign={textAlign} color="$neutral2">
            {gasFeeFormatted && t('swap.bestRoute.cost', { gasPrice: gasFeeFormatted })}
            {t('swap.route.optimizedGasCost')}
          </Text>
        </Flex>
      )
    }
    return null
  }, [t, trade, routes, gasFeeFormatted])

  const InfoButton = useMemo(() => {
    return null
  }, [])

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <WarningInfo
        infoButton={priceUxEnabled ? null : InfoButton}
        modalProps={{
          modalName: ModalName.SwapReview,
          captionComponent: caption,
          rejectText: t('common.button.close'),
          icon: <OrderRouting color="$neutral1" size="$icon.24" />,
          severity: WarningSeverity.None,
          title: t('swap.tradeRoutes'),
          zIndex: zIndexes.popover,
        }}
        tooltipProps={{
          text:
            priceUxEnabled && trade ? isUniswapX(trade) ? <BestRouteUniswapXTooltip /> : <BestRouteTooltip /> : caption,
          placement: 'top',
          maxWidth: priceUxEnabled ? 300 : isClassicOrGateway ? 400 : undefined,
        }}
        analyticsTitle="Order routing"
      >
        <Flex centered row gap="$spacing4">
          <Text color="$neutral2" variant="body3">
            {priceUxEnabled ? t('common.bestRoute') : t('swap.orderRouting')}
          </Text>
        </Flex>
      </WarningInfo>
      <Flex row shrink justifyContent="flex-end">
        <Text adjustsFontSizeToFit color="$neutral1" variant="body3">
          <RouterLabel />
        </Text>
      </Flex>
    </Flex>
  )
}
