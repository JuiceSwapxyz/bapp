import { useTranslation } from 'react-i18next'
import { Flex, Text, styled } from 'ui/src'

import { FeatureCard } from '../components/FeatureCard'
import { SectionHeader } from '../components/SectionHeader'

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

const FlywheelContainer = styled(Flex, {
  flexDirection: 'column',
  alignItems: 'center',
  padding: '$spacing32',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  gap: '$spacing16',
})

const FlywheelStep = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing12',
})

const FlywheelArrow = styled(Text, {
  color: '$accent1',
  fontSize: 24,
})

const FlywheelBox = styled(Flex, {
  padding: '$spacing12',
  backgroundColor: '$surface3',
  borderRadius: '$rounded8',
  minWidth: 150,
  alignItems: 'center',
  justifyContent: 'center',
})

function GovernanceIcon() {
  return (
    <Text fontSize={24} color="$accent1">
      G
    </Text>
  )
}

function FeesIcon() {
  return (
    <Text fontSize={24} color="$accent1">
      $
    </Text>
  )
}

function LiquidationIcon() {
  return (
    <Text fontSize={24} color="$accent1">
      L
    </Text>
  )
}

function TimeIcon() {
  return (
    <Text fontSize={24} color="$accent1">
      T
    </Text>
  )
}

export function UseCases() {
  const { t } = useTranslation()

  return (
    <Section id="use-cases">
      <SectionHeader title={t('juice.useCases.title')} />

      <CardsContainer>
        <FeatureCard
          icon={<GovernanceIcon />}
          title={t('juice.useCases.governance.title')}
          description={t('juice.useCases.governance.description')}
          benefit={t('juice.useCases.governance.benefit')}
        />
        <FeatureCard
          icon={<FeesIcon />}
          title={t('juice.useCases.fees.title')}
          description={t('juice.useCases.fees.description')}
          benefit={t('juice.useCases.fees.benefit')}
        />
        <FeatureCard
          icon={<LiquidationIcon />}
          title={t('juice.useCases.liquidations.title')}
          description={t('juice.useCases.liquidations.description')}
          benefit={t('juice.useCases.liquidations.benefit')}
        />
        <FeatureCard
          icon={<TimeIcon />}
          title={t('juice.useCases.votingPower.title')}
          description={t('juice.useCases.votingPower.description')}
          benefit={t('juice.useCases.votingPower.benefit')}
        />
      </CardsContainer>

      <FlywheelContainer>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          Economic Flywheel
        </Text>
        <Flex flexDirection="column" alignItems="center" gap="$spacing8">
          <FlywheelStep>
            <FlywheelBox>
              <Text variant="body2" color="$neutral1">
                Higher TVL
              </Text>
            </FlywheelBox>
          </FlywheelStep>
          <FlywheelArrow>v</FlywheelArrow>
          <FlywheelStep>
            <FlywheelBox>
              <Text variant="body2" color="$neutral1">
                More Fees
              </Text>
            </FlywheelBox>
          </FlywheelStep>
          <FlywheelArrow>v</FlywheelArrow>
          <FlywheelStep>
            <FlywheelBox>
              <Text variant="body2" color="$accent1">
                JUICE Price Up
              </Text>
            </FlywheelBox>
          </FlywheelStep>
          <FlywheelArrow>v</FlywheelArrow>
          <FlywheelStep>
            <FlywheelBox>
              <Text variant="body2" color="$neutral1">
                More Interest
              </Text>
            </FlywheelBox>
          </FlywheelStep>
          <FlywheelArrow>v</FlywheelArrow>
          <FlywheelStep>
            <FlywheelBox>
              <Text variant="body2" color="$neutral1">
                Better Governance
              </Text>
            </FlywheelBox>
          </FlywheelStep>
          <FlywheelArrow>v</FlywheelArrow>
          <Text variant="body3" color="$neutral2" fontStyle="italic">
            (cycle repeats)
          </Text>
        </Flex>
      </FlywheelContainer>
    </Section>
  )
}
