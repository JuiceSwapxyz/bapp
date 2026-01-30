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
  maxDecimals?: number
}

/**
 * Format a number for compact display, applying subscript notation for very
 * small numbers and limiting decimal places for all other numbers.
 *
 * For very small numbers like 0.000000024, this returns structured data
 * that allows rendering as "0.0₇24" where the subscript "7" indicates
 * 7 zeros after the decimal point.
 *
 * For normal numbers, it limits decimal places to prevent overflow.
 *
 * @param value - The numeric value to parse
 * @param options.minZerosForSubscript - Minimum leading zeros (after "0.") to trigger subscript (default: 4)
 * @param options.significantDigits - Number of significant digits to show after subscript (default: 2)
 * @param options.maxDecimals - Maximum decimal places for non-subscript numbers (default: 4)
 * @returns Structured parts for rendering with or without subscript
 */
export function parseNumberForSubscript(
  value: number,
  options: ParseNumberForSubscriptOptions = {},
): SubscriptNumberParts {
  const { minZerosForSubscript = 4, significantDigits = 2, maxDecimals = 4 } = options

  // Helper to format a number with limited decimals, removing trailing zeros
  const formatWithMaxDecimals = (num: number): string => {
    const fixed = num.toFixed(maxDecimals)
    // Remove trailing zeros after decimal point, but keep at least one decimal if there's a decimal point
    return fixed.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
  }

  const defaultResult: SubscriptNumberParts = {
    needsSubscript: false,
    prefix: '',
    zeroCount: 0,
    significantDigits: '',
    formattedValue: formatWithMaxDecimals(value),
  }

  // For non-positive or large numbers, just format with max decimals
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
