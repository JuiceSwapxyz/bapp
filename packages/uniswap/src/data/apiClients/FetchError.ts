export class FetchError extends Error {
  response: Response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
  retryAfter?: number // Time in seconds to wait before retrying

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ response, data, cause }: { response: Response; data?: any; cause?: unknown }) {
    super(`Response status: ${response.status}`)
    this.name = 'FetchError'
    this.response = response
    this.data = data
    this.cause = cause

    // Extract retryAfter from response body or Retry-After header
    if (data?.retryAfter && typeof data.retryAfter === 'number') {
      this.retryAfter = data.retryAfter
    } else {
      const retryAfterHeader = response.headers.get('Retry-After')
      if (retryAfterHeader) {
        const parsed = parseInt(retryAfterHeader, 10)
        if (!isNaN(parsed)) {
          this.retryAfter = parsed
        }
      }
    }
  }
}

export function isRateLimitFetchError(error: unknown): boolean {
  return (
    error instanceof FetchError &&
    !!error.response.status &&
    // This checks for our backend non-standard rate limit error codes (412-428)
    // and the standard HTTP 429 Too Many Requests status code.
    ((error.response.status >= 412 && error.response.status <= 428) || error.response.status === 429)
  )
}

export function is404Error(error: unknown): boolean {
  return error instanceof FetchError && !!error.response.status && error.response.status === 404
}

/**
 * Extracts an error message from a FetchError's data payload.
 * Handles common API error formats: { error: string } or { detail: string }
 */
export function getFetchErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof FetchError)) {
    return undefined
  }
  const data = error.data as { error?: unknown; detail?: unknown } | undefined
  if (data?.error && typeof data.error === 'string') {
    return data.error
  }
  if (data?.detail && typeof data.detail === 'string') {
    return data.detail
  }
  return undefined
}
