import { CreditCard, Database, TrendingUp } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Flex, Text, styled, useSporeColors } from 'ui/src'

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

const ExampleBox = styled(Flex, {
  flexDirection: 'column',
  padding: '$spacing24',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  gap: '$spacing16',
})

const ExampleItem = styled(Flex, {
  flexDirection: 'column',
  gap: '$spacing8',
})

export function UseCases() {
  const colors = useSporeColors()
  const { t } = useTranslation()

  return (
    <Section id="use-cases">
      <SectionHeader title={t('jusd.useCases.title')} subtitle={t('jusd.useCases.description')} />

      <CardsContainer>
        <FeatureCard
          icon={<CreditCard size={24} color={colors.accent1.val} />}
          title={t('jusd.useCases.payments.title')}
          description={t('jusd.useCases.payments.description')}
          benefit={t('jusd.useCases.payments.benefit')}
        />
        <FeatureCard
          icon={<Database size={24} color={colors.accent1.val} />}
          title={t('jusd.useCases.store.title')}
          description={t('jusd.useCases.store.description')}
          benefit={t('jusd.useCases.store.benefit')}
        />
        <FeatureCard
          icon={<TrendingUp size={24} color={colors.accent1.val} />}
          title={t('jusd.useCases.borrowing.title')}
          description={t('jusd.useCases.borrowing.description')}
          benefit={t('jusd.useCases.borrowing.benefit')}
        />
      </CardsContainer>

      <ExampleBox>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          {t('jusd.useCases.example.title')}
        </Text>
        <ExampleItem>
          <Text variant="body2" color="$neutral1" fontWeight="600">
            {t('jusd.useCases.example.scenario')}
          </Text>
          <Flex flexDirection="column" gap="$spacing4" pl="$spacing16">
            <Text variant="body2" color="$neutral2">
              • {t('jusd.useCases.example.collateral')}
            </Text>
            <Text variant="body2" color="$neutral2">
              • {t('jusd.useCases.example.reserve')}
            </Text>
            <Text variant="body2" color="$neutral2">
              • {t('jusd.useCases.example.interest')}
            </Text>
            <Text variant="body2" color="$neutral2">
              • {t('jusd.useCases.example.receive')}
            </Text>
          </Flex>
        </ExampleItem>
        <ExampleItem>
          <Text variant="body2" color="$neutral1" fontWeight="600">
            {t('jusd.useCases.example.close')}
          </Text>
          <Flex flexDirection="column" gap="$spacing4" pl="$spacing16">
            <Text variant="body2" color="$neutral2">
              • {t('jusd.useCases.example.repay')}
            </Text>
            <Text variant="body2" color="$neutral2">
              • {t('jusd.useCases.example.receiveBack')}
            </Text>
          </Flex>
        </ExampleItem>
      </ExampleBox>

      <ExampleBox>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          {t('jusd.useCases.whyBorrow.title')}
        </Text>
        <Flex flexDirection="column" gap="$spacing12">
          <ExampleItem>
            <Text variant="body2" color="$accent1" fontWeight="600">
              {t('jusd.useCases.whyBorrow.leverage.title')}
            </Text>
            <Text variant="body2" color="$neutral2">
              {t('jusd.useCases.whyBorrow.leverage.desc')}
            </Text>
          </ExampleItem>
          <ExampleItem>
            <Text variant="body2" color="$accent1" fontWeight="600">
              {t('jusd.useCases.whyBorrow.tax.title')}
            </Text>
            <Text variant="body2" color="$neutral2">
              {t('jusd.useCases.whyBorrow.tax.desc')}
            </Text>
          </ExampleItem>
          <ExampleItem>
            <Text variant="body2" color="$accent1" fontWeight="600">
              {t('jusd.useCases.whyBorrow.yield.title')}
            </Text>
            <Text variant="body2" color="$neutral2">
              {t('jusd.useCases.whyBorrow.yield.desc')}
            </Text>
          </ExampleItem>
        </Flex>
      </ExampleBox>
    </Section>
  )
}
