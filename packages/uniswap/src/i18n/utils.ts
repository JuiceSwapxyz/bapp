import { Language, Locale } from 'uniswap/src/features/language/constants'

/**
 * Returns the translation file name for English locale.
 */
export function getLocaleTranslationKey(_locale: string): string {
  return 'en-US'
}

/**
 * Always returns English locale.
 */
export function getWalletDeviceLocale(): Locale {
  return Locale.EnglishUnitedStates
}

/**
 * Always returns English language.
 */
export function getWalletDeviceLanguage(): Language {
  return Language.English
}
