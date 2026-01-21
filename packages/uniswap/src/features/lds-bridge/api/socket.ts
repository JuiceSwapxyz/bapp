import type { SwapUpdateEvent, WebSocketMessage } from 'uniswap/src/features/lds-bridge/lds-types/websocket'

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
  const subscribedSwaps = new Set<string>()
  const pendingSubscriptions = new Set<string>()
  const listeners = new Map<string, Set<(event: SwapUpdateEvent) => void>>()
  let connectionPromise: Promise<void> | null = null

  const waitForConnection = (): Promise<void> => {
    if (connectionPromise) {
      return connectionPromise
    }

    connectionPromise = new Promise((resolve, reject) => {
      if (socket.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      socket.addEventListener('open', () => resolve(), { once: true })
      socket.addEventListener('error', (error) => reject(error), { once: true })
    })

    return connectionPromise
  }

  const sendSubscription = async (swapId: string): Promise<void> => {
    try {
      await waitForConnection()
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            op: 'subscribe',
            channel: 'swap.update',
            args: [swapId],
          }),
        )
        subscribedSwaps.add(swapId)
        pendingSubscriptions.delete(swapId)
        // eslint-disable-next-line no-console
        console.log('[WebSocket] Subscribed to swap updates:', swapId)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[WebSocket] Failed to subscribe:', swapId, error)
      pendingSubscriptions.delete(swapId)
    }
  }

  const subscribeToSwapUpdates = (swapId: string, callback: (event: SwapUpdateEvent) => void): (() => void) => {
    if (!subscribedSwaps.has(swapId) && !pendingSubscriptions.has(swapId)) {
      pendingSubscriptions.add(swapId)
      // Send subscription asynchronously (don't block)
      void sendSubscription(swapId)
    }
    if (!listeners.has(swapId)) {
      listeners.set(swapId, new Set())
    }
    const swapListeners = listeners.get(swapId)
    if (swapListeners) {
      swapListeners.add(callback)
    }

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
