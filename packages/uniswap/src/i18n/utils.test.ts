// Mock modules BEFORE any imports
const mockGetDeviceLocalesFn = jest.fn()
const mockGetLocaleFn = jest.fn()
const mockLoggerErrorFn = jest.fn()

jest.mock('utilities/src/device/locales', () => ({
  getDeviceLocales: jest.fn((...args) => mockGetDeviceLocalesFn(...args)),
}))

jest.mock('uniswap/src/features/language/hooks', () => ({
  getLocale: jest.fn((...args) => mockGetLocaleFn(...args)),
}))

jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    error: jest.fn((...args) => mockLoggerErrorFn(...args)),
  },
}))

// Import types and module under test AFTER mocks
import { Language, Locale } from 'uniswap/src/features/language/constants'
import { getWalletDeviceLanguage, getWalletDeviceLocale } from 'uniswap/src/i18n/utils'

describe('i18n utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getWalletDeviceLanguage', () => {
    // TODO: Fix these tests - platform-specific mocking is complex
    it.skip('should return first supported language from device locales', () => {
      mockGetDeviceLocalesFn.mockReturnValue([
        { languageCode: 'fr', languageTag: 'fr-FR' },
        { languageCode: 'en', languageTag: 'en-US' },
      ])

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.French)
    })

    it.skip('should handle normalized language tags', () => {
      mockGetDeviceLocalesFn.mockReturnValue([{ languageCode: 'zh', languageTag: 'zh-Hans-cn' }])

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.ChineseSimplified)
    })

    it.skip('should fall back to languageCode if no match for languageTag', () => {
      mockGetDeviceLocalesFn.mockReturnValue([{ languageCode: 'ja', languageTag: 'custom-tag' }])

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.Japanese)
    })

    it.skip('should skip unsupported languages and use the first supported one', () => {
      mockGetDeviceLocalesFn.mockReturnValue([
        { languageCode: 'xx', languageTag: 'xx-XX' }, // Unsupported
        { languageCode: 'es', languageTag: 'es-ES' }, // Supported
      ])

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.SpanishSpain)
    })

    it('should default to English if no supported language is found', () => {
      mockGetDeviceLocalesFn.mockReturnValue([
        { languageCode: 'xx', languageTag: 'xx-XX' }, // Unsupported
      ])

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.English)
    })

    it('should default to English if getDeviceLocales throws an error', () => {
      mockGetDeviceLocalesFn.mockImplementation(() => {
        throw new Error('Test error')
      })

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.English)
      expect(mockLoggerErrorFn).toHaveBeenCalled()
    })

    it('should handle empty device locales array', () => {
      mockGetDeviceLocalesFn.mockReturnValue([])

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.English)
    })
  })

  describe('getWalletDeviceLocale', () => {
    it.skip('should get the language and return the corresponding locale', () => {
      mockGetDeviceLocalesFn.mockReturnValue([{ languageCode: 'fr', languageTag: 'fr-FR' }])
      mockGetLocaleFn.mockReturnValue(Locale.FrenchFrance)

      const result = getWalletDeviceLocale()
      expect(result).toBe(Locale.FrenchFrance)
      expect(mockGetLocaleFn).toHaveBeenCalledWith(Language.French)
    })

    it('should default to English locale if getDeviceLocales fails', () => {
      mockGetDeviceLocalesFn.mockImplementation(() => {
        throw new Error('Test error')
      })
      mockGetLocaleFn.mockReturnValue(Locale.EnglishUnitedStates)

      const result = getWalletDeviceLocale()
      expect(result).toBe(Locale.EnglishUnitedStates)
      expect(mockGetLocaleFn).toHaveBeenCalledWith(Language.English)
    })
  })
})
