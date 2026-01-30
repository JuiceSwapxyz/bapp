import { parseNumberForSubscript } from 'utilities/src/format/subscriptNumber'

describe('parseNumberForSubscript', () => {
  describe('numbers that should not use subscript', () => {
    it('returns needsSubscript: false for regular numbers >= 1', () => {
      const result = parseNumberForSubscript(123)
      expect(result.needsSubscript).toBe(false)
      expect(result.formattedValue).toBe('123')
    })

    it('returns needsSubscript: false for zero', () => {
      const result = parseNumberForSubscript(0)
      expect(result.needsSubscript).toBe(false)
    })

    it('returns needsSubscript: false for negative numbers', () => {
      const result = parseNumberForSubscript(-0.000001)
      expect(result.needsSubscript).toBe(false)
    })

    it('returns needsSubscript: false for numbers with fewer than minZeros leading zeros', () => {
      const result = parseNumberForSubscript(0.001) // 2 zeros, default min is 4
      expect(result.needsSubscript).toBe(false)
    })

    it('returns needsSubscript: false for 0.0001 (exactly 3 zeros, default min is 4)', () => {
      const result = parseNumberForSubscript(0.0001)
      expect(result.needsSubscript).toBe(false)
    })
  })

  describe('numbers that should use subscript', () => {
    it('applies subscript to 0.00001 (4 zeros)', () => {
      const result = parseNumberForSubscript(0.00001)
      expect(result.needsSubscript).toBe(true)
      expect(result.prefix).toBe('0.0')
      expect(result.zeroCount).toBe(4)
      expect(result.significantDigits).toBe('10')
    })

    it('applies subscript to 0.000000024 (7 zeros)', () => {
      const result = parseNumberForSubscript(0.000000024)
      expect(result.needsSubscript).toBe(true)
      expect(result.prefix).toBe('0.0')
      expect(result.zeroCount).toBe(7)
      expect(result.significantDigits).toBe('24')
    })

    it('applies subscript to 0.000000000743234 (9 zeros)', () => {
      const result = parseNumberForSubscript(0.000000000743234)
      expect(result.needsSubscript).toBe(true)
      expect(result.prefix).toBe('0.0')
      expect(result.zeroCount).toBe(9)
      expect(result.significantDigits).toBe('74')
    })

    it('handles numbers with many significant digits', () => {
      const result = parseNumberForSubscript(0.000012345)
      expect(result.needsSubscript).toBe(true)
      expect(result.zeroCount).toBe(4)
      expect(result.significantDigits).toBe('12') // Only first 2 significant digits
    })
  })

  describe('custom minZerosForSubscript', () => {
    it('respects custom minimum of 2 zeros', () => {
      const result = parseNumberForSubscript(0.001, { minZerosForSubscript: 2 })
      expect(result.needsSubscript).toBe(true)
      expect(result.zeroCount).toBe(2)
      expect(result.significantDigits).toBe('10')
    })

    it('respects custom minimum of 6 zeros', () => {
      const result = parseNumberForSubscript(0.00001, { minZerosForSubscript: 6 }) // 4 zeros, needs 6
      expect(result.needsSubscript).toBe(false)
    })
  })

  describe('custom significantDigits', () => {
    it('returns 3 significant digits when specified', () => {
      const result = parseNumberForSubscript(0.000012345, { significantDigits: 3 })
      expect(result.needsSubscript).toBe(true)
      expect(result.significantDigits).toBe('123')
    })

    it('returns 1 significant digit when specified', () => {
      const result = parseNumberForSubscript(0.000012345, { significantDigits: 1 })
      expect(result.needsSubscript).toBe(true)
      expect(result.significantDigits).toBe('1')
    })
  })

  describe('edge cases', () => {
    it('handles very small numbers in scientific notation', () => {
      const result = parseNumberForSubscript(1e-10)
      expect(result.needsSubscript).toBe(true)
      expect(result.zeroCount).toBe(9)
      expect(result.significantDigits).toBe('10')
    })

    it('handles numbers just below 1', () => {
      const result = parseNumberForSubscript(0.999)
      expect(result.needsSubscript).toBe(false)
    })

    it('handles very small but non-zero numbers', () => {
      const result = parseNumberForSubscript(1e-15)
      expect(result.needsSubscript).toBe(true)
      expect(result.zeroCount).toBe(14)
    })
  })
})
