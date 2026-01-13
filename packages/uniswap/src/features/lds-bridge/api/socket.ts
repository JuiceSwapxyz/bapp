import type { SwapUpdateEvent, WebSocketMessage } from '../lds-types/websocket'

export const createLdsSocketClient = (): {
  disconnect: () => void
  subscribeToSwapUpdates: (swapId: string, callback: (event: SwapUpdateEvent) => void) => () => void
  unsubscribeFromSwapUpdates: (callback: (event: SwapUpdateEvent) => void) => void
} => {
  const apiUrl = process.env.REACT_APP_LDS_API_URL
  if (!apiUrl) {
    throw new Error('REACT_APP_LDS_API_URL is not defined')
  }
  const socket = new WebSocket(`${apiUrl.replace('https://', 'wss://')}/swap/v2/ws`)
  const suscribedSwaps = new Set<string>()
  const listeners = new Map<string, Set<(event: SwapUpdateEvent) => void>>()

  const waitForConnection = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (socket.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      socket.addEventListener('open', () => resolve(), { once: true })
      socket.addEventListener('error', (error) => reject(error), { once: true })
    })
  }

  const subscribeToSwapUpdates = (swapId: string, callback: (event: SwapUpdateEvent) => void): (() => void) => {
    if (!suscribedSwaps.has(swapId)) {
      suscribedSwaps.add(swapId)
      socket.send(
        JSON.stringify({
          op: 'subscribe',
          channel: 'swap.update',
          args: [swapId],
        }),
      )
    }
    if (!listeners.has(swapId)) {
      listeners.set(swapId, new Set())
    }
    listeners.get(swapId)!.add(callback)

    // Return unsubscribe function
    return () => {
      unsubscribeFromSwapUpdates(callback)
    }
  }

  const unsubscribeFromSwapUpdates = (callback: (event: SwapUpdateEvent) => void): void => {
    listeners.forEach((callbackSet, swapId) => {
      callbackSet.delete(callback)
      if (callbackSet.size === 0) {
        listeners.delete(swapId)
      }
    })
  }

  socket.onmessage = (event: MessageEvent): void => {
    const data = JSON.parse(event.data) as WebSocketMessage
    if (data.event === 'update' && data.channel === 'swap.update') {
      data.args.forEach((arg: SwapUpdateEvent) => {
        if (arg.id) {
          listeners.get(arg.id)?.forEach((callback) => callback(arg))
        }
      })
    }
  }

  const disconnect = (): void => {
    socket.close()
  }

  return {
    disconnect,
    subscribeToSwapUpdates,
    unsubscribeFromSwapUpdates,
  }
}
