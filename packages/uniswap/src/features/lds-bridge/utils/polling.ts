import { getLockup } from 'uniswap/src/features/lds-bridge/api/client'
import { RetryableError, retry } from 'uniswap/src/features/lds-bridge/utils/retry'

export function pollForLockupConfirmation(preimageHash: string, chainId: number): {
  promise: Promise<NonNullable<Awaited<ReturnType<typeof getLockup>>['data']['lockups']>>
  cancel: () => void
} {
  return retry(
    async () => {
      const response = await getLockup(preimageHash, chainId)

      if (!response.data.lockups) {
        throw new RetryableError('Lockup not found yet, retrying...')
      }

      return response.data.lockups
    },
    {
      n: 100,
      minWait: 7000,
      medWait: 7000,
      maxWait: 7000,
    },
  )
}

export function pollForClaimablePreimage(preimageHash: string, chainId: number): {
  promise: Promise<NonNullable<NonNullable<Awaited<ReturnType<typeof getLockup>>['data']['lockups']>['preimage']>>
  cancel: () => void
} {
  return retry(
    async () => {
      const response = await getLockup(preimageHash, chainId)

      if (!response.data.lockups || !response.data.lockups.preimage) {
        throw new RetryableError('Claim not found yet, retrying...')
      }

      return response.data.lockups.preimage
    },
    {
      n: 100,
      minWait: 7000,
      medWait: 7000,
      maxWait: 7000,
    },
  )
}
