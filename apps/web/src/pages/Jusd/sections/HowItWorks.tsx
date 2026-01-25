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

  const bridgeHeaders = [t('jusd.howItWorks.bridges.table.feature'), t('jusd.howItWorks.bridges.table.description')]
  const bridgeRows = [
    [t('jusd.howItWorks.bridges.exchangeRate'), t('jusd.howItWorks.bridges.exchangeRate.desc')],
    [t('jusd.howItWorks.bridges.volumeLimit'), t('jusd.howItWorks.bridges.volumeLimit.desc')],
    [t('jusd.howItWorks.bridges.timeHorizon'), t('jusd.howItWorks.bridges.timeHorizon.desc')],
    [t('jusd.howItWorks.bridges.emergencyStop'), t('jusd.howItWorks.bridges.emergencyStop.desc')],
  ]

  const positionHeaders = [
    t('jusd.howItWorks.position.table.parameter'),
    t('jusd.howItWorks.position.table.description'),
  ]
  const positionRows = [
    [t('jusd.howItWorks.position.collateral'), t('jusd.howItWorks.position.collateral.desc')],
    [t('jusd.howItWorks.position.liquidationPrice'), t('jusd.howItWorks.position.liquidationPrice.desc')],
    [t('jusd.howItWorks.position.reserveRatio'), t('jusd.howItWorks.position.reserveRatio.desc')],
    [t('jusd.howItWorks.position.interestRate'), t('jusd.howItWorks.position.interestRate.desc')],
    [t('jusd.howItWorks.position.mintingLimit'), t('jusd.howItWorks.position.mintingLimit.desc')],
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
        <InfoBox type="warning">{t('jusd.howItWorks.bridges.warning')}</InfoBox>
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
            {t('jusd.howItWorks.flow.title')}
          </Text>
          <FlowStep>
            <StepNumber>
              <Text variant="body3" color="$white" fontWeight="bold">
                1
              </Text>
            </StepNumber>
            <Flex flexDirection="column">
              <Text variant="body2" color="$neutral1" fontWeight="600">
                {t('jusd.howItWorks.flow.step1.title')}
              </Text>
              <Text variant="body3" color="$neutral2">
                {t('jusd.howItWorks.flow.step1.description')}
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
                {t('jusd.howItWorks.flow.step2.title')}
              </Text>
              <Text variant="body3" color="$neutral2">
                {t('jusd.howItWorks.flow.step2.description')}
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
                {t('jusd.howItWorks.flow.step3.title')}
              </Text>
              <Text variant="body3" color="$neutral2">
                {t('jusd.howItWorks.flow.step3.description')}
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
                {t('jusd.howItWorks.flow.step4.title')}
              </Text>
              <Text variant="body3" color="$neutral2">
                {t('jusd.howItWorks.flow.step4.description')}
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
            {t('jusd.howItWorks.auctions.challengerReward')}
          </Text>
        </CodeBlock>
        <InfoBox type="info">{t('jusd.howItWorks.auctions.info')}</InfoBox>
      </SubSection>
    </Section>
  )
}
