import { attemptPageRefresh } from 'utils/lazyWithRetry'

export function setupVitePreloadErrorHandler(): void {
  window.addEventListener('vite:preloadError', (event: Event) => {
    // Prevent Vite from throwing the error and crashing the app
    event.preventDefault()

    // eslint-disable-next-line no-console
    console.error('Vite preload error: Dynamic import failed to load')

    // A missing preloaded chunk means this client runs a stale build whose
    // hashed assets are gone; retrying can never succeed, only a reload can.
    attemptPageRefresh()
  })
}
