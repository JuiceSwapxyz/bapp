import { popupRegistry } from 'components/Popups/registry'
import { LdsBridgeStatus, PopupType } from 'components/Popups/types'
import { DEFAULT_TXN_DISMISS_MS } from 'constants/misc'
import { call, delay, spawn } from 'typed-redux-saga'
import { BitcoinBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import { getLdsBridgeManager } from 'uniswap/src/features/lds-bridge'
import { ASSET_CHAIN_ID_MAP } from 'uniswap/src/features/lds-bridge/LdsBridgeManager'
import { SomeSwap, SwapType } from 'uniswap/src/features/lds-bridge/lds-types/storage'
import { LdsSwapStatus } from 'uniswap/src/features/lds-bridge/lds-types/websocket'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'

const POLLING_INTERVAL = 30000 // 30 seconds

function* attemptClaimSwap(swap: SomeSwap) {
  const { id: swapId } = swap

  popupRegistry.addPopup(
    {
      type: PopupType.ClaimInProgress,
      count: 1,
    },
    `claim-in-progress-${swapId}`,
    DEFAULT_TXN_DISMISS_MS,
  )

  try {
    const ldsBridgeManager = getLdsBridgeManager()
    const claimedSwap = yield* call([ldsBridgeManager, ldsBridgeManager.autoClaimSwap], swapId)

    popupRegistry.removePopup(`claim-in-progress-${swapId}`)

    if (claimedSwap.claimTx) {
      // Use Erc20ChainSwap notification for all Chain swaps
      if (swap.type === SwapType.Chain) {
        const fromChainId = ASSET_CHAIN_ID_MAP[swap.assetSend]
        const toChainId = ASSET_CHAIN_ID_MAP[swap.assetReceive]

        const explorerUrl = getExplorerLink({
          chainId: toChainId,
          data: claimedSwap.claimTx,
          type: ExplorerDataType.TRANSACTION,
        })

        popupRegistry.addPopup(
          {
            type: PopupType.Erc20ChainSwap,
            id: claimedSwap.claimTx,
            fromChainId,
            toChainId,
            fromAsset: swap.assetSend,
            toAsset: swap.assetReceive,
            status: LdsBridgeStatus.Confirmed,
            url: explorerUrl,
          },
          claimedSwap.claimTx,
        )
      } else {
        // Reverse swap notification (traditional Bitcoin bridge)
        popupRegistry.addPopup(
          {
            type: PopupType.ClaimCompleted,
            count: 1,
          },
          `claim-completed-${swapId}`,
          DEFAULT_TXN_DISMISS_MS,
        )

        const direction =
          swap.assetReceive === 'cBTC' ? BitcoinBridgeDirection.BitcoinToCitrea : BitcoinBridgeDirection.CitreaToBitcoin

        popupRegistry.addPopup(
          {
            type: PopupType.BitcoinBridge,
            id: claimedSwap.claimTx,
            status: LdsBridgeStatus.Confirmed,
            direction,
          },
          claimedSwap.claimTx,
        )
      }
    }
  } catch (error) {
    popupRegistry.removePopup(`claim-in-progress-${swapId}`)
    // eslint-disable-next-line no-console
    console.error(`Failed to claim swap ${swapId}:`, error)
  }
}

function isSwapReadyForClaim(swap: SomeSwap): boolean {
  // Only chain swaps and reverse swaps can be claimed
  if (swap.type !== SwapType.Chain && swap.type !== SwapType.Reverse) {
    return false
  }

  // Must have TransactionServerConfirmed status
  if (swap.status !== LdsSwapStatus.TransactionServerConfirmed) {
    return false
  }

  // Must not already be claimed
  if (swap.claimTx) {
    return false
  }

  return true
}

function* pollForClaimableSwaps() {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const ldsBridgeManager = getLdsBridgeManager()
      const swaps = yield* call([ldsBridgeManager, ldsBridgeManager.getSwaps])

      const claimableSwaps = Object.values(swaps).filter(isSwapReadyForClaim)

      if (claimableSwaps.length > 0) {
        // eslint-disable-next-line no-console
        console.log(`Found ${claimableSwaps.length} swap(s) ready for claim`)

        // Attempt to claim each swap sequentially
        for (const swap of claimableSwaps) {
          yield* call(attemptClaimSwap, swap)
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error polling for claimable swaps:', error)
    }

    // Wait before next poll
    yield* delay(POLLING_INTERVAL)
  }
}

export function* watchClaimableSwaps() {
  yield* spawn(pollForClaimableSwaps)
}
