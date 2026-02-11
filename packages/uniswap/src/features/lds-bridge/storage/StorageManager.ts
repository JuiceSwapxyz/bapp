import { saveBridgeSwap } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import type { SomeSwap } from 'uniswap/src/features/lds-bridge/lds-types/storage'
import { LocalStorageBackup } from './LocalStorageBackup'
import { CreateBridgeSwapRequest } from 'uniswap/src/data/tradingApi/types'

class StorageManager extends LocalStorageBackup {
  async setSwap(id: string, swap: SomeSwap): Promise<void> {
    
    try {
      if (swap.version >= 4) {
        await saveBridgeSwap(swap as CreateBridgeSwapRequest)
      }
    } catch (error) {
      console.error('Error saving swap:', error)
    }

    await super.setSwap(id, swap)
  }
}

export { StorageManager }
