import { RetryableError, retry } from 'state/activity/polling/retry'
import { getLockup } from 'uniswap/src/data/apiClients/LdsApi/LdsApiClient'

export function pollForLockupConfirmation(preimageHash: string) {
  return retry(
    async () => {
      const response = await getLockup(preimageHash)

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

export function pollForClaimablePreimage(preimageHash: string) {
  return retry(
    async () => {
      const response = await getLockup(preimageHash)

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
