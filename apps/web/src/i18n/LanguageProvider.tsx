import { ReactNode, useEffect } from 'react'
import { useAppDispatch } from 'state/hooks'
import { DEFAULT_LOCALE, Language } from 'uniswap/src/features/language/constants'
import { setCurrentLanguage } from 'uniswap/src/features/settings/slice'
import { changeLanguage } from 'uniswap/src/i18n'
import { isTestEnv } from 'utilities/src/environment/env'

function setupInitialLanguage() {
  // Always use English
  changeLanguage(DEFAULT_LOCALE)
}

if (!isTestEnv()) {
  setupInitialLanguage()
}

export function LanguageProvider({ children }: { children: ReactNode }): JSX.Element {
  const dispatch = useAppDispatch()
  // Always use English
  useEffect(() => {
    changeLanguage(DEFAULT_LOCALE)
    document.documentElement.setAttribute('lang', 'en-US')
    // stores English as the selected language
    dispatch(setCurrentLanguage(Language.English))
  }, [dispatch])

  return <>{children}</>
}
