import i18n from 'i18next'
import { Locale } from 'uniswap/src/features/language/constants'

export async function changeLanguage(_locale: Locale): Promise<void> {
  // Always use English
  if (i18n.language === Locale.EnglishUnitedStates) {
    return
  }
  await i18n.changeLanguage(Locale.EnglishUnitedStates)
}
