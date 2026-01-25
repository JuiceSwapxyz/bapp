import { useTranslation } from 'react-i18next'
import { Flex, Text, styled } from 'ui/src'

import { DataTable } from 'pages/Juice/components/DataTable'
import { InfoBox } from 'pages/Juice/components/InfoBox'
import { SectionHeader } from 'pages/Juice/components/SectionHeader'

const Section = styled(Flex, {
  flexDirection: 'column',
  gap: '$spacing32',
  paddingVertical: '$spacing32',
})

const SubSection = styled(Flex, {
  flexDirection: 'column',
  gap: '$spacing16',
})

const ProtectionLayerBox = styled(Flex, {
  flexDirection: 'column',
  gap: '$spacing8',
  padding: '$spacing20',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
})

const LayerStep = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing12',
})

const LayerNumber = styled(Flex, {
  width: 32,
  height: 32,
  borderRadius: '$roundedFull',
  backgroundColor: '$accent1',
  alignItems: 'center',
  justifyContent: 'center',
})

const ArrowDown = styled(Text, {
  color: '$neutral3',
  paddingLeft: 10,
})

const CodeBlock = styled(Flex, {
  padding: '$spacing16',
  backgroundColor: '$surface3',
  borderRadius: '$rounded12',
})

export function RisksEconomics() {
  const { t } = useTranslation()

  const flowHeaders = ['Flow', 'Effect on JUICE']
  const flowRows = [
    ['Savings interest paid out', 'Reduces equity - JUICE price drops slightly'],
    ['Position fees collected', 'Increases equity - JUICE price rises'],
    ['Liquidation profits', 'Increases equity - JUICE price rises'],
    ['Bad debt (undercollateralized)', 'Reduces equity - JUICE price drops'],
  ]

  const comparisonHeaders = ['Aspect', 'Savings (JUSD)', 'JUICE Investment']
  const comparisonRows = [
    ['Risk', 'Low - principal preserved', 'Higher - value fluctuates'],
    ['Return', 'Fixed Leadrate', 'Variable (fees + liquidations)'],
    ['Governance', 'None', 'Voting power (time-weighted)'],
    ['Lockup', 'None', 'None (same-block protection only)'],
    ['Best for', 'Stable yield seekers', 'Active participants'],
  ]

  return (
    <Section id="risks-economics">
      <SectionHeader title={t('juice.risksEconomics.title')} />

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          {t('juice.risksEconomics.riskBuffer.title')}
        </Text>
        <Text variant="body2" color="$neutral2">
          {t('juice.risksEconomics.riskBuffer.description')}
        </Text>
        <ProtectionLayerBox>
          <LayerStep>
            <LayerNumber>
              <Text variant="body3" color="$white" fontWeight="bold">
                1
              </Text>
            </LayerNumber>
            <Flex flexDirection="column">
              <Text variant="body2" color="$neutral1" fontWeight="600">
                Borrower&apos;s Reserve
              </Text>
              <Text variant="body3" color="$neutral2">
                First, the reserve of the liquidated position
              </Text>
            </Flex>
          </LayerStep>
          <ArrowDown>|</ArrowDown>
          <LayerStep>
            <LayerNumber>
              <Text variant="body3" color="$white" fontWeight="bold">
                2
              </Text>
            </LayerNumber>
            <Flex flexDirection="column">
              <Text variant="body2" color="$neutral1" fontWeight="600">
                Equity (JUICE)
              </Text>
              <Text variant="body3" color="$neutral2">
                Second, taken from the equity pool (JUICE value drops)
              </Text>
            </Flex>
          </LayerStep>
          <ArrowDown>|</ArrowDown>
          <LayerStep>
            <LayerNumber>
              <Text variant="body3" color="$white" fontWeight="bold">
                3
              </Text>
            </LayerNumber>
            <Flex flexDirection="column">
              <Text variant="body2" color="$neutral1" fontWeight="600">
                General Borrower Pool
              </Text>
              <Text variant="body3" color="$neutral2">
                Third, other borrowers must repay more than expected
              </Text>
            </Flex>
          </LayerStep>
        </ProtectionLayerBox>
        <InfoBox type="info">
          JUICE holders profit when the system is healthy (fees + liquidation gains), but lose value when bad debt
          occurs. This aligns incentives for system health.
        </InfoBox>
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          {t('juice.risksEconomics.equilibrium.title')}
        </Text>
        <Text variant="body2" color="$neutral2">
          {t('juice.risksEconomics.equilibrium.description')}
        </Text>
        <CodeBlock>
          <Flex flexDirection="column" gap="$spacing8">
            <Text variant="body3" color="$neutral2" fontFamily="monospace">
              3 x Equity = Circulating JUSD - Bridged JUSD
            </Text>
            <Text variant="body3" color="$neutral2" fontFamily="monospace">
              Or simplified: Equity = 1/3 of non-bridged JUSD
            </Text>
          </Flex>
        </CodeBlock>
        <Flex flexDirection="column" gap="$spacing8">
          <Text variant="body2" color="$neutral2">
            If JUICE market cap &gt; JUSD market cap: Market expects system growth
          </Text>
          <Text variant="body2" color="$neutral2">
            If JUICE market cap &lt; JUSD market cap: Market expects system shrinkage
          </Text>
        </Flex>
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          {t('juice.risksEconomics.savingsSource.title')}
        </Text>
        <Text variant="body2" color="$neutral2">
          {t('juice.risksEconomics.savingsSource.description')}
        </Text>
        <DataTable headers={flowHeaders} rows={flowRows} />
        <InfoBox type="warning">
          This creates a natural tension: JUICE holders want fees, but savings interest costs them.
        </InfoBox>
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          {t('juice.risksEconomics.comparison.title')}
        </Text>
        <DataTable headers={comparisonHeaders} rows={comparisonRows} />
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          Initial JUICE Supply
        </Text>
        <Text variant="body2" color="$neutral2">
          When the first investor deposits JUSD (minimum 1,000 JUSD to reach MINIMUM_EQUITY), an initial supply of 100
          million JUICE is created. After that, new shares are calculated using a power law formula.
        </Text>
        <CodeBlock>
          <Text variant="body3" color="$neutral2" fontFamily="monospace">
            Initial supply: 100,000,000 JUICE (with 18 decimals)
          </Text>
        </CodeBlock>
      </SubSection>
    </Section>
  )
}
