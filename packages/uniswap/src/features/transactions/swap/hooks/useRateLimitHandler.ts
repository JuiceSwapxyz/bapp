import { useEffect } from 'react'
import { useSwapFormWarningStoreActions } from 'uniswap/src/features/transactions/swap/form/stores/swapFormWarningStore/useSwapFormWarningStore'

// Global rate limit state management
declare global {
  interface Window {
    __RATE_LIMIT_END_TIME__?: number
    __RATE_LIMIT_DURATION__?: number // Duration in seconds from API
    __RATE_LIMIT_TRIGGER__?: () => void
  }
  // eslint-disable-next-line no-var
  var __RATE_LIMIT_END_TIME__: number | undefined
  // eslint-disable-next-line no-var
  var __RATE_LIMIT_DURATION__: number | undefined
  // eslint-disable-next-line no-var
  var __RATE_LIMIT_TRIGGER__: (() => void) | undefined
}

/**
 * Hook that sets up a global rate limit error handler
 * This should be used at the root of the swap form to handle rate limit errors
 */
export function useRateLimitHandler(): void {
  const { handleShowRateLimitModal } = useSwapFormWarningStoreActions()

  useEffect(() => {
    // Register the global rate limit trigger function
    globalThis.__RATE_LIMIT_TRIGGER__ = (): void => {
      handleShowRateLimitModal()
    }

    return (): void => {
      // Clean up on unmount
      globalThis.__RATE_LIMIT_TRIGGER__ = undefined
    }
  }, [handleShowRateLimitModal])
}
