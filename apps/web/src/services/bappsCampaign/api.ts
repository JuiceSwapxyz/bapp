import { UniverseChainId } from 'uniswap/src/features/chains/types'

// API endpoints for bApps campaign
const BAPPS_API_BASE_URL = process.env.REACT_APP_BAPPS_API_URL || 'https://dev.ponder.deuro.com'

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
   */
  async getCampaignProgress(walletAddress: string, chainId: UniverseChainId): Promise<CampaignProgress> {
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
      return data as CampaignProgress
    } catch (error) {
      // Error is handled by returning default progress
      // Fallback to default structure
      return this.getDefaultProgress(walletAddress, chainId)
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
   */
  async checkSwapTaskCompletion(
    txHash: string,
    walletAddress: string,
    chainId: UniverseChainId,
  ): Promise<number | null> {
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
      return data.taskId || null
    } catch (error) {
      // Error is handled by returning null
      return null
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
}

// Export singleton instance
export const bAppsCampaignAPI = new BAppsCampaignAPI()
