import { useAccount } from 'hooks/useAccount'
import { useCallback, useEffect, useState } from 'react'
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

      // Refresh progress after submission
      if (success) {
        await fetchProgress()
      }

      return success
    },
    [account.address, defaultChainId, fetchProgress],
  )

  // Check if a swap completed a task
  const checkSwapTaskCompletion = useCallback(
    async (txHash: string): Promise<number | null> => {
      if (!account.address) {
        return null
      }

      const taskId = await bAppsCampaignAPI.checkSwapTaskCompletion(txHash, account.address, defaultChainId)

      // If a task was completed, refresh progress
      if (taskId !== null) {
        await fetchProgress()
      }

      return taskId
    },
    [account.address, defaultChainId, fetchProgress],
  )

  // Fetch progress on mount and when dependencies change
  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  // Refetch progress every 30 seconds if wallet is connected
  useEffect(() => {
    if (!account.address || defaultChainId !== UniverseChainId.CitreaTestnet) {
      return
    }

    const interval = setInterval(() => {
      fetchProgress()
    }, 30000) // 30 seconds

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
 * Hook to check if campaign is available
 */
export function useIsBAppsCampaignAvailable(): boolean {
  const { defaultChainId } = useEnabledChains()
  const account = useAccount()

  return defaultChainId === UniverseChainId.CitreaTestnet && account.isConnected
}

/**
 * Hook to track swap completion and update campaign progress
 */
export function useBAppsSwapTracking() {
  const { submitTaskCompletion, checkSwapTaskCompletion } = useBAppsCampaignProgress()

  const trackSwapCompletion = useCallback(
    async (txHash: string, inputToken?: string, outputToken?: string) => {
      // First check with API which task this swap completed
      const taskId = await checkSwapTaskCompletion(txHash)

      if (taskId !== null) {
        // Task was identified by API
        await submitTaskCompletion(taskId, txHash)
        return taskId
      }

      // Fallback: Try to identify task based on tokens
      if (!inputToken || !outputToken) {
        return null
      }

      // Map token pairs to task IDs
      const taskMapping: Record<string, number> = {
        NATIVE_NUSD: 1, // cBTC to NUSD
        NATIVE_cUSD: 2, // cBTC to cUSD
        NATIVE_USDC: 3, // cBTC to USDC
      }

      const key = `${inputToken}_${outputToken}`
      const mappedTaskId = taskMapping[key]

      if (mappedTaskId) {
        await submitTaskCompletion(mappedTaskId, txHash)
        return mappedTaskId
      }

      return null
    },
    [checkSwapTaskCompletion, submitTaskCompletion],
  )

  return { trackSwapCompletion }
}
