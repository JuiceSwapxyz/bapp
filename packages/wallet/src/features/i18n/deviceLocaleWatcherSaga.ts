import { AppState } from 'react-native'
import { EventChannel, eventChannel } from 'redux-saga'
import { call, put, select, takeLatest } from 'typed-redux-saga'
import { selectCurrentLanguage } from 'uniswap/src/features/settings/selectors'
import { setCurrentLanguage } from 'uniswap/src/features/settings/slice'
import { getWalletDeviceLanguage } from 'uniswap/src/i18n/utils'

function createAppStateChannel(): EventChannel<string> {
  return eventChannel((emit) => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        emit(nextAppState)
      }
    })

    return () => subscription.remove()
  })
}

export function* deviceLocaleWatcher(): Generator {
  // Sync language on app start
  yield* call(syncAppWithDeviceLanguage)

  // Listen for app state changes and sync language when app becomes active
  const appStateChannel = yield* call(createAppStateChannel)
  yield* takeLatest(appStateChannel, syncAppWithDeviceLanguage)
}

function* syncAppWithDeviceLanguage(): Generator {
  const currentAppLanguage = yield* select(selectCurrentLanguage)
  const deviceLanguage = getWalletDeviceLanguage()

  // Always English now, but keep the sync logic for consistency
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (currentAppLanguage !== deviceLanguage) {
    yield* put(setCurrentLanguage(deviceLanguage))
  }
}
