import { POINTS_BRAND_COLOR, POINTS_TICKER } from 'components/AccountDrawer/Points/constants'
import { usePoints } from 'components/AccountDrawer/Points/usePoints'
import { Text } from 'ui/src'

export function WalletPointsLabel({ address }: { address: string }) {
  const { data } = usePoints(address)
  const total = data?.total ?? 0

  if (total <= 0) {
    return null
  }

  return (
    <Text variant="body2" color={POINTS_BRAND_COLOR} marginRight="$spacing8">
      {`${total.toLocaleString()}${POINTS_TICKER}`}
    </Text>
  )
}
