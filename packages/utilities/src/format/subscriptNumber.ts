export type SubscriptNumberParts = {
  needsSubscript: boolean
  // For subscript: "0.0" + subscript(zeroCount) + significantDigits
  prefix: string // "0.0"
  zeroCount: number // 5 (for 5 zeros after "0.0")
  significantDigits: string // "24"
  // For non-subscript: just the formatted number
  formattedValue: string
}

export type ParseNumberForSubscriptOptions = {
  minZerosForSubscript?: number
  significantDigits?: number
}

/**
 * Parse a small number for subscript notation display.
 *
 * For very small numbers like 0.000000024, this returns structured data
 * that allows rendering as "0.0₅24" where the subscript "5" indicates
 * 5 zeros after the decimal point.
 *
 * @param value - The numeric value to parse
 * @param options.minZerosForSubscript - Minimum leading zeros (after "0.") to trigger subscript (default: 4)
 * @param options.significantDigits - Number of significant digits to show (default: 2)
 * @returns Structured parts for rendering with or without subscript
 */
export function parseNumberForSubscript(
  value: number,
  options: ParseNumberForSubscriptOptions = {},
): SubscriptNumberParts {
  const { minZerosForSubscript = 4, significantDigits = 2 } = options
  const defaultResult: SubscriptNumberParts = {
    needsSubscript: false,
    prefix: '',
    zeroCount: 0,
    significantDigits: '',
    formattedValue: value.toString(),
  }

  // Only apply to positive numbers less than 1
  if (value <= 0 || value >= 1) {
    return defaultResult
  }

  // Convert to string to count leading zeros
  // Use toFixed with high precision to avoid scientific notation
  const strValue = value.toFixed(20)

  // Find the decimal point and count zeros after it
  const decimalIndex = strValue.indexOf('.')
  if (decimalIndex === -1) {
    return defaultResult
  }

  const afterDecimal = strValue.slice(decimalIndex + 1)

  // Count leading zeros
  let leadingZeros = 0
  for (const char of afterDecimal) {
    if (char === '0') {
      leadingZeros++
    } else {
      break
    }
  }

  // If not enough zeros, return without subscript
  if (leadingZeros < minZerosForSubscript) {
    return defaultResult
  }

  // Extract significant digits after the zeros
  const sigDigitsStr = afterDecimal.slice(leadingZeros, leadingZeros + significantDigits)

  return {
    needsSubscript: true,
    prefix: '0.0',
    zeroCount: leadingZeros,
    significantDigits: sigDigitsStr,
    formattedValue: `0.0${leadingZeros}${sigDigitsStr}`, // Fallback representation
  }
}
