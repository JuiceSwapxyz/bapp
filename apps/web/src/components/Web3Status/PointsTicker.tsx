import { POINTS_BRAND_COLOR, POINTS_TICKER } from 'components/AccountDrawer/Points/constants'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { usePoints } from 'components/AccountDrawer/Points/usePoints'
import { MenuState, miniPortfolioMenuStateAtom } from 'components/AccountDrawer/constants'
import { useAccount } from 'hooks/useAccount'
import { useUpdateAtom } from 'jotai/utils'
import { Flex, Text, styled } from 'ui/src'

const TickerPill = styled(Flex, {
  row: true,
  alignItems: 'center',
  py: '$padding6',
  px: '$padding12',
  borderRadius: '$roundedFull',
  backgroundColor: '$surface2',
  cursor: 'pointer',
  hoverStyle: { backgroundColor: '$surface3' },
})

export function PointsTicker() {
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const setMenu = useUpdateAtom(miniPortfolioMenuStateAtom)
  const { data } = usePoints(account.address)

  const total = data?.total ?? 0
  if (!account.address || total <= 0) {
    return null
  }

  const openPointsMenu = () => {
    setMenu(MenuState.POINTS)
    accountDrawer.open()
  }

  return (
    <TickerPill onPress={openPointsMenu} data-testid="navbar-points-ticker">
      <Text variant="buttonLabel3" color={POINTS_BRAND_COLOR}>
        {`${total.toLocaleString()} ${POINTS_TICKER}`}
      </Text>
    </TickerPill>
  )
}
