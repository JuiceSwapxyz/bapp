import { useTranslation } from 'react-i18next'
import { TransactionDetailsTooltip as Tooltip } from 'uniswap/src/components/TransactionDetailsTooltip'

export function LargePriceDifferenceTooltip(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Tooltip.Outer>
      <Tooltip.Header title={{ title: t('large.price.difference') }} />
      <Tooltip.Description
        text={t('large.price.difference.tooltip')}
        // TODO: Re-enable once support.juiceswap.xyz is configured
        // learnMoreUrl={uniswapUrls.helpArticleUrls.priceImpact}
      />
    </Tooltip.Outer>
  )
}
