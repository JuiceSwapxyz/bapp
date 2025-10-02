import { PersistState } from 'redux-persist'
import { Language } from 'uniswap/src/features/language/constants'

export type PersistAppStateV19 = {
  _persist: PersistState
  user?: {
    userLocale: string
  }
  userSettings?: {
    currentLanguage: Language
  }
}

/**
 * Migrate existing UserSettings to set any missing default values, since currentLanguage and currentCurrency are overwritten in migration14.
 */
export const migration19 = (state: PersistAppStateV19 | undefined) => {
  if (!state) {
    return undefined
  }

  // Copy state
  const newState: any = { ...state }

  // Always migrate to English
  newState.userSettings.currentLanguage = Language.English

  // remove old locale state
  delete newState.user.userLocale

  return { ...newState, _persist: { ...state._persist, version: 19 } }
}
