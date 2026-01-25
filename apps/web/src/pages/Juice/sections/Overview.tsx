import { GitBranch, PieChart, Shield } from 'react-feather'
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

  const comparisonHeaders = ['Aspect', 'JUSD', 'JUICE']
  const comparisonRows = [
    ['Type', 'Stablecoin', 'Equity Token'],
    ['Value Peg', 'US Dollar', 'Protocol Equity'],
    ['Function', 'Payments, Store of Value', 'Governance, Capital Shares'],
    ['Supply', 'Dynamic (Minting/Burning)', 'Dynamic (Investment/Redemption)'],
    ['Fee Beneficiary', '-', 'JUICE Holders'],
  ]

  const cypherpunkHeaders = ['Cypherpunk Ideal', 'JuiceDollar Implementation']
  const cypherpunkRows = [
    ['Decentralization', 'No admin keys, no upgradeable contracts, no central authority'],
    ['Trustlessness', 'Oracle-free design - no reliance on external price feeds'],
    ['Permissionlessness', 'Anyone can propose new collateral types or mint JUSD'],
    ['Self-Custody', 'Users hold their own collateral in position contracts'],
    ['Code as Law', 'Smart contracts enforce rules, not institutions'],
    ['Censorship Resistance', 'No entity can block minting or freeze accounts'],
  ]

  return (
    <Section id="overview">
      <SectionHeader title={t('juice.overview.title')} subtitle={t('juice.overview.description')} />

      <CardsContainer>
        <FeatureCard
          icon={<PieChart size={24} color={colors.accent1.val} />}
          title={t('juice.overview.equity.title')}
          description={t('juice.overview.equity.description')}
        />
        <FeatureCard
          icon={<GitBranch size={24} color={colors.accent1.val} />}
          title={t('juice.overview.decentralized.title')}
          description={t('juice.overview.decentralized.description')}
        />
        <FeatureCard
          icon={<Shield size={24} color={colors.accent1.val} />}
          title={t('juice.overview.oracleFree.title')}
          description={t('juice.overview.oracleFree.description')}
        />
      </CardsContainer>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          JUICE vs JUSD
        </Text>
        <DataTable headers={comparisonHeaders} rows={comparisonRows} />
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          <Trans i18nKey="juice.overview.cypherpunk.title" />
        </Text>
        <Text variant="body2" color="$neutral2">
          <Trans i18nKey="juice.overview.cypherpunk.description" />
        </Text>
        <DataTable headers={cypherpunkHeaders} rows={cypherpunkRows} />
        <QuoteBox>
          <Text variant="body2" color="$neutral2" fontStyle="italic">
            &quot;We the Cypherpunks are dedicated to building anonymous systems.&quot; - Eric Hughes, A
            Cypherpunk&apos;s Manifesto (1993)
          </Text>
        </QuoteBox>
      </SubSection>
    </Section>
  )
}
