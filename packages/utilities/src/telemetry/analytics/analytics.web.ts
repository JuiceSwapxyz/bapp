import { getChromeWithThrow } from 'utilities/src/chrome/chrome'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
  Analytics,
  AnalyticsInitConfig,
  TestnetModeConfig,
  UserPropertyValue,
} from 'utilities/src/telemetry/analytics/analytics'
import { ALLOW_ANALYTICS_ATOM_KEY } from 'utilities/src/telemetry/analytics/constants'

let allowAnalytics: boolean = true

async function getAnalyticsAtomFromStorage(): Promise<boolean> {
  try {
    return window.localStorage.getItem(ALLOW_ANALYTICS_ATOM_KEY) !== 'false'
  } catch {
    const chrome = getChromeWithThrow()
    const res = await chrome.storage.local.get(ALLOW_ANALYTICS_ATOM_KEY)
    return res[ALLOW_ANALYTICS_ATOM_KEY] !== 'false'
  }
}

export async function getAnalyticsAtomDirect(forceRead?: boolean): Promise<boolean> {
  if (forceRead) {
    allowAnalytics = await getAnalyticsAtomFromStorage()
  }

  return allowAnalytics
}

// Listen for changes from other areas
const updateLocalVar = async (): Promise<void> => {
  allowAnalytics = await getAnalyticsAtomFromStorage()
}
try {
  window.document.addEventListener('analyticsToggled', updateLocalVar, false)
} catch {
  const chrome = getChromeWithThrow()
  chrome.storage.local.onChanged.addListener(updateLocalVar)
}

export const analytics: Analytics = {
  async init(_config: AnalyticsInitConfig): Promise<void> {
    // Amplitude analytics disabled for JuiceSwap - no initialization
    return
  },

  async setAllowAnalytics(_allowed: boolean): Promise<void> {
    // Amplitude analytics disabled for JuiceSwap
    return
  },

  setTestnetMode(_enabled: boolean, _config: TestnetModeConfig): void {
    // Amplitude analytics disabled for JuiceSwap
    return
  },

  sendEvent(_eventName: string, _eventProperties?: Record<string, unknown>): void {
    // Amplitude analytics disabled for JuiceSwap - no events will be sent
    return
  },
  flushEvents(): void {
    // Amplitude analytics disabled for JuiceSwap
    return
  },
  // eslint-disable-next-line max-params
  async setUserProperty(_property: string, _value: UserPropertyValue, _insert?: boolean): Promise<void> {
    // Amplitude analytics disabled for JuiceSwap
    return
  },
}
