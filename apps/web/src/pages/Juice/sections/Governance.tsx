import { AlertTriangle, Clock, Users, XOctagon } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Flex, Text, styled, useSporeColors } from 'ui/src'

import { DataTable } from 'pages/Juice/components/DataTable'
import { FeatureCard } from 'pages/Juice/components/FeatureCard'
import { InfoBox } from 'pages/Juice/components/InfoBox'
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

const CodeBlock = styled(Flex, {
  padding: '$spacing16',
  backgroundColor: '$surface3',
  borderRadius: '$rounded12',
})

const ComparisonBox = styled(Flex, {
  flexDirection: 'row',
  gap: '$spacing16',
  flexWrap: 'wrap',
})

const ComparisonColumn = styled(Flex, {
  flex: 1,
  minWidth: 250,
  flexDirection: 'column',
  padding: '$spacing16',
  backgroundColor: '$surface2',
  borderRadius: '$rounded12',
  gap: '$spacing8',
})

export function Governance() {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const delegationExample = [
    ['Alice (1%)', 'delegates to Bob (1.5%)', 'delegates to Charles (2%)'],
    ['Alice has 1% voting power', 'Bob has 2.5% (his 1.5% + Alice)', 'Charles has 4.5% (his 2% + Bob)'],
  ]

  return (
    <Section id="governance">
      <SectionHeader title={t('juice.governance.title')} subtitle={t('juice.governance.description')} />

      <CardsContainer>
        <FeatureCard
          icon={<XOctagon size={24} color={colors.accent1.val} />}
          title={t('juice.governance.vetoModel.title')}
          description={t('juice.governance.vetoModel.description')}
        />
        <FeatureCard
          icon={<Clock size={24} color={colors.accent1.val} />}
          title={t('juice.governance.timeWeighted.title')}
          description={t('juice.governance.timeWeighted.description')}
        />
        <FeatureCard
          icon={<Users size={24} color={colors.accent1.val} />}
          title={t('juice.governance.delegation.title')}
          description={t('juice.governance.delegation.description')}
        />
        <FeatureCard
          icon={<AlertTriangle size={24} color={colors.accent1.val} />}
          title={t('juice.governance.emergency.title')}
          description={t('juice.governance.emergency.description')}
        />
      </CardsContainer>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          Veto-Based Governance
        </Text>
        <Text variant="body2" color="$neutral2">
          Unlike most DAOs where proposals need majority approval, JuiceDollar&apos;s governance works in reverse:
          proposals pass by default after the application period. Anyone with 2% voting power can VETO a proposal.
        </Text>
        <ComparisonBox>
          <ComparisonColumn>
            <Text variant="subheading2" color="$neutral1" fontWeight="bold">
              Traditional DAO
            </Text>
            <Text variant="body2" color="$neutral2">
              51% needed to pass
            </Text>
            <Text variant="body2" color="$neutral2">
              Majority rules
            </Text>
            <Text variant="body2" color="$neutral2">
              Easy to bribe
            </Text>
          </ComparisonColumn>
          <ComparisonColumn>
            <Text variant="subheading2" color="$neutral1" fontWeight="bold">
              JuiceDollar
            </Text>
            <Text variant="body2" color="$accent1">
              2% needed to block
            </Text>
            <Text variant="body2" color="$accent1">
              Minority protected
            </Text>
            <Text variant="body2" color="$accent1">
              Hard to manipulate
            </Text>
          </ComparisonColumn>
        </ComparisonBox>
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          Time-Weighted Voting Power
        </Text>
        <Text variant="body2" color="$neutral2">
          Your voting power depends on both your balance AND how long you&apos;ve held. This prevents &quot;vote
          buying&quot; just before important decisions and rewards long-term commitment.
        </Text>
        <CodeBlock>
          <Flex flexDirection="column" gap="$spacing8">
            <Text variant="body3" color="$neutral2" fontFamily="monospace">
              Voting Power = JUICE Balance x Holding Duration (in days)
            </Text>
            <Text variant="body3" color="$neutral2" fontFamily="monospace">
              Example: 1,000 JUICE for 365 days = 365,000 vote-days
            </Text>
            <Text variant="body3" color="$neutral2" fontFamily="monospace">
              Example: 10,000 JUICE for 30 days = 300,000 vote-days
            </Text>
          </Flex>
        </CodeBlock>
        <InfoBox type="info">Flash loans give ZERO voting power (0 holding time).</InfoBox>
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          Delegation
        </Text>
        <Text variant="body2" color="$neutral2">
          Delegation is ADDITIVE: The delegate gains your votes, BUT you keep your own voting power too! It&apos;s also
          TRANSITIVE: If Alice delegates to Bob who delegates to Charles, Charles can use votes from both.
        </Text>
        <DataTable headers={['Step', 'Result', 'Voting Power']} rows={delegationExample} />
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          Leadrate Governance
        </Text>
        <Text variant="body2" color="$neutral2">
          JUICE holders with 2%+ voting power can propose changes to the Leadrate (base interest rate). Changes have a
          7-day timelock before taking effect.
        </Text>
        <CodeBlock>
          <Text variant="body3" color="$neutral2" fontFamily="monospace">
            Current Rate - Proposal - 7 Day Timelock - New Rate Active
          </Text>
        </CodeBlock>
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          Emergency Bridge Stop
        </Text>
        <Text variant="body2" color="$neutral2">
          JUICE holders can permanently stop a stablecoin bridge if the underlying stablecoin is compromised. This
          requires 10% voting power (higher than the normal 2% quorum).
        </Text>
        <InfoBox type="warning">
          Once stopped, minting is permanently disabled. Users can still burn JUSD to retrieve their stablecoins.
        </InfoBox>
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          Emergency Powers
        </Text>
        <Text variant="body2" color="$neutral2">
          <strong>Kamikaze Mechanism:</strong> If a malicious actor gains significant voting power, honest holders can
          &quot;kamikaze&quot; their votes to neutralize the threat. This destroys both the attacker&apos;s and
          defender&apos;s voting power.
        </Text>
        <Text variant="body2" color="$neutral2">
          <strong>Capital Restructuring:</strong> If equity falls below 1,000 JUSD (critical threshold), holders with
          2%+ voting power can restructure the cap table. Rescuers receive 100% of new shares.
        </Text>
      </SubSection>
    </Section>
  )
}
