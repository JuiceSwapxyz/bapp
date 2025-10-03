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
    it('should always return English', () => {
      mockGetDeviceLocalesFn.mockReturnValue([
        { languageCode: 'fr', languageTag: 'fr-FR' },
        { languageCode: 'en', languageTag: 'en-US' },
      ])

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.English)
    })

    it('should return English even with non-English device locales', () => {
      mockGetDeviceLocalesFn.mockReturnValue([{ languageCode: 'zh', languageTag: 'zh-Hans-cn' }])

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.English)
    })

    it('should default to English if getDeviceLocales throws an error', () => {
      mockGetDeviceLocalesFn.mockImplementation(() => {
        throw new Error('Test error')
      })

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.English)
    })

    it('should handle empty device locales array', () => {
      mockGetDeviceLocalesFn.mockReturnValue([])

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.English)
    })
  })

  describe('getWalletDeviceLocale', () => {
    it('should always return English locale', () => {
      const result = getWalletDeviceLocale()
      expect(result).toBe(Locale.EnglishUnitedStates)
    })

    it('should return consistent locale regardless of device settings', () => {
      // Even with different device locales, should always return English
      mockGetDeviceLocalesFn.mockReturnValue([{ languageCode: 'fr', languageTag: 'fr-FR' }])
      const result1 = getWalletDeviceLocale()

      mockGetDeviceLocalesFn.mockReturnValue([{ languageCode: 'zh', languageTag: 'zh-CN' }])
      const result2 = getWalletDeviceLocale()

      expect(result1).toBe(Locale.EnglishUnitedStates)
      expect(result2).toBe(Locale.EnglishUnitedStates)
      expect(result1).toBe(result2)
    })
  })
})
