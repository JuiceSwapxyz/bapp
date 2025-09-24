import { useAccount } from 'hooks/useAccount'
import { useCallback, useEffect, useState } from 'react'
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
  }
}

/**
 * Hook to check if campaign is available
 * @internal
 */
function useIsBAppsCampaignAvailable(): boolean {
  const { defaultChainId } = useEnabledChains()
  const account = useAccount()

  return defaultChainId === UniverseChainId.CitreaTestnet && account.isConnected
}

// eslint-disable-next-line import/no-unused-modules
export { useIsBAppsCampaignAvailable }
