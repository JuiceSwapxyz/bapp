import { Currency, CurrencyAmount } from '@juiceswapxyz/sdk-core'
import { Flex, Text, TextProps } from 'ui/src'
import { parseNumberForSubscript } from 'utilities/src/format/subscriptNumber'

type FormattedTokenAmountProps = {
  amount: CurrencyAmount<Currency>
  variant?: TextProps['variant']
  color?: TextProps['color']
}

/**
 * Renders a token amount with subscript notation for very small numbers.
 *
 * For numbers with many leading zeros (e.g., 0.000000024), this displays
 * the value using subscript notation: "0.0₇24 ETH" where the subscript "7"
 * indicates 7 zeros after the decimal point.
 *
 * For normal-sized numbers, it displays them as-is.
 */
export function FormattedTokenAmount({
  amount,
  variant = 'body2',
  color = '$neutral2',
}: FormattedTokenAmountProps): JSX.Element {
  const numericValue = parseFloat(amount.toExact())
  const parts = parseNumberForSubscript(numericValue)
  const symbol = amount.currency.symbol

  if (!parts.needsSubscript) {
    return (
      <Text variant={variant} color={color}>
        {parts.formattedValue} {symbol}
      </Text>
    )
  }

  // Render with subscript: "0.0" + small subscript + significant digits + symbol
  return (
    <Flex row alignItems="baseline">
      <Text variant={variant} color={color}>
        {parts.prefix}
      </Text>
      <Text variant={variant} color={color} fontSize={10} position="relative" top={4}>
        {parts.zeroCount}
      </Text>
      <Text variant={variant} color={color}>
        {parts.significantDigits} {symbol}
      </Text>
    </Flex>
  )
}
