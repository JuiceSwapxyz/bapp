import { Separator } from 'ui/src/components/layout/Separator'
import {
  BitcoinLikeAddressType,
  SwapEnterBitcoinLikeAddress,
} from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapLdsBridge/SwapEnterBitcoinLikeAddress'

export function SwapBtcBridgeDetails(): JSX.Element {
  return (
    <>
      <Separator my="$spacing8" ml="$spacing12" mr="$spacing12" />
      <SwapEnterBitcoinLikeAddress
        type={BitcoinLikeAddressType.Bitcoin}
        placeholder="Enter a Bitcoin address"
        errorMessage="Invalid Bitcoin address format"
      />
    </>
  )
}
