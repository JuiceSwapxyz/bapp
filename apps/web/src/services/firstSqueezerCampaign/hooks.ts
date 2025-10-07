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
 * Hook to check if campaign is currently visible
 */
export function useIsFirstSqueezerCampaignVisible(): boolean {
  const { defaultChainId } = useEnabledChains()

  // Campaign is visible on Citrea Testnet
  // TODO: Add time-based logic if needed
  return defaultChainId === UniverseChainId.CitreaTestnet
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
 * Hook to handle social verification
 */
export function useVerifySocial() {
  const account = useAccount()
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verify = useCallback(
    async (type: 'twitter' | 'discord') => {
      if (!account.address) {
        setError('Please connect your wallet first')
        return false
      }

      setIsVerifying(true)
      setError(null)

      try {
        const result = await firstSqueezerCampaignAPI.verifySocial({
          walletAddress: account.address,
          type,
        })

        if (result.success) {
          // Dispatch event to trigger progress refresh
          window.dispatchEvent(new CustomEvent('first-squeezer-campaign-updated'))
          return true
        } else {
          setError(result.error || 'Verification failed')
          return false
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Verification failed'
        setError(errorMsg)
        return false
      } finally {
        setIsVerifying(false)
      }
    },
    [account.address],
  )

  const manualVerify = useCallback(
    (type: 'twitter' | 'discord') => {
      if (!account.address) {
        setError('Please connect your wallet first')
        return
      }

      firstSqueezerCampaignAPI.manualVerify(type, account.address)
      window.dispatchEvent(new CustomEvent('first-squeezer-campaign-updated'))
    },
    [account.address],
  )

  return {
    verify,
    manualVerify,
    isVerifying,
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
