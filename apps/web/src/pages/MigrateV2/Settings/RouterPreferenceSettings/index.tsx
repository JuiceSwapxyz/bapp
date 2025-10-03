import UniswapXBrandMark from 'components/Logo/UniswapXBrandMark'
import Column from 'components/deprecated/Column'
import { RowBetween, RowFixed } from 'components/deprecated/Row'
import { Trans } from 'react-i18next'
import { RouterPreference } from 'state/routing/types'
import { useRouterPreference } from 'state/user/hooks'
import { ThemedText } from 'theme/components'
import { Switch } from 'ui/src'

export default function RouterPreferenceSettings() {
  const [routerPreference, setRouterPreference] = useRouterPreference()

  return (
    <RowBetween gap="sm">
      <RowFixed>
        <Column gap="xs">
          <ThemedText.BodySecondary>
            <UniswapXBrandMark />
          </ThemedText.BodySecondary>
          <ThemedText.BodySmall color="neutral2">
            <Trans i18nKey="routing.aggregateLiquidity" />{' '}
            {/* TODO: Re-enable once support.juiceswap.com is configured
            <ExternalLink href={`${uniswapUrls.helpUrl}/articles/17515415311501`}>
              <InlineLink>Learn more</InlineLink>
            </ExternalLink>
            */}
          </ThemedText.BodySmall>
        </Column>
      </RowFixed>
      <Switch
        testID="toggle-uniswap-x-button"
        checked={routerPreference === RouterPreference.X}
        variant="branded"
        onCheckedChange={() => {
          setRouterPreference(routerPreference === RouterPreference.X ? RouterPreference.API : RouterPreference.X)
        }}
      />
    </RowBetween>
  )
}
