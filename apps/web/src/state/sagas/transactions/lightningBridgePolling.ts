import { RetryableError, retry } from 'state/activity/polling/retry'
import {
  checkPreimageHashForClaim,
  checkPreimageHashForLockup,
} from 'uniswap/src/data/apiClients/lightningBridge/LightningBridgeApiClient'

export function pollForLockupConfirmation(preimageHash: string) {
  return retry(
    async () => {
      const response = await checkPreimageHashForLockup(preimageHash).catch((error) => {
        if (error.response?.status === 404) {
          throw new RetryableError('Lockup not found yet, retrying...')
        }
        throw error
      })

      return response.lockup
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
      const response = await checkPreimageHashForClaim(preimageHash).catch((error) => {
        if (error.response?.status === 404) {
          throw new RetryableError('Claim not found yet, retrying...')
        }
        throw error
      })

      if (!response.lockup || !response.lockup.preimage) {
        throw new RetryableError('Claim not found yet, retrying...')
      }

      return response.lockup.preimage
    },
    {
      n: 100,
      minWait: 7000,
      medWait: 7000,
      maxWait: 7000,
    },
  )
}
