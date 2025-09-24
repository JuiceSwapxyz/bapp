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

class BAppsCampaignAPI {
  private baseUrl: string

  constructor() {
    this.baseUrl = BAPPS_API_BASE_URL
  }

  /**
   * Fetch campaign progress for a wallet address
   * Prioritizes API data since Ponder automatically indexes blockchain data
   */
  async getCampaignProgress(walletAddress: string, chainId: UniverseChainId): Promise<CampaignProgress> {
    // Get local progress as fallback
    const localProgress = this.getDefaultProgress(walletAddress, chainId)

    // Try API first since it has the most up-to-date blockchain data
    if (this.baseUrl && this.baseUrl !== 'offline') {
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

        const apiProgress = await response.json()

        // API data is authoritative since it's directly from blockchain
        // But merge with local structure to ensure consistency
        return this.mergeProgress(localProgress, apiProgress)
      } catch (error) {
        // API error, use local progress
        // Campaign API unavailable, using local progress as fallback
        return localProgress
      }
    }

    // Offline mode - use local progress only
    return localProgress
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
