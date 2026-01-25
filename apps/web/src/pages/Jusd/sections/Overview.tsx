import { DollarSign, GitBranch, Shield } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text, styled, useSporeColors } from 'ui/src'

import { DataTable } from 'pages/Juice/components/DataTable'
import { FeatureCard } from 'pages/Juice/components/FeatureCard'
import { SectionHeader } from 'pages/Juice/components/SectionHeader'

const Section = styled(Flex, {
  flexDirection: 'column',
  gap: '$spacing32',
  paddingVertical: '$spacing32',
})

const CardsContainer = styled(Flex, {
  flexDirection: 'row',
  gap: '$spacing16',
  flexWrap: 'wrap',
})

const SubSection = styled(Flex, {
  flexDirection: 'column',
  gap: '$spacing16',
})

const QuoteBox = styled(Flex, {
  padding: '$spacing20',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  borderLeftWidth: 4,
  borderLeftColor: '$accent1',
})

export function Overview() {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const comparisonHeaders = [t('jusd.overview.comparison.aspect'), 'JUSD', 'JUICE']
  const comparisonRows = [
    [
      t('jusd.overview.comparison.type'),
      t('jusd.overview.comparison.type.jusd'),
      t('jusd.overview.comparison.type.juice'),
    ],
    [
      t('jusd.overview.comparison.valuePeg'),
      t('jusd.overview.comparison.valuePeg.jusd'),
      t('jusd.overview.comparison.valuePeg.juice'),
    ],
    [
      t('jusd.overview.comparison.function'),
      t('jusd.overview.comparison.function.jusd'),
      t('jusd.overview.comparison.function.juice'),
    ],
    [
      t('jusd.overview.comparison.supply'),
      t('jusd.overview.comparison.supply.jusd'),
      t('jusd.overview.comparison.supply.juice'),
    ],
    [
      t('jusd.overview.comparison.yield'),
      t('jusd.overview.comparison.yield.jusd'),
      t('jusd.overview.comparison.yield.juice'),
    ],
  ]

  const cypherpunkHeaders = [
    t('jusd.overview.cypherpunk.table.ideal'),
    t('jusd.overview.cypherpunk.table.implementation'),
  ]
  const cypherpunkRows = [
    [t('jusd.overview.cypherpunk.decentralization'), t('jusd.overview.cypherpunk.decentralization.desc')],
    [t('jusd.overview.cypherpunk.trustlessness'), t('jusd.overview.cypherpunk.trustlessness.desc')],
    [t('jusd.overview.cypherpunk.permissionlessness'), t('jusd.overview.cypherpunk.permissionlessness.desc')],
    [t('jusd.overview.cypherpunk.selfCustody'), t('jusd.overview.cypherpunk.selfCustody.desc')],
    [t('jusd.overview.cypherpunk.codeAsLaw'), t('jusd.overview.cypherpunk.codeAsLaw.desc')],
    [t('jusd.overview.cypherpunk.censorshipResistance'), t('jusd.overview.cypherpunk.censorshipResistance.desc')],
  ]

  return (
    <Section id="overview">
      <SectionHeader title={t('jusd.overview.title')} subtitle={t('jusd.overview.description')} />

      <CardsContainer>
        <FeatureCard
          icon={<DollarSign size={24} color={colors.accent1.val} />}
          title={t('jusd.overview.stablecoin.title')}
          description={t('jusd.overview.stablecoin.description')}
        />
        <FeatureCard
          icon={<GitBranch size={24} color={colors.accent1.val} />}
          title={t('jusd.overview.oracleFree.title')}
          description={t('jusd.overview.oracleFree.description')}
        />
        <FeatureCard
          icon={<Shield size={24} color={colors.accent1.val} />}
          title={t('jusd.overview.overcollateralized.title')}
          description={t('jusd.overview.overcollateralized.description')}
        />
      </CardsContainer>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          {t('jusd.overview.comparison.title')}
        </Text>
        <DataTable headers={comparisonHeaders} rows={comparisonRows} />
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          <Trans i18nKey="jusd.overview.cypherpunk.title" />
        </Text>
        <Text variant="body2" color="$neutral2">
          <Trans i18nKey="jusd.overview.cypherpunk.description" />
        </Text>
        <DataTable headers={cypherpunkHeaders} rows={cypherpunkRows} />
        <QuoteBox>
          <Text variant="body2" color="$neutral2" fontStyle="italic">
            {t('jusd.overview.cypherpunk.quote')}
          </Text>
        </QuoteBox>
      </SubSection>
    </Section>
  )
}
