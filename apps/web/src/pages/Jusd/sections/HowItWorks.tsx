import { Clock, Lock, RefreshCw, Repeat } from 'react-feather'
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

const FlowContainer = styled(Flex, {
  flexDirection: 'column',
  alignItems: 'center',
  padding: '$spacing24',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  gap: '$spacing16',
})

const FlowStep = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing12',
  width: '100%',
  maxWidth: 500,
})

const StepNumber = styled(Flex, {
  width: 32,
  height: 32,
  borderRadius: '$roundedFull',
  backgroundColor: '$accent1',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
})

const ArrowDown = styled(Text, {
  color: '$neutral3',
  fontSize: 20,
})

export function HowItWorks() {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const bridgeHeaders = ['Feature', 'Description']
  const bridgeRows = [
    ['Exchange Rate', '1:1 with source stablecoin'],
    ['Volume Limit', 'Capped per bridge to limit exposure'],
    ['Time Horizon', 'Bridges expire after ~1 year'],
    ['Emergency Stop', '10% voting power can halt a compromised bridge'],
  ]

  const positionHeaders = ['Parameter', 'Description']
  const positionRows = [
    ['Collateral', 'Asset locked to back JUSD (e.g., cBTC)'],
    ['Liquidation Price', 'Price at which position can be liquidated'],
    ['Reserve Ratio', 'Extra collateral held as safety buffer (typically 20%)'],
    ['Interest Rate', 'Annual fee charged upfront (Leadrate + risk premium)'],
    ['Minting Limit', 'Maximum JUSD mintable per position type'],
  ]

  return (
    <Section id="how-it-works">
      <SectionHeader title={t('jusd.howItWorks.title')} subtitle={t('jusd.howItWorks.description')} />

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          {t('jusd.howItWorks.bridges.title')}
        </Text>
        <Text variant="body2" color="$neutral2">
          {t('jusd.howItWorks.bridges.description')}
        </Text>
        <CardsContainer>
          <FeatureCard
            icon={<Repeat size={24} color={colors.accent1.val} />}
            title={t('jusd.howItWorks.bridges.mint.title')}
            description={t('jusd.howItWorks.bridges.mint.description')}
          />
          <FeatureCard
            icon={<RefreshCw size={24} color={colors.accent1.val} />}
            title={t('jusd.howItWorks.bridges.burn.title')}
            description={t('jusd.howItWorks.bridges.burn.description')}
          />
        </CardsContainer>
        <DataTable headers={bridgeHeaders} rows={bridgeRows} />
        <InfoBox type="warning">
          Bridges have volume limits and expiration dates. Always check bridge status before large transactions.
        </InfoBox>
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          {t('jusd.howItWorks.collateral.title')}
        </Text>
        <Text variant="body2" color="$neutral2">
          {t('jusd.howItWorks.collateral.description')}
        </Text>

        <FlowContainer>
          <Text variant="subheading2" color="$neutral1" fontWeight="bold">
            Collateralized Minting Flow
          </Text>
          <FlowStep>
            <StepNumber>
              <Text variant="body3" color="$white" fontWeight="bold">
                1
              </Text>
            </StepNumber>
            <Flex flexDirection="column">
              <Text variant="body2" color="$neutral1" fontWeight="600">
                Deposit Collateral
              </Text>
              <Text variant="body3" color="$neutral2">
                Lock cBTC or other approved assets
              </Text>
            </Flex>
          </FlowStep>
          <ArrowDown>↓</ArrowDown>
          <FlowStep>
            <StepNumber>
              <Text variant="body3" color="$white" fontWeight="bold">
                2
              </Text>
            </StepNumber>
            <Flex flexDirection="column">
              <Text variant="body2" color="$neutral1" fontWeight="600">
                Set Parameters
              </Text>
              <Text variant="body3" color="$neutral2">
                Choose liquidation price, reserve ratio, interest
              </Text>
            </Flex>
          </FlowStep>
          <ArrowDown>↓</ArrowDown>
          <FlowStep>
            <StepNumber>
              <Text variant="body3" color="$white" fontWeight="bold">
                3
              </Text>
            </StepNumber>
            <Flex flexDirection="column">
              <Text variant="body2" color="$neutral1" fontWeight="600">
                Mint JUSD
              </Text>
              <Text variant="body3" color="$neutral2">
                Receive JUSD up to your limit (minus fees)
              </Text>
            </Flex>
          </FlowStep>
          <ArrowDown>↓</ArrowDown>
          <FlowStep>
            <StepNumber>
              <Text variant="body3" color="$white" fontWeight="bold">
                4
              </Text>
            </StepNumber>
            <Flex flexDirection="column">
              <Text variant="body2" color="$neutral1" fontWeight="600">
                Repay & Withdraw
              </Text>
              <Text variant="body3" color="$neutral2">
                Return JUSD to unlock your collateral
              </Text>
            </Flex>
          </FlowStep>
        </FlowContainer>

        <DataTable headers={positionHeaders} rows={positionRows} />
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          {t('jusd.howItWorks.auctions.title')}
        </Text>
        <Text variant="body2" color="$neutral2">
          {t('jusd.howItWorks.auctions.description')}
        </Text>
        <CardsContainer>
          <FeatureCard
            icon={<Clock size={24} color={colors.accent1.val} />}
            title={t('jusd.howItWorks.auctions.phase1.title')}
            description={t('jusd.howItWorks.auctions.phase1.description')}
          />
          <FeatureCard
            icon={<Lock size={24} color={colors.accent1.val} />}
            title={t('jusd.howItWorks.auctions.phase2.title')}
            description={t('jusd.howItWorks.auctions.phase2.description')}
          />
        </CardsContainer>
        <CodeBlock>
          <Text variant="body3" color="$neutral2" fontFamily="monospace">
            Challenger Reward: 2% of challenged amount
          </Text>
        </CodeBlock>
        <InfoBox type="info">
          This auction system eliminates the need for external oracles - the market determines fair prices directly.
        </InfoBox>
      </SubSection>
    </Section>
  )
}
