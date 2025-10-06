import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { LongText } from 'src/components/text/LongText'
import { Flex, Text, useSporeColors } from 'ui/src'
import { ChartBar, ChartPie, ChartPyramid, TrendDown, TrendUp } from 'ui/src/components/icons'
import { useTokenProjectDescriptionQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import {
  useTokenBasicInfoPartsFragment,
  useTokenBasicProjectPartsFragment,
  useTokenMarketPartsFragment,
  useTokenProjectMarketsPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'

const StatsRow = memo(function _StatsRow({
  label,
  children,
  statsIcon,
}: {
  label: string
  children: JSX.Element
  statsIcon: JSX.Element
}): JSX.Element {
  return (
    <Flex row justifyContent="space-between" pl="$spacing2">
      <Flex row alignItems="center" flex={1} gap="$spacing8" justifyContent="flex-start">
        <Flex>{statsIcon}</Flex>
        <Flex flex={1}>
          <Text color="$neutral1" variant="body2">
            {label}
          </Text>
        </Flex>
      </Flex>
      <Flex>{children}</Flex>
    </Flex>
  )
})

const TokenDetailsMarketData = memo(function _TokenDetailsMarketData(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const defaultTokenColor = colors.neutral3.get()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const { currencyId, tokenColor } = useTokenDetailsContext()

  const tokenMarket = useTokenMarketPartsFragment({ currencyId }).data.market
  const projectMarkets = useTokenProjectMarketsPartsFragment({ currencyId }).data.project?.markets

  const price = projectMarkets?.[0]?.price?.value || tokenMarket?.price?.value || undefined
  const marketCap = projectMarkets?.[0]?.marketCap?.value
  const volume = tokenMarket?.volume?.value
  const rawPriceHigh52W = projectMarkets?.[0]?.priceHigh52W?.value || tokenMarket?.priceHigh52W?.value || undefined
  const rawPriceLow52W = projectMarkets?.[0]?.priceLow52W?.value || tokenMarket?.priceLow52W?.value || undefined

  // Use current price for 52w high/low if it exceeds the bounds
  const priceHight52W =
    price !== undefined && rawPriceHigh52W !== undefined ? Math.max(price, rawPriceHigh52W) : rawPriceHigh52W
  const priceLow52W =
    price !== undefined && rawPriceLow52W !== undefined ? Math.min(price, rawPriceLow52W) : rawPriceLow52W
  const fullyDilutedValuation = projectMarkets?.[0]?.fullyDilutedValuation?.value

  return (
    <Flex gap="$spacing8">
      <StatsRow
        label={t('token.stats.marketCap')}
        statsIcon={<ChartPie color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
      >
        <Text textAlign="right" variant="body2">
          {convertFiatAmountFormatted(marketCap, NumberType.FiatTokenStats)}
        </Text>
      </StatsRow>

      <StatsRow
        label={t('token.stats.fullyDilutedValuation')}
        statsIcon={<ChartPyramid color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
      >
        <Text textAlign="right" variant="body2">
          {convertFiatAmountFormatted(fullyDilutedValuation, NumberType.FiatTokenStats)}
        </Text>
      </StatsRow>

      <StatsRow
        label={t('token.stats.volume')}
        statsIcon={<ChartBar color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
      >
        <Text textAlign="right" variant="body2">
          {convertFiatAmountFormatted(volume, NumberType.FiatTokenStats)}
        </Text>
      </StatsRow>

      <StatsRow
        label={t('token.stats.priceHighYear')}
        statsIcon={<TrendUp color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
      >
        <Text textAlign="right" variant="body2">
          {convertFiatAmountFormatted(priceHight52W, NumberType.FiatTokenDetails)}
        </Text>
      </StatsRow>

      <StatsRow
        label={t('token.stats.priceLowYear')}
        statsIcon={<TrendDown color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
      >
        <Text textAlign="right" variant="body2">
          {convertFiatAmountFormatted(priceLow52W, NumberType.FiatTokenDetails)}
        </Text>
      </StatsRow>
    </Flex>
  )
})

export const TokenDetailsStats = memo(function _TokenDetailsStats(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const { currencyId, tokenColor } = useTokenDetailsContext()

  const onChainData = useTokenBasicInfoPartsFragment({ currencyId }).data
  const offChainData = useTokenBasicProjectPartsFragment({ currencyId }).data.project

  const descriptions = useTokenProjectDescriptionQuery({
    variables: {
      ...currencyIdToContractInput(currencyId),
      includeSpanish: false,
      includeFrench: false,
      includeJapanese: false,
      includePortuguese: false,
      includeVietnamese: false,
      includeChineseSimplified: false,
      includeChineseTraditional: false,
    },
    fetchPolicy: 'cache-and-network',
    returnPartialData: true,
  }).data?.token?.project

  const description = descriptions?.description

  const name = offChainData?.name ?? onChainData.name
  const currentDescription = description

  return (
    <Flex gap="$spacing24">
      {currentDescription && (
        <Flex gap="$spacing4">
          {name && (
            <Text color="$neutral2" testID={TestID.TokenDetailsAboutHeader} variant="subheading2">
              {t('token.stats.section.about', { token: name })}
            </Text>
          )}

          <Flex gap="$spacing16">
            <LongText
              gap="$spacing2"
              initialDisplayedLines={5}
              linkColor={tokenColor ?? colors.neutral1.val}
              readMoreOrLessColor={tokenColor ?? colors.neutral2.val}
              text={currentDescription.trim()}
            />
          </Flex>
        </Flex>
      )}

      <Flex gap="$spacing4">
        <Text color="$neutral2" variant="subheading2">
          {t('token.stats.title')}
        </Text>

        <TokenDetailsMarketData />
      </Flex>
    </Flex>
  )
})
