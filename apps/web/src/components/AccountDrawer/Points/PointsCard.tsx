import { POINTS_BRAND_COLOR, POINTS_TICKER } from 'components/AccountDrawer/Points/constants'
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
import { Flex, Text, styled } from 'ui/src'
import { Sparkle } from 'ui/src/components/icons/Sparkle'

const CARD_BUBBLE_STYLE = bubbleTextStyle(32)

const Card = styled(Flex, {
  row: true,
  alignItems: 'center',
  gap: '$spacing12',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  px: '$padding16',
  py: '$padding14',
  cursor: 'pointer',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$surface3',
  hoverStyle: {
    backgroundColor: '$surface3',
    borderColor: 'rgba(247,145,26,0.35)',
  },
})

const Badge = styled(Flex, {
  width: 40,
  height: 40,
  borderRadius: '$roundedFull',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  background: 'linear-gradient(135deg, #F7911A 0%, #B05E00 100%)',
})

export function PointsCard({ account }: { account: string }) {
  const setMenu = useUpdateAtom(miniPortfolioMenuStateAtom)
  const { data, isLoading } = usePoints(account)
  const total = data?.total ?? 0

  return (
    <Card onPress={() => setMenu(MenuState.POINTS)} data-testid="account-drawer-points-card">
      <LiquidBubbleStyleTag />
      <Badge>
        <Sparkle size={20} color="$white" />
      </Badge>
      <Flex flex={1} gap="$spacing2">
        <Text variant="body4" color="$neutral2">
          <Trans i18nKey="account.points.total" />
        </Text>
        <span className={LIQUID_BUBBLE_CLASS} style={CARD_BUBBLE_STYLE}>
          {isLoading ? `— ${POINTS_TICKER}` : `${total.toLocaleString()} ${POINTS_TICKER}`}
        </span>
      </Flex>
      <ChevronRight size={20} color={POINTS_BRAND_COLOR} />
    </Card>
  )
}
