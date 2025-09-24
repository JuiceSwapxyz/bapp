import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { useAccount } from 'hooks/useAccount'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

import { CampaignProgress, SwapTaskCompletion, bAppsCampaignAPI } from 'services/bappsCampaign/api'

/**
 * Hook to fetch and manage campaign progress
 */
export function useBAppsCampaignProgress() {
  const account = useAccount()
  const { defaultChainId } = useEnabledChains()
  const [progress, setProgress] = useState<CampaignProgress | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch campaign progress
  const fetchProgress = useCallback(async () => {
    if (!account.address || defaultChainId !== UniverseChainId.CitreaTestnet) {
      setProgress(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await bAppsCampaignAPI.getCampaignProgress(account.address, defaultChainId)
      setProgress(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch campaign progress')
      // Use default progress as fallback
      const defaultProgress = await bAppsCampaignAPI.getCampaignProgress(account.address, defaultChainId)
      setProgress(defaultProgress)
    } finally {
      setLoading(false)
    }
  }, [account.address, defaultChainId])

  // Submit task completion
  const submitTaskCompletion = useCallback(
    async (taskId: number, txHash: string): Promise<boolean> => {
      if (!account.address) {
        return false
      }

      const completion: SwapTaskCompletion = {
        walletAddress: account.address,
        taskId,
        txHash,
        chainId: defaultChainId,
        timestamp: new Date().toISOString(),
      }

      const success = await bAppsCampaignAPI.submitTaskCompletion(completion)

      // Don't refresh here - will be done in trackSwapCompletion

      return success
    },
    [account.address, defaultChainId],
  )

  // Check if a swap completed a task with enhanced status handling
  const checkSwapTaskCompletion = useCallback(
    async (params: {
      txHash: string
      inputToken?: string
      outputToken?: string
      retryCount?: number
    }): Promise<number | null> => {
      const { txHash, inputToken, outputToken, retryCount = 0 } = params
      if (!account.address) {
        return null
      }

      const result = await bAppsCampaignAPI.checkSwapTaskCompletion({
        txHash,
        walletAddress: account.address,
        chainId: defaultChainId,
        inputToken,
        outputToken,
      })

      // Status information is available in result.status, result.message, and result.confirmations

      // Handle different statuses
      if (result.status === 'pending') {
        // Implement automatic retry with exponential backoff
        if (retryCount < 10) {
          // Max 10 retries
          const delay = Math.min(1000 * Math.pow(1.5, retryCount), 10000) // Max 10 seconds
          await new Promise((resolve) => setTimeout(resolve, delay))
          return checkSwapTaskCompletion({ txHash, inputToken, outputToken, retryCount: retryCount + 1 })
        }

        // Max retries reached, transaction still pending
        return null
      }

      if (result.status === 'failed' || result.status === 'not_found') {
        // Transaction check failed
        return null
      }

      // Only return taskId if confirmed and valid
      if (result.status === 'confirmed' && result.taskId) {
        // Task confirmed - DON'T refresh here, will be done in trackSwapCompletion
        return result.taskId
      }

      return null
    },
    [account.address, defaultChainId],
  )

  // Fetch progress on mount and when dependencies change
  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  // Listen for campaign update events
  useEffect(() => {
    const handleCampaignUpdate = () => {
      fetchProgress()
    }

    window.addEventListener('bapps-campaign-updated', handleCampaignUpdate)
    return () => {
      window.removeEventListener('bapps-campaign-updated', handleCampaignUpdate)
    }
  }, [fetchProgress])

  // Refetch progress every 15 seconds if wallet is connected
  // More frequent polling since API now automatically indexes blockchain data
  useEffect(() => {
    if (!account.address || defaultChainId !== UniverseChainId.CitreaTestnet) {
      return undefined
    }

    const interval = setInterval(() => {
      fetchProgress()
    }, 15000) // 15 seconds

    return () => clearInterval(interval)
  }, [account.address, defaultChainId, fetchProgress])

  return {
    progress,
    loading,
    error,
    refetch: fetchProgress,
    submitTaskCompletion,
    checkSwapTaskCompletion,
  }
}

/**
 * Hook to handle URL-based campaign override
 * Detects ?campaign=true/false and manages localStorage
 * @internal
 */
function useUrlCampaignOverride(): boolean {
  const [overrideActive, setOverrideActive] = useState(() => {
    return localStorage.getItem('campaignOverride') === 'true'
  })

  useEffect(() => {
    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const campaignParam = urlParams.get('campaign')

      if (campaignParam === 'true') {
        localStorage.setItem('campaignOverride', 'true')
        // Hard refresh to ensure all components re-render with new state
        window.location.href = window.location.pathname
        return
      }

      if (campaignParam === 'false') {
        localStorage.removeItem('campaignOverride')
        // Hard refresh to ensure all components re-render with new state
        window.location.href = window.location.pathname
        return
      }
    }

    // Check on mount
    checkUrlParams()

    // Listen for manual localStorage changes (from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'campaignOverride') {
        setOverrideActive(e.newValue === 'true')
      }
    }

    // Listen for URL changes (navigation)
    const handlePopState = () => {
      checkUrlParams()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return overrideActive
}

/**
 * Hook to check if campaign is currently active (time-based only)
 * @internal
 */
function useIsCampaignTimeActive(): boolean {
  const hasUrlOverride = useUrlCampaignOverride()

  // Campaign start time: September 25, 2025 at 00:00 UTC
  return useMemo(() => {
    // URL Override has priority - if active, campaign is always on
    if (hasUrlOverride) {
      return true
    }

    // Normal time-based logic
    const campaignStartTime = new Date('2025-09-25T00:00:00.000Z').getTime()
    const now = Date.now()
    return now >= campaignStartTime
  }, [hasUrlOverride])
}

/**
 * Hook to check if campaign features should be visible (no wallet requirement)
 */
export function useIsBAppsCampaignVisible(): boolean {
  const { defaultChainId } = useEnabledChains()
  const isCampaignTimeActive = useIsCampaignTimeActive()

  const isCorrectChain = defaultChainId === UniverseChainId.CitreaTestnet

  return isCampaignTimeActive && isCorrectChain
}

/**
 * Hook to check if campaign is available for user interaction (requires wallet)
 */
export function useIsBAppsCampaignAvailable(): boolean {
  const account = useAccount()
  const isCampaignVisible = useIsBAppsCampaignVisible()
  const isWalletConnected = account.isConnected

  return isCampaignVisible && isWalletConnected
}

/**
 * Hook to check if campaign is available (internal)
 * @internal
 */
function useIsBAppsCampaignAvailableInternal(): boolean {
  const { defaultChainId } = useEnabledChains()
  const account = useAccount()

  return defaultChainId === UniverseChainId.CitreaTestnet && account.isConnected
}

/**
 * Hook to track swap completion and update campaign progress
 */
export function useBAppsSwapTracking() {
  const { submitTaskCompletion, checkSwapTaskCompletion } = useBAppsCampaignProgress()
  const account = useAccount()
  const { defaultChainId } = useEnabledChains()

  const trackSwapCompletion = useCallback(
    async (params: { txHash: string; inputToken?: string; outputToken?: string }) => {
      const { txHash, inputToken, outputToken } = params
      // First check which task this swap completed (locally first, then API)
      const taskId = await checkSwapTaskCompletion({ txHash, inputToken, outputToken })

      if (taskId !== null) {
        // Task was identified by API
        await submitTaskCompletion(taskId, txHash)

        // Get updated progress to show in notification
        const updatedProgress = await bAppsCampaignAPI.getCampaignProgress(account.address!, defaultChainId)
        const completedTask = updatedProgress.tasks.find((t) => t.id === taskId)

        // Dispatch a custom event to trigger all hook instances to refetch
        window.dispatchEvent(new CustomEvent('bapps-campaign-updated'))

        if (completedTask) {
          // Show success notification with the updated progress
          popupRegistry.addPopup(
            {
              type: PopupType.CampaignTaskCompleted,
              taskName: completedTask.name,
              progress: updatedProgress.progress,
            },
            `campaign-task-${taskId}`,
            10000, // Show for 10 seconds
          )
        }

        return taskId
      }

      // No fallback mapping needed - API handles all task identification
      return null
    },
    [checkSwapTaskCompletion, submitTaskCompletion, account.address, defaultChainId],
  )

  return { trackSwapCompletion, isAvailable: useIsBAppsCampaignAvailableInternal() }
}

