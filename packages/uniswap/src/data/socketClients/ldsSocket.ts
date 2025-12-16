export enum LdsSwapStatus {
  SwapCreated = 'swap.created',
  TransactionMempool = 'transaction.mempool',
  TransactionConfirmed = 'transaction.confirmed',
}


export const createLdsSocketClient = () => {
  const socket = new WebSocket(`${process.env.REACT_APP_LDS_API_URL!.replace('https://', 'wss://')}/swap/v2/ws`)

  const listeners = new Map<string, (event: any) => void>()

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

  const subscribeToSwapUntil = async (swapId: string, status: LdsSwapStatus): Promise<any> => {
    await waitForConnection()
    
    socket.send(
      JSON.stringify({
        op: 'subscribe',
        channel: 'swap.update',
        args: [swapId],
      }),
    )

    const promise = new Promise((resolve) => {
      listeners.set(swapId, (event: any) => {
        if (event.status === status) {
          resolve(event)
          listeners.delete(swapId)
        }
      })
    })

    return promise
  }

  socket.onmessage = (event: MessageEvent) => {
    console.log('event', event)
    const data = JSON.parse(event.data)
    console.log('data', data)
    if (data.event === 'update' && data.channel === 'swap.update') {
      data.args.forEach((arg: any) => {
        if(arg?.id) {
          listeners.get(arg?.id)?.(arg)
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
