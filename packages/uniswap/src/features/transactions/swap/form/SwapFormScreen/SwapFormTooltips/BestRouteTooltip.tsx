import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { ShieldCheck } from 'ui/src/components/icons/ShieldCheck'
import { UniswapLogo } from 'ui/src/components/icons/UniswapLogo'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import RoutingDiagram from 'uniswap/src/components/RoutingDiagram/RoutingDiagram'
import { TransactionDetailsTooltip as Tooltip } from 'uniswap/src/components/TransactionDetailsTooltip'
import { useSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore'
import { ClassicTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isClassic, isGatewayJusd } from 'uniswap/src/features/transactions/swap/utils/routing'
import getRoutingDiagramEntries from 'uniswap/src/utils/getRoutingDiagramEntries'

export function BestRouteTooltip(): JSX.Element | null {
  const { t } = useTranslation()
  const trade = useSwapTxStore((s) => s.trade)

  // Gateway swaps also use ClassicTrade underneath
  const isClassicOrGateway = trade && (isClassic(trade) || isGatewayJusd(trade))
  const routes = useMemo(
    () => (isClassicOrGateway ? getRoutingDiagramEntries(trade as ClassicTrade) : []),
    [isClassicOrGateway, trade],
  )

  if (!trade || !isClassicOrGateway) {
    return null
  }

  const { inputAmount, outputAmount } = trade

  return (
    <Tooltip.Outer>
      <Tooltip.Header
        title={{
          title: t('common.bestRoute.with', { provider: 'Uniswap API' }),
        }}
        Icon={UniswapLogo}
        iconColor="$accent1"
      />
      <Tooltip.Content>
        <Tooltip.Row>
          <Flex width="100%">
            <RoutingDiagram routes={routes} currencyIn={inputAmount.currency} currencyOut={outputAmount.currency} />
          </Flex>
        </Tooltip.Row>
      </Tooltip.Content>
      <Tooltip.Separator />
      <Tooltip.Description
        // TODO: Re-enable once support.juiceswap.com is configured
        // learnMoreUrl={uniswapUrls.helpArticleUrls.routingSettings}
        text={t('swap.autoRouter')}
      />
    </Tooltip.Outer>
  )
}

export function BestRouteUniswapXTooltip(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Tooltip.Outer>
      <Tooltip.Header
        title={{
          title: t('common.bestRoute.with', { provider: 'UniswapX' }),
          uniswapX: true,
        }}
        Icon={UniswapX}
      />
      <Tooltip.Content>
        <Tooltip.Row>
          <Tooltip.LineItemLabel label={t('swap.settings.protection.title')} />
          <Tooltip.LineItemValue Icon={ShieldCheck} value={t('common.active')} iconColor="$uniswapXPurple" />
        </Tooltip.Row>
      </Tooltip.Content>
      <Tooltip.Description
        // TODO: Re-enable once support.juiceswap.com is configured
        // learnMoreUrl={uniswapUrls.helpArticleUrls.uniswapXInfo}
        text={t('routing.aggregateLiquidity.uniswapx')}
      />
    </Tooltip.Outer>
  )
}
