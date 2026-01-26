import { del, get, set } from 'idb-keyval'
import type { SomeSwap } from 'uniswap/src/features/lds-bridge/lds-types/storage'

const LDS_BRIDGE_STORAGE_KEY = 'lds-bridge-swaps'

class StorageManager {
  async getSwaps(): Promise<Record<string, SomeSwap>> {
    const swaps = await get<Record<string, SomeSwap>>(LDS_BRIDGE_STORAGE_KEY)
    return swaps ?? {}
  }

  async getSwap(id: string): Promise<SomeSwap | undefined> {
    const swaps = await this.getSwaps()
    return swaps[id]
  }

  async setSwap(id: string, swap: SomeSwap): Promise<void> {
    const swaps = await this.getSwaps()
    swaps[id] = swap
    await set(LDS_BRIDGE_STORAGE_KEY, swaps)
  }

  async deleteSwap(id: string): Promise<void> {
    const swaps = await this.getSwaps()
    delete swaps[id]
    await set(LDS_BRIDGE_STORAGE_KEY, swaps)
  }

  async clear(): Promise<void> {
    await del(LDS_BRIDGE_STORAGE_KEY)
  }
}

export { StorageManager }
