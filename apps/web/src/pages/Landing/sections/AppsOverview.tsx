import { CitreaCampaignCard } from 'components/explore/CitreaCampaignCard'
import { H2 } from 'pages/Landing/components/Generics'
import { TradingApiCard } from 'pages/Landing/components/cards/TradingApiCard'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'

export function AppsOverview() {
  const { t } = useTranslation()
  return (
    <Flex alignItems="center" px={40} $md={{ px: 48 }} $sm={{ px: 24 }}>
      <Flex maxWidth={1280} gap={32} $md={{ gap: 24 }}>
        <H2>{t('landing.appsOverview')}</H2>
        <Flex gap="$gap16">
          <Flex row flexWrap="wrap" height="auto" flex={1} gap="$gap16" $md={{ flexDirection: 'column' }}>
            {/* <WebappCard /> */}
            {/* <LiquidityCard /> */}
            <TradingApiCard />
            <CitreaCampaignCard />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
