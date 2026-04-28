import type { Web3Provider } from '@ethersproject/providers'
import { fetchChainTransactionsBySwapId } from 'uniswap/src/features/lds-bridge'
import { logger } from 'utilities/src/logger/logger'

// Even after the LDS server reports its lockup tx is confirmed, the user's RPC
// node may not yet see that tx, which would make the claim's estimateGas
// revert with "no tokens locked". Wait until the destination provider observes
// the server lockup tx before signing the claim.
//
// Best-effort: never throws. If anything fails (timeout, network, missing
// serverLock) we still attempt the claim and let the contract surface the real
// error to the user.
const SERVER_LOCKUP_WAIT_TIMEOUT_MS = 60_000
const SERVER_LOCKUP_CONFIRMATIONS = 1

export async function waitForServerLockupTx(params: {
  provider: Web3Provider
  swapId: string
  source: string
}): Promise<void> {
  const { provider, swapId, source } = params
  try {
    const chainTxs = await fetchChainTransactionsBySwapId(swapId)
    const serverLockTxId = chainTxs.serverLock?.transaction.id
    if (!serverLockTxId) {
      return
    }
    await provider.waitForTransaction(serverLockTxId, SERVER_LOCKUP_CONFIRMATIONS, SERVER_LOCKUP_WAIT_TIMEOUT_MS)
  } catch (error) {
    logger.warn(
      source,
      'waitForServerLockupTx',
      `Failed waiting for server lockup tx: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
