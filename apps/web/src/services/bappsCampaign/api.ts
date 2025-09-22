import { UniverseChainId } from 'uniswap/src/features/chains/types'

// API endpoints for bApps campaign
const BAPPS_API_BASE_URL = process.env.REACT_APP_BAPPS_API_URL || 'https://ponder.juiceswap.com'

// eslint-disable-next-line import/no-unused-modules
export interface CampaignTask {
  id: number
  name: string
  description?: string
  completed: boolean
  completedAt?: string
  txHash?: string
}

export interface CampaignProgress {
  walletAddress: string
  chainId: UniverseChainId
  tasks: CampaignTask[]
  totalTasks: number
  completedTasks: number
  progress: number
  nftClaimed?: boolean
  claimTxHash?: string
}

export interface SwapTaskCompletion {
  walletAddress: string
  taskId: number
  txHash: string
  chainId: UniverseChainId
  timestamp: string
}

class BAppsCampaignAPI {
  private baseUrl: string

  constructor() {
    this.baseUrl = BAPPS_API_BASE_URL
  }

  /**
   * Fetch campaign progress for a wallet address
   * First checks local storage, then optionally syncs with API
   */
  async getCampaignProgress(walletAddress: string, chainId: UniverseChainId): Promise<CampaignProgress> {
    // Always get local progress first
    const localProgress = this.getDefaultProgress(walletAddress, chainId)

    // Check if we should try to sync with API
    // Only sync if we haven't synced recently (e.g., within last hour)
    const lastSyncKey = `citrea_bapps_last_sync_${walletAddress}`
    const lastSync = localStorage.getItem(lastSyncKey)
    const shouldSync = !lastSync || Date.now() - parseInt(lastSync) > 3600000 // 1 hour

    if (!shouldSync || !this.baseUrl || this.baseUrl === 'offline') {
      return localProgress
    }

    try {
      const response = await fetch(`${this.baseUrl}/campaign/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          chainId,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch campaign progress: ${response.status}`)
      }

      const data = await response.json()

      // Merge API data with local data (local takes priority for completed tasks)
      const mergedProgress = this.mergeProgress(localProgress, data)

      // Update last sync time
      localStorage.setItem(lastSyncKey, Date.now().toString())

      return mergedProgress
    } catch (error) {
      // API error, use local progress
      return localProgress
    }
  }

  /**
   * Submit a completed swap task
   */
  async submitTaskCompletion(completion: SwapTaskCompletion): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/campaign/complete-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completion),
      })

      if (!response.ok) {
        throw new Error(`Failed to submit task completion: ${response.status}`)
      }

      return true
    } catch (error) {
      // Error is handled by fallback to localStorage
      // Store in localStorage as fallback
      this.storeLocalCompletion(completion)
      return false
    }
  }

  /**
   * Check if a specific swap transaction completed a task
   * Uses local validation based on token pairs
   */
  async checkSwapTaskCompletion(params: {
    txHash: string
    walletAddress: string
    chainId: UniverseChainId
    inputToken?: string
    outputToken?: string
  }): Promise<{
    taskId: number | null
    status?: 'pending' | 'confirmed' | 'failed' | 'not_found' | 'error'
    message?: string
    confirmations?: number
  }> {
    const { txHash, walletAddress, chainId, inputToken, outputToken } = params

    // Local validation based on token pairs
    if (inputToken && outputToken) {
      const taskId = this.getTaskIdFromTokenPair(inputToken, outputToken)
      if (taskId !== null) {
        return {
          taskId,
          status: 'confirmed',
          message: 'Task completed locally',
        }
      }
    }

    // If API is available and we don't have local token info, try API
    if (this.baseUrl && this.baseUrl !== 'offline') {
      try {
        const response = await fetch(`${this.baseUrl}/campaign/check-swap`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            txHash,
            walletAddress,
            chainId,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to check swap task: ${response.status}`)
        }

        const data = await response.json()

        return {
          taskId: data.taskId || null,
          status: data.status || 'error',
          message: data.message,
          confirmations: data.confirmations,
        }
      } catch (error) {
        // API error, continue with local check
      }
    }

    return {
      taskId: null,
      status: 'not_found',
      message: 'Swap does not match any campaign task',
    }
  }

  /**
   * Get default progress structure
   */
  private getDefaultProgress(walletAddress: string, chainId: UniverseChainId): CampaignProgress {
    // Check localStorage for any saved progress
    const localTasks = this.getLocalCompletedTasks(walletAddress)

    const tasks: CampaignTask[] = [
      {
        id: 1,
        name: 'Swap cBTC to NUSD',
        description: 'Complete a swap from cBTC to NUSD',
        completed: localTasks.includes(1),
      },
      {
        id: 2,
        name: 'Swap cBTC to cUSD',
        description: 'Complete a swap from cBTC to cUSD',
        completed: localTasks.includes(2),
      },
      {
        id: 3,
        name: 'Swap cBTC to USDC',
        description: 'Complete a swap from cBTC to USDC',
        completed: localTasks.includes(3),
      },
    ]

    const completedTasks = tasks.filter((t) => t.completed).length

    return {
      walletAddress,
      chainId,
      tasks,
      totalTasks: tasks.length,
      completedTasks,
      progress: (completedTasks / tasks.length) * 100,
      nftClaimed: false,
    }
  }

  /**
   * Store completion in localStorage as fallback
   */
  private storeLocalCompletion(completion: SwapTaskCompletion): void {
    try {
      const key = `citrea_bapps_completed_${completion.walletAddress}`
      const stored = localStorage.getItem(key)
      const tasks = stored ? JSON.parse(stored) : []

      if (!tasks.includes(completion.taskId)) {
        tasks.push(completion.taskId)
        localStorage.setItem(key, JSON.stringify(tasks))
      }

      // Also store the full completion details
      const detailsKey = `citrea_bapps_details_${completion.walletAddress}_${completion.taskId}`
      localStorage.setItem(detailsKey, JSON.stringify(completion))
    } catch (error) {
      // Silently fail for localStorage errors
    }
  }

  /**
   * Get locally stored completed tasks
   */
  private getLocalCompletedTasks(walletAddress: string): number[] {
    try {
      const key = `citrea_bapps_completed_${walletAddress}`
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  /**
   * Clear local storage for a wallet
   */
  clearLocalProgress(walletAddress: string): void {
    try {
      const key = `citrea_bapps_completed_${walletAddress}`
      localStorage.removeItem(key)

      // Clear task details
      for (let i = 1; i <= 3; i++) {
        const detailsKey = `citrea_bapps_details_${walletAddress}_${i}`
        localStorage.removeItem(detailsKey)
      }
    } catch (error) {
      // Silently fail for localStorage errors
    }
  }

  /**
   * Determine task ID from token pair
   */
  private getTaskIdFromTokenPair(inputToken: string, outputToken: string): number | null {
    // Native token (cBTC) or wrapped BTC
    const isCBTCInput =
      inputToken.toLowerCase() === 'eth' ||
      inputToken.toLowerCase() === 'native' ||
      inputToken.toLowerCase() === '0x4370e27f7d91d9341bff232d7ee8bdfe3a9933a0' // WcBTC address

    if (!isCBTCInput) {
      return null
    }

    // Check output token
    const outputLower = outputToken.toLowerCase()

    // Task 1: cBTC to NUSD
    if (outputLower === '0x9b28b690550522608890c3c7e63c0b4a7ebab9aa') {
      return 1
    }
    // Task 2: cBTC to cUSD
    if (outputLower === '0x2ffc18ac99d367b70dd922771df8c2074af4ace0') {
      return 2
    }
    // Task 3: cBTC to USDC
    if (outputLower === '0x36c16eac6b0ba6c50f494914ff015fca95b7835f') {
      return 3
    }

    return null
  }

  /**
   * Merge local and API progress (local takes priority for completed tasks)
   */
  private mergeProgress(localProgress: CampaignProgress, apiProgress: any): CampaignProgress {
    const mergedTasks = localProgress.tasks.map((localTask) => {
      const apiTask = apiProgress.tasks?.find((t: any) => t.id === localTask.id)
      // If task is completed locally, keep it completed
      if (localTask.completed) {
        return localTask
      }
      // Otherwise use API status if available
      return apiTask || localTask
    })

    const completedTasks = mergedTasks.filter((t) => t.completed).length

    return {
      ...localProgress,
      tasks: mergedTasks,
      completedTasks,
      progress: (completedTasks / mergedTasks.length) * 100,
      nftClaimed: apiProgress.nftClaimed || localProgress.nftClaimed,
      claimTxHash: apiProgress.claimTxHash || localProgress.claimTxHash,
    }
  }
}

// Export singleton instance
export const bAppsCampaignAPI = new BAppsCampaignAPI()
