import { POINTS_TICKER } from 'components/AccountDrawer/Points/constants'
import {
  LIQUID_BUBBLE_CLASS,
  LiquidBg,
  LiquidBubbleStyleTag,
  bubbleTextStyle,
} from 'components/AccountDrawer/Points/styles'
import { usePoints } from 'components/AccountDrawer/Points/usePoints'
import { MenuState, miniPortfolioMenuStateAtom } from 'components/AccountDrawer/constants'
import { useUpdateAtom } from 'jotai/utils'
import { ChevronRight } from 'react-feather'
import { Trans } from 'react-i18next'
import { Flex, Text, styled } from 'ui/src'

const CARD_BUBBLE_STYLE = bubbleTextStyle(32)

const CARD_LABEL_STYLE: React.CSSProperties = {
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  fontSize: 10,
  fontWeight: 600,
  color: '#F2C998',
  margin: 0,
  display: 'block',
}

const Card = styled(Flex, {
  row: true,
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '$rounded16',
  px: '$padding16',
  py: '$padding14',
  cursor: 'pointer',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '#3a2814',
  background: 'linear-gradient(180deg, #1a1208 0%, #0a0604 100%)',
  hoverStyle: { borderColor: 'rgba(247,145,26,0.55)' },
})

export function PointsCard({ account }: { account: string }) {
  const setMenu = useUpdateAtom(miniPortfolioMenuStateAtom)
  const { data, isLoading } = usePoints(account)
  const total = data?.total ?? 0

  return (
    <Card onPress={() => setMenu(MenuState.POINTS)} data-testid="account-drawer-points-card">
      <LiquidBg variant="compact" />
      <LiquidBubbleStyleTag />
      <Flex zIndex={1} gap="$spacing4">
        <span style={CARD_LABEL_STYLE}>
          <Trans i18nKey="account.points.total" />
        </span>
        <span className={LIQUID_BUBBLE_CLASS} style={CARD_BUBBLE_STYLE}>
          {isLoading ? `— ${POINTS_TICKER}` : `${total.toLocaleString()} ${POINTS_TICKER}`}
        </span>
      </Flex>
      <ChevronRight size={20} color="#F2C998" style={{ zIndex: 1 }} />
    </Card>
  )
}
