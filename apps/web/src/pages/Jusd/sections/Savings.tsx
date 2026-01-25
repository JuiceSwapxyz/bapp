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

  const savingsHeaders = ['Feature', 'Description']
  const savingsRows = [
    ['No lockup period', 'Withdraw anytime without penalty'],
    ['Continuous interest', 'Interest accrues every second'],
    ['Compound on refresh', 'Claim interest to earn interest on interest'],
    ['Governance-controlled rate', 'JUICE holders vote on the Leadrate'],
  ]

  const vaultHeaders = ['Concept', 'Description']
  const vaultRows = [
    ['Shares (svJUSD)', 'Represent your proportional ownership of the vault'],
    ['Assets (JUSD)', 'The underlying tokens in the vault'],
    ['Price per Share', 'Increases over time as interest accrues'],
    ['Standard', 'ERC-4626 - compatible with DeFi protocols'],
  ]

  return (
    <Section id="savings">
      <SectionHeader title={t('jusd.savings.title')} subtitle={t('jusd.savings.description')} />

      <MetricsContainer>
        <MetricCard value="0%" label="No Lockup" description="Withdraw anytime" />
        <MetricCard value="Leadrate" label="Interest Rate" description="Governance controlled" />
        <MetricCard value="svJUSD" label="Vault Token" description="ERC-4626 compatible" />
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
          Key Features
        </Text>
        <DataTable headers={savingsHeaders} rows={savingsRows} />
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          The Leadrate System
        </Text>
        <Text variant="body2" color="$neutral2">
          The Leadrate (from German &ldquo;Leitzins&rdquo; - base rate) is the system-wide interest rate that affects
          both savings yields and borrowing costs. It&apos;s controlled by JUICE holders through governance.
        </Text>
        <CodeBlock>
          <Flex flexDirection="column" gap="$spacing8">
            <Text variant="body3" color="$neutral2" fontFamily="monospace">
              Rate Change Process:
            </Text>
            <Text variant="body3" color="$neutral2" fontFamily="monospace">
              1. Qualified JUICE holder (≥2% voting power) proposes new rate
            </Text>
            <Text variant="body3" color="$neutral2" fontFamily="monospace">
              2. 7-day timelock period
            </Text>
            <Text variant="body3" color="$neutral2" fontFamily="monospace">
              3. Anyone can execute the change after timelock
            </Text>
          </Flex>
        </CodeBlock>
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          ERC-4626 Savings Vault (svJUSD)
        </Text>
        <Text variant="body2" color="$neutral2">
          For DeFi integration, JuiceDollar provides an ERC-4626 compatible vault. This standard interface allows
          seamless integration with other DeFi protocols.
        </Text>
        <DataTable headers={vaultHeaders} rows={vaultRows} />
      </SubSection>

      <ExampleBox>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          Interest Calculation Example
        </Text>
        <Flex flexDirection="column" gap="$spacing12">
          <Text variant="body2" color="$neutral2">
            <strong>Scenario:</strong> Deposit 10,000 JUSD at 4% annual Leadrate for 30 days
          </Text>
          <CodeBlock>
            <Flex flexDirection="column" gap="$spacing8">
              <Text variant="body3" color="$neutral2" fontFamily="monospace">
                Daily interest = 10,000 × (40,000 / 1,000,000) / 365 = 1.096 JUSD
              </Text>
              <Text variant="body3" color="$neutral2" fontFamily="monospace">
                30-day interest = 1.096 × 30 = 32.88 JUSD
              </Text>
              <Text variant="body3" color="$accent1" fontFamily="monospace">
                With daily compounding ≈ 32.96 JUSD
              </Text>
            </Flex>
          </CodeBlock>
        </Flex>
      </ExampleBox>

      <InfoBox type="warning">
        Interest is paid from the equity pool. In extreme scenarios with depleted equity, interest payments may be
        capped. Unlike traditional bank deposits, there is no deposit insurance.
      </InfoBox>
    </Section>
  )
}
