export enum LdsSwapStatus {
  SwapCreated = 'swap.created',
  TransactionMempool = 'transaction.mempool',
  TransactionConfirmed = 'transaction.confirmed',
}

export interface SwapUpdateEvent {
  id?: string
  status: LdsSwapStatus
}

interface WebSocketMessage {
  event: string
  channel: string
  args: SwapUpdateEvent[]
}

export const createLdsSocketClient = (): {
  subscribeToSwapUntil: (swapId: string, status: LdsSwapStatus) => Promise<SwapUpdateEvent>
  disconnect: () => void
} => {
  const apiUrl = process.env.REACT_APP_LDS_API_URL
  if (!apiUrl) {
    throw new Error('REACT_APP_LDS_API_URL is not defined')
  }
  const socket = new WebSocket(`${apiUrl.replace('https://', 'wss://')}/swap/v2/ws`)

  const listeners = new Map<string, (event: SwapUpdateEvent) => void>()

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

  const subscribeToSwapUntil = async (swapId: string, status: LdsSwapStatus): Promise<SwapUpdateEvent> => {
    await waitForConnection()

    socket.send(
      JSON.stringify({
        op: 'subscribe',
        channel: 'swap.update',
        args: [swapId],
      }),
    )

    const promise = new Promise<SwapUpdateEvent>((resolve) => {
      listeners.set(swapId, (event: SwapUpdateEvent) => {
        if (event.status === status) {
          resolve(event)
          listeners.delete(swapId)
        }
      })
    })

    return promise
  }

  socket.onmessage = (event: MessageEvent): void => {
    const data = JSON.parse(event.data) as WebSocketMessage
    if (data.event === 'update' && data.channel === 'swap.update') {
      data.args.forEach((arg: SwapUpdateEvent) => {
        if (arg.id) {
          listeners.get(arg.id)?.(arg)
        }
      })
    }
  }

  const disconnect = (): void => {
    socket.close()
  }

  return {
    subscribeToSwapUntil,
    disconnect,
  }
}
