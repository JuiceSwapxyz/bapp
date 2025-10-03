// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { test as base } from '@playwright/test'

type AmplitudeFixture = {
  amplitude: {
    /**
     * Waits for a specific Amplitude event to be sent and returns it.
     * NOTE: Amplitude is disabled for JuiceSwap - this fixture is a no-op for compatibility
     *
     * @param {string} eventName - The name of the event to wait for
     * @param {string[]} [requiredProperties] - Optional array of property names that must exist on the event
     * @returns {Promise<any>} The event object that was found
     */
    waitForEvent: (eventName: string, requiredProperties?: string[]) => Promise<any>
  }
}

export const test = base.extend<AmplitudeFixture>({
  async amplitude({ page: _page }, use) {
    // Amplitude disabled for JuiceSwap - no event interception
    const waitForEvent = async (_eventName: string, _requiredProperties?: string[]) => {
      return new Promise((resolve) => {
        // Return empty event for compatibility
        resolve({})
      })
    }

    await use({ waitForEvent })
  },
})
