import { POINTS_TICKER } from 'components/AccountDrawer/Points/constants'
import {
  LIQUID_BUBBLE_CLASS,
  LiquidBubbleStyleTag,
  bubbleTextStyle,
} from 'components/AccountDrawer/Points/styles'
import { usePoints } from 'components/AccountDrawer/Points/usePoints'
import { MenuState, miniPortfolioMenuStateAtom } from 'components/AccountDrawer/constants'
import { useUpdateAtom } from 'jotai/utils'
import { ChevronRight } from 'react-feather'
import { Trans } from 'react-i18next'
import { Flex, Text } from 'ui/src'

const CARD_BUBBLE_STYLE = bubbleTextStyle(32)

export function PointsCard({ account }: { account: string }) {
  const setMenu = useUpdateAtom(miniPortfolioMenuStateAtom)
  const { data, isLoading } = usePoints(account)
  const total = data?.total ?? 0

  return (
    <Flex
      row
      alignItems="center"
      justifyContent="space-between"
      backgroundColor="$surface2"
      borderRadius="$rounded16"
      p="$padding16"
      cursor="pointer"
      hoverStyle={{ backgroundColor: '$surface3' }}
      onPress={() => setMenu(MenuState.POINTS)}
      data-testid="account-drawer-points-card"
    >
      <LiquidBubbleStyleTag />
      <Flex gap="$spacing4">
        <Text variant="body3" color="$neutral2">
          <Trans i18nKey="account.points.total" />
        </Text>
        <span className={LIQUID_BUBBLE_CLASS} style={CARD_BUBBLE_STYLE}>
          {isLoading ? `— ${POINTS_TICKER}` : `${total.toLocaleString()} ${POINTS_TICKER}`}
        </span>
      </Flex>
      <ChevronRight size={20} />
    </Flex>
  )
}
