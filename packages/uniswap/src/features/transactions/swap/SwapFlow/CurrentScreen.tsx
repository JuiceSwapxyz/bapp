import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function CurrentScreen(_props: {
  settings: TransactionSettingConfig[]
  onSubmitSwap?: (txHash?: string) => Promise<void> | void
  tokenColor?: string
}): JSX.Element {
  throw new PlatformSplitStubError('CurrentScreen')
}
