import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, QRCodeDisplay, Text, TouchableArea, useSporeColors } from 'ui/src'
import { HeightAnimator } from 'ui/src/animations/components/HeightAnimator'
import { CopySheets } from 'ui/src/components/icons/CopySheets'
import { Separator } from 'ui/src/components/layout/Separator'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { trimToLength } from 'utilities/src/primitives/string'

/** Parse a BIP21 URI like `bitcoin:<address>?amount=0.001&...` */
function parseBip21(uri: string): { address: string; amount: string } | null {
  try {
    const noScheme = uri.startsWith('bitcoin:') ? uri.slice('bitcoin:'.length) : uri
    const [addressPart, queryPart] = noScheme.split('?')
    const address = addressPart ?? ''
    let amount = ''
    if (queryPart) {
      const params = new URLSearchParams(queryPart)
      amount = params.get('amount') ?? ''
    }
    return address ? { address, amount } : null
  } catch {
    return null
  }
}

function CopyRow({
  label,
  value,
  displayValue,
}: {
  label: string
  value: string
  displayValue: string
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (!isCopied) return undefined
    const timer = setTimeout(() => setIsCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [isCopied])

  const handleCopy = useCallback(async (): Promise<void> => {
    if (!value) return
    await setClipboard(value)
    setIsCopied(true)
  }, [value])

  return (
    <Flex row alignItems="center" justifyContent="space-between" gap="$spacing8" width="100%" px="$spacing12">
      <Text color="$neutral3" variant="body3" flexShrink={0}>
        {label}
      </Text>
      <TouchableArea hitSlop={16} onPress={handleCopy}>
        <Flex row alignItems="center" gap="$spacing4">
          <Text color={isCopied ? '$statusSuccess' : '$neutral2'} variant="body3">
            {isCopied ? t('common.copied') : displayValue}
          </Text>
          <CopySheets color={isCopied ? colors.statusSuccess.get() : colors.neutral3.get()} size="$icon.16" />
        </Flex>
      </TouchableArea>
    </Flex>
  )
}

export function InvoiceLikeStringDisplay({ invoiceLikeString }: { invoiceLikeString: string }): JSX.Element {
  const displayInvoice = invoiceLikeString ? trimToLength(invoiceLikeString, 20) : ''
  const bip21 = invoiceLikeString ? parseBip21(invoiceLikeString) : null

  return (
    <>
      <Separator my="$spacing8" ml="$spacing12" mr="$spacing12" />
      {invoiceLikeString && (
        <HeightAnimator open animation="fast">
          <Flex alignItems="center" gap="$spacing12">
            <QRCodeDisplay encodedValue={invoiceLikeString} size={300} color="white" ecl="L" />

            {/* BIP21 full URI */}
            <Flex width="100%" gap="$spacing8">
              <CopyRow label="BIP21" value={invoiceLikeString} displayValue={displayInvoice} />

              {/* Address and amount — only shown for BIP21 URIs */}
              {bip21 && (
                <>
                  <CopyRow
                    label="Address"
                    value={bip21.address}
                    displayValue={trimToLength(bip21.address, 20)}
                  />
                  {bip21.amount && (
                    <CopyRow
                      label="Amount (BTC)"
                      value={bip21.amount}
                      displayValue={`${bip21.amount} BTC`}
                    />
                  )}
                </>
              )}
            </Flex>
          </Flex>
        </HeightAnimator>
      )}
    </>
  )
}
