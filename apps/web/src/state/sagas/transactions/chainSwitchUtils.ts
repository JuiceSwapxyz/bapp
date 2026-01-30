import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { call } from 'typed-redux-saga'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionStepFailedError } from 'uniswap/src/features/transactions/errors'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { logger } from 'utilities/src/logger/logger'
import { getAccount } from 'wagmi/actions'

export async function waitForNetwork(targetChainId: number, timeout = 30000): Promise<void> {
  const startTime = Date.now()
  const account = getAccount(wagmiConfig)
  if (account.chainId === targetChainId) {
    return
  }

  await new Promise<void>((resolve, reject) => {
    const pollInterval = setInterval(() => {
      try {
        const currentAccount = getAccount(wagmiConfig)
        if (currentAccount.chainId === targetChainId) {
          clearInterval(pollInterval)
          resolve()
        } else if (Date.now() - startTime > timeout) {
          clearInterval(pollInterval)
          reject(
            new Error(
              `Timeout waiting for network switch to chain ${targetChainId}. Current chain: ${currentAccount.chainId}`,
            ),
          )
        }
      } catch (error) {
        clearInterval(pollInterval)
        reject(error)
      }
    }, 200)
  })
}

export function* ensureCorrectChain(params: {
  targetChainId: UniverseChainId
  selectChain: (chainId: UniverseChainId) => Promise<boolean>
  step: TransactionStep
  chainDisplayName: string
}): Generator<unknown, void, unknown> {
  const { targetChainId, selectChain, step, chainDisplayName } = params
  const currentAccount = getAccount(wagmiConfig)

  if (currentAccount.chainId !== targetChainId) {
    logger.info('chainSwitchUtils', 'ensureCorrectChain', `Requesting chain switch to ${chainDisplayName}`)

    void selectChain(targetChainId).catch((error) => {
      logger.warn('chainSwitchUtils', 'ensureCorrectChain', 'Chain switch request failed', { error })
    })

    try {
      yield* call(waitForNetwork, targetChainId, 30000)
      logger.info('chainSwitchUtils', 'ensureCorrectChain', `Successfully switched to ${chainDisplayName}`)
    } catch (error) {
      throw new TransactionStepFailedError({
        message: `Please switch your wallet to ${chainDisplayName} network and try again.`,
        step,
        originalError: error instanceof Error ? error : undefined,
      })
    }
  }
}
