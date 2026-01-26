import type { SomeSwap } from 'uniswap/src/features/lds-bridge/lds-types/storage'

export type SwapChangeListener = (swaps: Record<string, SomeSwap>) => void

export class SwapEventEmitter {
  private listeners: Set<SwapChangeListener> = new Set()

  protected notifyListeners(swaps: Record<string, SomeSwap>): void {
    this.listeners.forEach((listener) => listener(swaps))
  }

  addSwapChangeListener(listener: SwapChangeListener): void {
    this.listeners.add(listener)
  }

  removeSwapChangeListener(listener: SwapChangeListener): void {
    this.listeners.delete(listener)
  }
}
