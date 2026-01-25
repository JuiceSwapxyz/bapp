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
          Borrowing Example
        </Text>
        <ExampleItem>
          <Text variant="body2" color="$neutral1" fontWeight="600">
            Scenario: Mint 10,000 JUSD against cBTC
          </Text>
          <Flex flexDirection="column" gap="$spacing4" pl="$spacing16">
            <Text variant="body2" color="$neutral2">
              • Collateral: 0.5 cBTC (worth ~$20,000)
            </Text>
            <Text variant="body2" color="$neutral2">
              • Reserve Ratio: 20% (2,000 JUSD held back)
            </Text>
            <Text variant="body2" color="$neutral2">
              • Interest: 5% annual (500 JUSD upfront)
            </Text>
            <Text variant="body2" color="$neutral2">
              • You receive: 10,000 - 2,000 - 500 = 7,500 JUSD
            </Text>
          </Flex>
        </ExampleItem>
        <ExampleItem>
          <Text variant="body2" color="$neutral1" fontWeight="600">
            To close position:
          </Text>
          <Flex flexDirection="column" gap="$spacing4" pl="$spacing16">
            <Text variant="body2" color="$neutral2">
              • Repay 10,000 JUSD (your minted amount)
            </Text>
            <Text variant="body2" color="$neutral2">
              • Receive back: 0.5 cBTC + 2,000 JUSD reserve
            </Text>
          </Flex>
        </ExampleItem>
      </ExampleBox>

      <ExampleBox>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          Why Borrow JUSD?
        </Text>
        <Flex flexDirection="column" gap="$spacing12">
          <ExampleItem>
            <Text variant="body2" color="$accent1" fontWeight="600">
              1. Leverage without selling
            </Text>
            <Text variant="body2" color="$neutral2">
              Keep your Bitcoin exposure while accessing liquidity. Use JUSD for other investments or expenses.
            </Text>
          </ExampleItem>
          <ExampleItem>
            <Text variant="body2" color="$accent1" fontWeight="600">
              2. Tax efficiency
            </Text>
            <Text variant="body2" color="$neutral2">
              Borrowing against crypto may have different tax implications than selling in many jurisdictions.
            </Text>
          </ExampleItem>
          <ExampleItem>
            <Text variant="body2" color="$accent1" fontWeight="600">
              3. Yield farming
            </Text>
            <Text variant="body2" color="$neutral2">
              Mint JUSD, deposit to savings for yield, or provide liquidity in DeFi protocols.
            </Text>
          </ExampleItem>
        </Flex>
      </ExampleBox>
    </Section>
  )
}
