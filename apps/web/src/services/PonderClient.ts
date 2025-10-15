/**
 * PonderClient with automatic failover support
 * Inspired by the deuro project's Apollo Client fallback pattern, adapted for REST/fetch
 *
 * Handles 503 (syncing) responses by automatically switching to a backup URL.
 * Returns to primary URL after a 10-minute cooldown period.
 */

interface PonderClientConfig {
  primaryUrl: string
  fallbackUrl?: string
  timeout?: number
  maxRetries?: number
  retryDelay?: number
  fallbackCooldownMs?: number
}

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: any
}

export class PonderClient {
  private primaryUrl: string
  private fallbackUrl?: string
  private timeout: number
  private maxRetries: number
  private retryDelay: number
  private fallbackCooldownMs: number

  private usingFallback = false
  private fallbackStartTime: number | null = null

  constructor(config: PonderClientConfig) {
    this.primaryUrl = config.primaryUrl
    this.fallbackUrl = config.fallbackUrl
    this.timeout = config.timeout ?? 10000 // 10 seconds
    this.maxRetries = config.maxRetries ?? 2
    this.retryDelay = config.retryDelay ?? 1000 // 1 second
    this.fallbackCooldownMs = config.fallbackCooldownMs ?? 10 * 60 * 1000 // 10 minutes
  }

  /**
   * Make a request with automatic failover and retry logic
   */
  async request<T = any>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    // Check if we should switch back to primary URL
    this.checkFallbackCooldown()

    const currentUrl = this.getCurrentUrl()
    const url = `${currentUrl}${endpoint}`

    let lastError: Error | null = null

    // Retry loop
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, {
          method: config.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...config.headers,
          },
          body: config.body ? JSON.stringify(config.body) : undefined,
        })

        // Handle 503 - Ponder is syncing
        if (response.status === 503) {
          this.switchToFallback()

          // If we have a fallback and haven't tried it yet, retry with fallback
          if (this.usingFallback && this.fallbackUrl && attempt < this.maxRetries) {
            await this.delay(this.retryDelay)
            continue
          }

          throw new Error('Ponder is syncing (503)')
        }

        // Handle other error status codes
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        // Success - parse and return
        const data = await response.json()
        return data as T

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Only retry on network errors or 503
        const shouldRetry =
          error instanceof TypeError || // Network error
          (error instanceof Error && error.message.includes('503'))

        if (shouldRetry && attempt < this.maxRetries) {
          // Switch to fallback if available
          if (!this.usingFallback && this.fallbackUrl) {
            this.switchToFallback()
          }

          await this.delay(this.retryDelay)
          continue
        }

        // No more retries, throw error
        break
      }
    }

    throw lastError || new Error('Request failed after all retries')
  }

  /**
   * Convenience method for GET requests
   */
  async get<T = any>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers })
  }

  /**
   * Convenience method for POST requests
   */
  async post<T = any>(
    endpoint: string,
    config?: { body?: any; headers?: Record<string, string> }
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: config?.body,
      headers: config?.headers
    })
  }

  /**
   * Get current active URL (primary or fallback)
   */
  private getCurrentUrl(): string {
    if (this.usingFallback && this.fallbackUrl) {
      return this.fallbackUrl
    }
    return this.primaryUrl
  }

  /**
   * Switch to fallback URL
   */
  private switchToFallback(): void {
    if (!this.fallbackUrl || this.usingFallback) {
      return
    }

    this.usingFallback = true
    this.fallbackStartTime = Date.now()

    // Using console.warn for important runtime information about failover
    // eslint-disable-next-line no-console
    console.warn(
      `[PonderClient] Switching to fallback URL: ${this.fallbackUrl} ` +
      `(primary ${this.primaryUrl} is unavailable)`
    )
  }

  /**
   * Check if fallback cooldown period has elapsed
   */
  private checkFallbackCooldown(): void {
    if (!this.usingFallback || !this.fallbackStartTime) {
      return
    }

    const elapsed = Date.now() - this.fallbackStartTime

    if (elapsed >= this.fallbackCooldownMs) {
      this.usingFallback = false
      this.fallbackStartTime = null

      // Using console.info for important runtime information about recovery
      // eslint-disable-next-line no-console
      console.info(
        `[PonderClient] Cooldown period elapsed, switching back to primary URL: ${this.primaryUrl}`
      )
    }
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Reset to primary URL (useful for testing)
   */
  public resetToPrimary(): void {
    this.usingFallback = false
    this.fallbackStartTime = null
  }

  /**
   * Check if currently using fallback
   */
  public isUsingFallback(): boolean {
    return this.usingFallback
  }
}
