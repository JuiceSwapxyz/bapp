import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import { FetchError } from 'uniswap/src/data/apiClients/FetchError'

const FALLBACK_TIMEOUT_MS = 10 * 60 * 1000

type ApiClient = ReturnType<typeof createApiClient>

function wrapApiClientWithFallback(primaryClient: ApiClient, fallbackClient: ApiClient): ApiClient {
  let usingFallback = false
  let fallbackUntil: number | null = null
  let switchBackTimer: NodeJS.Timeout | null = null

  const shouldUseFallback = (): boolean => {
    if (!usingFallback) {
      return false
    }
    if (fallbackUntil && Date.now() >= fallbackUntil) {
      usingFallback = false
      fallbackUntil = null
      return false
    }
    return true
  }

  const switchToFallback = (): void => {
    if (usingFallback) {
      return
    }

    usingFallback = true
    fallbackUntil = Date.now() + FALLBACK_TIMEOUT_MS

    if (switchBackTimer) {
      clearTimeout(switchBackTimer)
    }

    switchBackTimer = setTimeout(() => {
      usingFallback = false
      fallbackUntil = null
      switchBackTimer = null
    }, FALLBACK_TIMEOUT_MS)
  }

  const handleRequest = async <T>(requestFn: (client: ApiClient) => Promise<T>): Promise<T> => {
    try {
      const client = shouldUseFallback() ? fallbackClient : primaryClient
      return await requestFn(client)
    } catch (error) {
      if (error instanceof FetchError && error.response.status === 503) {
        switchToFallback()
        return await requestFn(fallbackClient)
      }
      throw error
    }
  }

  return {
    get fetch() {
      return (path: string, options: Parameters<ApiClient['fetch']>[1]) => {
        return handleRequest((client) => client.fetch(path, options))
      }
    },

    get get() {
      return <T>(path: string, options?: Parameters<ApiClient['get']>[1]): Promise<T> => {
        return handleRequest((client) => client.get<T>(path, options))
      }
    },

    get post() {
      return <T>(path: string, options: Parameters<ApiClient['post']>[1]): Promise<T> => {
        return handleRequest((client) => client.post<T>(path, options))
      }
    },

    get put() {
      return <T>(path: string, options: Parameters<ApiClient['put']>[1]): Promise<T> => {
        return handleRequest((client) => client.put<T>(path, options))
      }
    },

    get delete() {
      return <T>(path: string, options?: Parameters<ApiClient['delete']>[1]): Promise<T> => {
        return handleRequest((client) => client.delete<T>(path, options ?? {}))
      }
    },
  }
}

export const createApiClientWithFallback = (primaryUrl: string, fallbackUrl: string): ApiClient => {
  const primaryClient = createApiClient({ baseUrl: primaryUrl })
  const fallbackClient = createApiClient({ baseUrl: fallbackUrl })

  return wrapApiClientWithFallback(primaryClient, fallbackClient)
}
