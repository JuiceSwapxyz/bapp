import { isInterface } from 'utilities/src/platform'

/**
 * Only English is supported.
 */
export enum Language {
  English = 'en',
}

// Wallet's supported Languages - Now English only
export const WALLET_SUPPORTED_LANGUAGES: Language[] = [Language.English]

// Web's supported Languages - Now English only
export const WEB_SUPPORTED_LANGUAGES: Language[] = [Language.English]

export const PLATFORM_SUPPORTED_LANGUAGES = isInterface ? WEB_SUPPORTED_LANGUAGES : WALLET_SUPPORTED_LANGUAGES

/**
 * Only English locale is supported.
 */
export enum Locale {
  EnglishUnitedStates = 'en-US',
}

export const DEFAULT_LOCALE: Locale = Locale.EnglishUnitedStates

export const mapLanguageToLocale: Record<Language, Locale> = {
  [Language.English]: Locale.EnglishUnitedStates,
}

export const mapLocaleToLanguage: Record<Locale, Language> = {
  [Locale.EnglishUnitedStates]: Language.English,
}
