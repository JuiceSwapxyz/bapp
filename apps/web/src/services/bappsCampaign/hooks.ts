import { useAccount } from 'hooks/useAccount'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

import { CampaignProgress, bAppsCampaignAPI } from 'services/bappsCampaign/api'

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

  // Fetch progress on mount and when dependencies change
  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  // Listen for campaign update events
  useEffect(() => {
    const handleCampaignUpdate = () => {
      console.log('[Campaign Debug] Received bapps-campaign-updated event, fetching progress...')
      fetchProgress()
    }

    window.addEventListener('bapps-campaign-updated', handleCampaignUpdate)
    console.log('[Campaign Debug] Registered event listener for bapps-campaign-updated')
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
 * Hook to track swap completion for bApps campaign
 */
export function useBAppsSwapTracking() {
  const account = useAccount()
  const { defaultChainId } = useEnabledChains()
  const { refetch } = useBAppsCampaignProgress()

  const trackSwapCompletion = useCallback(
    async (params: { txHash: string; inputToken?: string; outputToken?: string }) => {
      const { inputToken, outputToken } = params

      console.log('[Campaign Debug] trackSwapCompletion called:', {
        inputToken,
        outputToken,
        account: account.address,
        chainId: defaultChainId,
      })

      if (!account.address || defaultChainId !== UniverseChainId.CitreaTestnet) {
        console.log('[Campaign Debug] Not on Citrea testnet or no account')
        return
      }

      // First check locally if we can identify the task
      if (inputToken && outputToken) {
        const taskId = bAppsCampaignAPI.getTaskIdFromTokenPair(inputToken, outputToken)
        console.log('[Campaign Debug] Task ID from token pair:', taskId)

        if (taskId !== null) {
          // Task identified locally - update localStorage immediately
          const storageKey = `campaign_progress_${account.address}_${defaultChainId}`
          const existingData = localStorage.getItem(storageKey)
          console.log('[Campaign Debug] Existing localStorage data:', existingData)

          if (existingData) {
            try {
              const progress = JSON.parse(existingData) as CampaignProgress
              const taskIndex = progress.tasks.findIndex((t) => t.id === taskId)

              if (taskIndex !== -1 && !progress.tasks[taskIndex].completed) {
                console.log('[Campaign Debug] Updating task as completed:', taskId)
                progress.tasks[taskIndex].completed = true
                progress.completedTasks++
                localStorage.setItem(storageKey, JSON.stringify(progress))
                console.log('[Campaign Debug] Updated localStorage:', progress)

                // Dispatch event to update UI immediately
                window.dispatchEvent(new CustomEvent('bapps-campaign-updated'))
                console.log('[Campaign Debug] Dispatched bapps-campaign-updated event')
              } else {
                console.log('[Campaign Debug] Task already completed or not found:', { taskIndex, taskId })
              }
            } catch (error) {
              console.error('[Campaign Debug] Error updating localStorage:', error)
            }
          }
        }
      }

      // Also update from API in background (for cross-device sync)
      refetch()
    },
    [account.address, defaultChainId, refetch],
  )

  return {
    trackSwapCompletion,
  }
}
