import { useTranslation } from 'react-i18next'
import { AppTFunction } from 'ui/src/i18n/types'
import { ForceUpgradeTranslations } from 'uniswap/src/features/gating/configs'
import { Language, Locale, mapLanguageToLocale } from 'uniswap/src/features/language/constants'

export type LanguageInfo = {
  displayName: string
  originName: string
  loggingName: string
  locale: Locale
}

export function getLocale(_language: Language): Locale {
  return mapLanguageToLocale[Language.English]
}

export function getLanguageInfo(t: AppTFunction, _language: Language): LanguageInfo {
  return {
    displayName: t('language.english'),
    originName: 'English',
    loggingName: 'English',
    locale: Locale.EnglishUnitedStates,
  }
}

export function useCurrentLanguage(): Language {
  return Language.English
}

export function useLanguageInfo(language: Language): LanguageInfo {
  const { t } = useTranslation()
  return getLanguageInfo(t, language)
}

export function useCurrentLanguageInfo(): LanguageInfo {
  return useLanguageInfo(Language.English)
}

type SupportedLocale = keyof ForceUpgradeTranslations

export function useLocalizedStatsigLanguage(): SupportedLocale | null {
  const { i18n } = useTranslation()
  const parsedLocale = parseLocale(i18n.resolvedLanguage)
  const resources = i18n.services.backendConnector.options.resources as Record<string, { statsigKey?: SupportedLocale }>

  if (typeof parsedLocale !== 'string' || !(parsedLocale in resources)) {
    return null
  }

  return resources[parsedLocale]?.statsigKey ?? null
}

export function navigatorLocale(): Locale | undefined {
  return Locale.EnglishUnitedStates
}

export function parseLocale(_maybeSupportedLocale: unknown): Locale | undefined {
  return Locale.EnglishUnitedStates
}

export function useCurrentLocale(): Locale {
  return Locale.EnglishUnitedStates
}
