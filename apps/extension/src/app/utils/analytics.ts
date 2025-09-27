import '@tamagui/core/reset.css'
import 'src/app/Global.css'
import 'symbol-observable' // Needed by `reduxed-chrome-storage` as polyfill, order matters

export async function initExtensionAnalytics(): Promise<void> {
  // Amplitude analytics disabled for JuiceSwap - skip initialization
  return
}
