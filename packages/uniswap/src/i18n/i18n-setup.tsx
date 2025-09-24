import 'uniswap/src/i18n/locales/@types/i18next'

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enUS from 'uniswap/src/i18n/locales/source/en-US.json'
import { MissingI18nInterpolationError } from 'uniswap/src/i18n/shared'
import { logger } from 'utilities/src/logger/logger'

// Only English resources now
const resources = {
  'en-US': { translation: enUS, statsigKey: 'en-US' },
}

const defaultNS = 'translation'

i18n
  .use(initReactI18next)
  .init({
    defaultNS,
    lng: 'en-US', // Force English
    fallbackLng: 'en-US',
    resources,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    react: {
      transSupportBasicHtmlNodes: false, // disabling since this breaks for mobile
    },
    missingInterpolationHandler: (text) => {
      logger.error(new MissingI18nInterpolationError(`Missing i18n interpolation value: ${text}`), {
        tags: {
          file: 'i18n-setup.tsx',
          function: 'init',
        },
      })
      return '' // Using empty string for missing interpolation
    },
  })
  .catch(() => undefined)

// eslint-disable-next-line max-params
i18n.on('missingKey', (_lngs, _ns, key, _res) => {
  logger.error(new Error(`Missing i18n string key ${key} for language ${i18n.language}`), {
    tags: {
      file: 'i18n-setup.tsx',
      function: 'onMissingKey',
    },
  })
})
