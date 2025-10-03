import { AnalyticsToggle } from 'components/AccountDrawer/AnalyticsToggle'
import { AppVersionRow } from 'components/AccountDrawer/AppVersionRow'
import { CitreaOnlyToggle } from 'components/AccountDrawer/CitreaOnlyToggle'
import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import { TestnetModeToggle } from 'components/AccountDrawer/TestnetModeToggle'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import styled from 'lib/styled-components'
import { ReactNode } from 'react'
import { ChevronRight } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { ThemedText } from 'theme/components'
import ThemeToggle from 'theme/components/ThemeToggle'
import { Flex, Text } from 'ui/src'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'

const Container = styled(Column)`
  height: 100%;
`

const StyledChevron = styled(ChevronRight)`
  color: ${({ theme }) => theme.neutral2};
`

const LanguageLabel = styled(Row)`
  white-space: nowrap;
`

const SettingsButton = ({
  title,
  currentState,
  onClick,
  testId,
  showArrow = true,
}: {
  title: ReactNode
  currentState?: ReactNode
  onClick: () => void
  testId?: string
  showArrow?: boolean
}) => (
  <Flex row justifyContent="space-between" py="$padding12" onPress={onClick} testID={testId}>
    <Text variant="body3" color="$neutral1">
      {title}
    </Text>
    <LanguageLabel gap="xs" align="center" width="min-content">
      {currentState && <ThemedText.LabelSmall color="neutral2">{currentState}</ThemedText.LabelSmall>}
      {showArrow && <StyledChevron size={20} />}
    </LanguageLabel>
  </Flex>
)

export default function SettingsMenu({
  onClose,
  openLocalCurrencySettings,
  openPortfolioBalanceSettings,
}: {
  onClose: () => void
  openLocalCurrencySettings: () => void
  openPortfolioBalanceSettings: () => void
}) {
  const { t } = useTranslation()
  const activeLocalCurrency = useAppFiatCurrency()

  return (
    <SlideOutMenu title={<Trans i18nKey="common.settings" />} onClose={onClose} versionComponent={<AppVersionRow />}>
      <Container>
        <Flex gap="$gap12">
          <ThemeToggle />

          <SettingsButton
            title={t('settings.setting.currency.title')}
            currentState={activeLocalCurrency}
            onClick={openLocalCurrencySettings}
            testId="local-currency-settings-button"
          />
          <SettingsButton
            title={t('settings.setting.smallBalances.title')}
            onClick={openPortfolioBalanceSettings}
            testId="portfolio-balance-settings-button"
          />
        </Flex>
        <TestnetModeToggle />
        <CitreaOnlyToggle />
        <AnalyticsToggle />
      </Container>
    </SlideOutMenu>
  )
}
