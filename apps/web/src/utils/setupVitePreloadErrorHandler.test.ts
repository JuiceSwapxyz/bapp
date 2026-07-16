import { setupVitePreloadErrorHandler } from 'utils/setupVitePreloadErrorHandler'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock window.location.reload
const mockReload = vi.fn()
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
})

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('setupVitePreloadErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('prevents the default throw and reloads the page', () => {
    setupVitePreloadErrorHandler()

    const event = new Event('vite:preloadError', { cancelable: true })
    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(mockReload).toHaveBeenCalled()
  })

  it('skips the reload while the refresh cooldown is active', () => {
    mockLocalStorage.getItem.mockReturnValue(Date.now().toString())

    setupVitePreloadErrorHandler()
    window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }))

    expect(mockReload).not.toHaveBeenCalled()
  })
})
