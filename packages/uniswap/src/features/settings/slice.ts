import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { Language } from 'uniswap/src/features/language/constants'
import { getCurrentLanguageFromNavigator } from 'uniswap/src/features/language/utils'
import { isInterface } from 'utilities/src/platform'

export interface UserSettingsState {
  currentLanguage: Language
  currentCurrency: FiatCurrency
  hideSmallBalances: boolean
  hideSpamTokens: boolean
  isTestnetModeEnabled?: boolean
  hapticsEnabled: boolean
}

export const initialUserSettingsState: UserSettingsState = {
  currentLanguage: isInterface ? getCurrentLanguageFromNavigator() : Language.English,
  currentCurrency: FiatCurrency.UnitedStatesDollar,
  hideSmallBalances: true,
  hideSpamTokens: true,
  isTestnetModeEnabled: false,
  hapticsEnabled: true,
}

const slice = createSlice({
  name: 'userSettings',
  initialState: initialUserSettingsState,
  reducers: {
    setHideSmallBalances: (state, { payload }: PayloadAction<boolean>) => {
      state.hideSmallBalances = payload
    },
    setHideSpamTokens: (state, { payload }: PayloadAction<boolean>) => {
      state.hideSpamTokens = payload
    },
    setCurrentLanguage: (state, action: PayloadAction<Language>) => {
      state.currentLanguage = action.payload
    },
    setCurrentFiatCurrency: (state, action: PayloadAction<FiatCurrency>) => {
      state.currentCurrency = action.payload
    },
    setIsTestnetModeEnabled: (state) => {
      state.isTestnetModeEnabled = !state.isTestnetModeEnabled
    },
    setHapticsEnabled: (state, { payload }: PayloadAction<boolean>) => {
      state.hapticsEnabled = payload
    },
    resetSettings: () => initialUserSettingsState,
  },
})

export const {
  setHideSmallBalances,
  setHideSpamTokens,
  setCurrentLanguage,
  setCurrentFiatCurrency,
  setIsTestnetModeEnabled,
  setHapticsEnabled,
} = slice.actions

export const userSettingsReducer = slice.reducer
