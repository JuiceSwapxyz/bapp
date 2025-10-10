import { useAccount } from 'hooks/useAccount'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBAppsCampaignProgress } from 'services/bappsCampaign/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

import { firstSqueezerCampaignAPI } from './api'
import { ConditionStatus, ConditionType, FirstSqueezerProgress, NFTClaimRequest } from './types'

/**
 * Hook to fetch and manage First Squeezer campaign progress
 */
export function useFirstSqueezerProgress() {
  const account = useAccount()
  const { defaultChainId } = useEnabledChains()
  const { progress: bAppsProgress } = useBAppsCampaignProgress()

  const [progress, setProgress] = useState<FirstSqueezerProgress | null>(null)
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
      const data = await firstSqueezerCampaignAPI.getProgress(account.address, defaultChainId)

      // Update bApps condition based on actual progress
      if (bAppsProgress) {
        const bAppsCondition = data.conditions.find((c) => c.type === ConditionType.BAPPS_COMPLETED)
        if (bAppsCondition) {
          const isCompleted = bAppsProgress.completedTasks === 3
          bAppsCondition.status = isCompleted ? ConditionStatus.COMPLETED : ConditionStatus.PENDING
          if (isCompleted && bAppsProgress.tasks[2]?.completedAt) {
            bAppsCondition.completedAt = bAppsProgress.tasks[2].completedAt
          }
        }

        // Recalculate progress
        const completedConditions = data.conditions.filter((c) => c.status === ConditionStatus.COMPLETED).length
        data.completedConditions = completedConditions
        data.progress = (completedConditions / data.totalConditions) * 100
        data.isEligibleForNFT = completedConditions === data.totalConditions && !data.nftMinted
      }

      setProgress(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch campaign progress')
    } finally {
      setLoading(false)
    }
  }, [account.address, defaultChainId, bAppsProgress])

  // Fetch progress on mount and when dependencies change
  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  // Listen for campaign update events
  useEffect(() => {
    const handleCampaignUpdate = () => {
      fetchProgress()
    }

    window.addEventListener('first-squeezer-campaign-updated', handleCampaignUpdate)
    return () => {
      window.removeEventListener('first-squeezer-campaign-updated', handleCampaignUpdate)
    }
  }, [fetchProgress])

  return {
    progress,
    loading,
    error,
    refetch: fetchProgress,
  }
}

/**
 * Hook to handle URL-based campaign override
 * Detects ?first-squeezer=true/false and manages localStorage
 * @internal
 */
function useUrlFirstSqueezerOverride(): boolean {
  const [overrideActive, setOverrideActive] = useState(() => {
    return localStorage.getItem('firstSqueezerOverride') === 'true'
  })

  useEffect(() => {
    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const firstSqueezerParam = urlParams.get('first-squeezer')

      if (firstSqueezerParam === 'true') {
        localStorage.setItem('firstSqueezerOverride', 'true')
        // Hard refresh to ensure all components re-render with new state
        window.location.href = window.location.pathname
        return
      }

      if (firstSqueezerParam === 'false') {
        localStorage.removeItem('firstSqueezerOverride')
        // Hard refresh to ensure all components re-render with new state
        window.location.href = window.location.pathname
        return
      }
    }

    // Check on mount
    checkUrlParams()

    // Listen for manual localStorage changes (from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'firstSqueezerOverride') {
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
function useIsFirstSqueezerTimeActive(): boolean {
  const hasUrlOverride = useUrlFirstSqueezerOverride()

  // Campaign start time: October 12, 2025 at 00:00 UTC
  return useMemo(() => {
    // URL Override has priority - if active, campaign is always on
    if (hasUrlOverride) {
      return true
    }

    // Normal time-based logic
    const campaignStartTime = new Date('2025-10-12T00:00:00.000Z').getTime()
    const now = Date.now()
    return now >= campaignStartTime
  }, [hasUrlOverride])
}

/**
 * Hook to check if campaign is currently visible
 */
export function useIsFirstSqueezerCampaignVisible(): boolean {
  const { defaultChainId } = useEnabledChains()
  const isCampaignTimeActive = useIsFirstSqueezerTimeActive()

  const isCorrectChain = defaultChainId === UniverseChainId.CitreaTestnet

  return isCampaignTimeActive && isCorrectChain
}

/**
 * Hook to check if campaign is available for user interaction (requires wallet)
 */
export function useIsFirstSqueezerCampaignAvailable(): boolean {
  const account = useAccount()
  const isCampaignVisible = useIsFirstSqueezerCampaignVisible()

  return isCampaignVisible && account.isConnected
}

/**
 * Hook to handle Discord verification
 * Currently uses localStorage - TODO: implement Discord OAuth
 */
export function useVerifySocial() {
  const account = useAccount()

  const manualVerifyDiscord = useCallback(() => {
    if (!account.address) {
      return
    }

    firstSqueezerCampaignAPI.manualVerifyDiscord(account.address)
    window.dispatchEvent(new CustomEvent('first-squeezer-campaign-updated'))
  }, [account.address])

  return {
    manualVerifyDiscord,
  }
}

/**
 * Hook to handle Twitter OAuth verification
 * Uses same-tab redirect (no popup)
 */
export function useTwitterOAuth() {
  const account = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startOAuth = useCallback(async () => {
    if (!account.address) {
      setError('Please connect your wallet first')
      return
    }

    setError(null)
    setIsLoading(true)

    // Clear any existing oauth_error param from URL
    const currentUrl = new URL(window.location.href)
    if (currentUrl.searchParams.has('oauth_error')) {
      currentUrl.searchParams.delete('oauth_error')
      window.history.replaceState({}, '', currentUrl.toString())
    }

    try {
      // Get OAuth URL from backend
      const { authUrl } = await firstSqueezerCampaignAPI.startTwitterOAuth(account.address)

      // Navigate to Twitter OAuth in same tab (page will unload, no need to set isLoading false)
      window.location.href = authUrl
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start Twitter verification'
      setError(errorMsg)
      setIsLoading(false)
    }
  }, [account.address])

  return {
    startOAuth,
    isLoading,
    error,
  }
}

/**
 * Hook to handle NFT claiming
 */
export function useClaimNFT() {
  const account = useAccount()
  const { defaultChainId } = useEnabledChains()
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [claimResult, setClaimResult] = useState<{ txHash?: string; tokenId?: string } | null>(null)

  const claim = useCallback(async () => {
    if (!account.address) {
      setError('Please connect your wallet first')
      return false
    }

    if (defaultChainId !== UniverseChainId.CitreaTestnet) {
      setError('Please switch to Citrea Testnet')
      return false
    }

    setIsClaiming(true)
    setError(null)
    setClaimResult(null)

    try {
      const request: NFTClaimRequest = {
        walletAddress: account.address,
        chainId: defaultChainId,
      }

      const result = await firstSqueezerCampaignAPI.claimNFT(request)

      if (result.success) {
        setClaimResult({
          txHash: result.txHash,
          tokenId: result.tokenId,
        })

        // Dispatch event to trigger progress refresh
        window.dispatchEvent(new CustomEvent('first-squeezer-campaign-updated'))
        return true
      } else {
        setError(result.error || 'NFT claim failed')
        return false
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'NFT claim failed'
      setError(errorMsg)
      return false
    } finally {
      setIsClaiming(false)
    }
  }, [account.address, defaultChainId])

  const reset = useCallback(() => {
    setError(null)
    setClaimResult(null)
  }, [])

  return {
    claim,
    reset,
    isClaiming,
    error,
    claimResult,
  }
}

/**
 * Hook to check eligibility for NFT claim
 */
export function useIsEligibleForNFT(): boolean {
  const { progress } = useFirstSqueezerProgress()

  return useMemo(() => {
    if (!progress) {
      return false
    }
    return progress.isEligibleForNFT
  }, [progress])
}

/**
 * Hook to check if NFT has been minted
 */
export function useHasClaimedNFT(): boolean {
  const { progress } = useFirstSqueezerProgress()

  return useMemo(() => {
    if (!progress) {
      return false
    }
    return progress.nftMinted
  }, [progress])
}
