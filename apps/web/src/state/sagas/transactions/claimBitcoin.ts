/* eslint-disable no-console */
/* eslint-disable no-relative-import-paths/no-relative-import-paths */
import { broadcastClaimTransaction, buildChainSwapClaim } from './buildChainSwapClaim'

interface ClaimBitcoinParams {
  swapId: string
  mnemonic: string
  claimPrivateKeyIndex: number
  preimage: string
  claimAddress: string
  claimDetails: {
    swapTree: {
      claimLeaf: { output: string; version: number }
      refundLeaf: { output: string; version: number }
    }
    serverPublicKey: string
    timeoutBlockHeight: number
    amount: number
  }
  network?: string
  apiBaseUrl?: string
}

/**
 * Fetches the server's lockup transaction from the API
 */
async function getServerLockTransaction(swapId: string, apiBaseUrl: string): Promise<{ transaction: { hex: string } }> {
  const response = await fetch(`${apiBaseUrl}/v1/swap/v2/swap/chain/${swapId}/transactions`)
  const data = await response.json()
  return data.serverLock
}

/**
 * Claims Bitcoin from a chain swap using the complete buildChainSwapClaim implementation.
 *
 * This function:
 * 1. Gets the server's lockup transaction
 * 2. Builds and signs the claim transaction (using buildChainSwapClaim)
 * 3. Broadcasts the claim transaction
 *
 * @param params - Claim parameters
 * @returns Transaction ID of the broadcasted claim
 */
export async function claimBitcoin(params: ClaimBitcoinParams): Promise<string> {
  const { swapId, apiBaseUrl = 'https://dev.lightning.space', ...restParams } = params

  // Step 1: Get server's lockup transaction
  const serverLock = await getServerLockTransaction(swapId, apiBaseUrl)

  // Step 2: Build and sign the claim transaction
  const claimResult = await buildChainSwapClaim({
    swapId,
    ...restParams,
    serverLockupTxHex: serverLock.transaction.hex,
    apiBaseUrl,
    cooperative: true,
  })

  console.log('Claim transaction built:', claimResult.transactionId)

  // Step 3: Broadcast the claim transaction
  const broadcastResult = await broadcastClaimTransaction(claimResult.transactionHex, apiBaseUrl)

  console.log('Claim transaction broadcasted:', broadcastResult.id)

  return broadcastResult.id
}
