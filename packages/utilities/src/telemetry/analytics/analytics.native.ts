// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
  Analytics,
  AnalyticsInitConfig,
  TestnetModeConfig,
  UserPropertyValue,
} from 'utilities/src/telemetry/analytics/analytics'

let allowAnalytics: Maybe<boolean>

export async function getAnalyticsAtomDirect(_forceRead?: boolean): Promise<boolean> {
  return allowAnalytics ?? true
}

export const analytics: Analytics = {
  async init({ allowed }: AnalyticsInitConfig): Promise<void> {
    // Amplitude analytics disabled for JuiceSwap - no initialization
    allowAnalytics = allowed
    return
  },
  async setAllowAnalytics(allowed: boolean): Promise<void> {
    // Amplitude analytics disabled for JuiceSwap
    allowAnalytics = allowed
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
  setUserProperty(_property: string, _value: UserPropertyValue, _insert?: boolean): void {
    // Amplitude analytics disabled for JuiceSwap
    return
  },
}
