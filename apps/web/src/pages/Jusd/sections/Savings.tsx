import { Clock, DollarSign, RefreshCw, TrendingUp } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Flex, Text, styled, useSporeColors } from 'ui/src'

import { DataTable } from 'pages/Juice/components/DataTable'
import { FeatureCard } from 'pages/Juice/components/FeatureCard'
import { InfoBox } from 'pages/Juice/components/InfoBox'
import { MetricCard } from 'pages/Juice/components/MetricCard'
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

const MetricsContainer = styled(Flex, {
  flexDirection: 'row',
  gap: '$spacing16',
  flexWrap: 'wrap',
  justifyContent: 'center',
})

const SubSection = styled(Flex, {
  flexDirection: 'column',
  gap: '$spacing16',
})

const CodeBlock = styled(Flex, {
  padding: '$spacing16',
  backgroundColor: '$surface3',
  borderRadius: '$rounded12',
})

const ExampleBox = styled(Flex, {
  flexDirection: 'column',
  padding: '$spacing24',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  gap: '$spacing16',
})

export function Savings() {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const savingsHeaders = [t('jusd.savings.table.feature'), t('jusd.savings.table.description')]
  const savingsRows = [
    [t('jusd.savings.table.noLockup'), t('jusd.savings.table.noLockup.desc')],
    [t('jusd.savings.table.continuous'), t('jusd.savings.table.continuous.desc')],
    [t('jusd.savings.table.compound'), t('jusd.savings.table.compound.desc')],
    [t('jusd.savings.table.governance'), t('jusd.savings.table.governance.desc')],
  ]

  const vaultHeaders = [t('jusd.savings.vault.concept'), t('jusd.savings.table.description')]
  const vaultRows = [
    [t('jusd.savings.vault.shares'), t('jusd.savings.vault.shares.desc')],
    [t('jusd.savings.vault.assets'), t('jusd.savings.vault.assets.desc')],
    [t('jusd.savings.vault.pricePerShare'), t('jusd.savings.vault.pricePerShare.desc')],
    [t('jusd.savings.vault.standard'), t('jusd.savings.vault.standard.desc')],
  ]

  return (
    <Section id="savings">
      <SectionHeader title={t('jusd.savings.title')} subtitle={t('jusd.savings.description')} />

      <MetricsContainer>
        <MetricCard
          value={t('jusd.savings.metric.noLockup.value')}
          label={t('jusd.savings.metric.noLockup.label')}
          description={t('jusd.savings.metric.noLockup.description')}
        />
        <MetricCard
          value={t('jusd.savings.metric.interestRate.value')}
          label={t('jusd.savings.metric.interestRate.label')}
          description={t('jusd.savings.metric.interestRate.description')}
        />
        <MetricCard
          value={t('jusd.savings.metric.vaultToken.value')}
          label={t('jusd.savings.metric.vaultToken.label')}
          description={t('jusd.savings.metric.vaultToken.description')}
        />
      </MetricsContainer>

      <CardsContainer>
        <FeatureCard
          icon={<DollarSign size={24} color={colors.accent1.val} />}
          title={t('jusd.savings.deposit.title')}
          description={t('jusd.savings.deposit.description')}
        />
        <FeatureCard
          icon={<TrendingUp size={24} color={colors.accent1.val} />}
          title={t('jusd.savings.earn.title')}
          description={t('jusd.savings.earn.description')}
        />
        <FeatureCard
          icon={<RefreshCw size={24} color={colors.accent1.val} />}
          title={t('jusd.savings.compound.title')}
          description={t('jusd.savings.compound.description')}
        />
        <FeatureCard
          icon={<Clock size={24} color={colors.accent1.val} />}
          title={t('jusd.savings.withdraw.title')}
          description={t('jusd.savings.withdraw.description')}
        />
      </CardsContainer>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          {t('jusd.savings.features.title')}
        </Text>
        <DataTable headers={savingsHeaders} rows={savingsRows} />
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          {t('jusd.savings.leadrate.title')}
        </Text>
        <Text variant="body2" color="$neutral2">
          {t('jusd.savings.leadrate.description')}
        </Text>
        <CodeBlock>
          <Flex flexDirection="column" gap="$spacing8">
            <Text variant="body3" color="$neutral2" fontFamily="monospace">
              {t('jusd.savings.leadrate.process')}
            </Text>
            <Text variant="body3" color="$neutral2" fontFamily="monospace">
              {t('jusd.savings.leadrate.step1')}
            </Text>
            <Text variant="body3" color="$neutral2" fontFamily="monospace">
              {t('jusd.savings.leadrate.step2')}
            </Text>
            <Text variant="body3" color="$neutral2" fontFamily="monospace">
              {t('jusd.savings.leadrate.step3')}
            </Text>
          </Flex>
        </CodeBlock>
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          {t('jusd.savings.vault.title')}
        </Text>
        <Text variant="body2" color="$neutral2">
          {t('jusd.savings.vault.description')}
        </Text>
        <DataTable headers={vaultHeaders} rows={vaultRows} />
      </SubSection>

      <ExampleBox>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          {t('jusd.savings.example.title')}
        </Text>
        <Flex flexDirection="column" gap="$spacing12">
          <Text variant="body2" color="$neutral2">
            <strong>{t('jusd.savings.example.scenario')}</strong>
          </Text>
          <CodeBlock>
            <Flex flexDirection="column" gap="$spacing8">
              <Text variant="body3" color="$neutral2" fontFamily="monospace">
                {t('jusd.savings.example.daily')}
              </Text>
              <Text variant="body3" color="$neutral2" fontFamily="monospace">
                {t('jusd.savings.example.monthly')}
              </Text>
              <Text variant="body3" color="$accent1" fontFamily="monospace">
                {t('jusd.savings.example.compound')}
              </Text>
            </Flex>
          </CodeBlock>
        </Flex>
      </ExampleBox>

      <InfoBox type="warning">{t('jusd.savings.warning')}</InfoBox>
    </Section>
  )
}
