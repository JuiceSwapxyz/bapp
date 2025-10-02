import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enUsLocale from 'uniswap/src/i18n/locales/source/en-US.json'
import { logger } from 'utilities/src/logger/logger'

let isSetup = false

setupi18n()

export function setupi18n(): undefined {
  if (isSetup) {
    return
  }
  isSetup = true

  i18n
    .use(initReactI18next)
    .init({
      react: {
        useSuspense: false,
      },
      returnEmptyString: false,
      keySeparator: false,
      lng: 'en-US',
      fallbackLng: 'en-US',
      resources: {
        'en-US': { translation: enUsLocale },
      },
      interpolation: {
        escapeValue: false, // react already safes from xss
      },
    })
    .catch((err) => {
      logger.error(new Error(`Error initializing i18n ${err}`), {
        tags: {
          file: 'i18n',
          function: 'onFailedInit',
        },
      })
    })
}
