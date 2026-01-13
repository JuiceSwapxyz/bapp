import { MMKV } from 'react-native-mmkv'
import type { SomeSwap } from 'uniswap/src/features/lds-bridge/lds-types/storage'

const LDS_BRIDGE_STORAGE_KEY = 'lds-bridge-swaps'

const mmkv = new MMKV()

class StorageManager {
  async getSwaps(): Promise<Record<string, SomeSwap>> {
    const swapsJson = mmkv.getString(LDS_BRIDGE_STORAGE_KEY)
    if (!swapsJson) {
      return {}
    }
    try {
      return JSON.parse(swapsJson) as Record<string, SomeSwap>
    } catch {
      return {}
    }
  }

  async getSwap(id: string): Promise<SomeSwap | undefined> {
    const swaps = await this.getSwaps()
    return swaps[id]
  }

  async setSwap(id: string, swap: SomeSwap): Promise<void> {
    const swaps = await this.getSwaps()
    swaps[id] = swap
    mmkv.set(LDS_BRIDGE_STORAGE_KEY, JSON.stringify(swaps))
  }

  async deleteSwap(id: string): Promise<void> {
    const swaps = await this.getSwaps()
    delete swaps[id]
    mmkv.set(LDS_BRIDGE_STORAGE_KEY, JSON.stringify(swaps))
  }

  async clear(): Promise<void> {
    mmkv.delete(LDS_BRIDGE_STORAGE_KEY)
  }
}

export { StorageManager }
