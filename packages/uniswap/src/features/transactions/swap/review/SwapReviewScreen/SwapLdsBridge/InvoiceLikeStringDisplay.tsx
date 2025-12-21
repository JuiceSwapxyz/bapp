import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, QRCodeDisplay, Text, TouchableArea, useSporeColors } from 'ui/src'
import { HeightAnimator } from 'ui/src/animations/components/HeightAnimator'
import { CopySheets } from 'ui/src/components/icons/CopySheets'
import { Separator } from 'ui/src/components/layout/Separator'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { trimToLength } from 'utilities/src/primitives/string'

export function InvoiceLikeStringDisplay({ invoiceLikeString }: { invoiceLikeString: string }): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false)
      }, 2000)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [isCopied])

  const handleCopyInvoice = useCallback(async (): Promise<void> => {
    if (!invoiceLikeString) {
      return
    }

    await setClipboard(invoiceLikeString)
    setIsCopied(true)
  }, [invoiceLikeString])

  const displayInvoice = invoiceLikeString ? trimToLength(invoiceLikeString, 20) : ''

  return (
    <>
      <Separator my="$spacing8" ml="$spacing12" mr="$spacing12" />
      {invoiceLikeString && (
        <HeightAnimator open animation="fast">
          <Flex alignItems="center" gap="$spacing12">
            <QRCodeDisplay encodedValue={invoiceLikeString} size={300} color="white" ecl="L" />
            <TouchableArea hitSlop={16} onPress={handleCopyInvoice}>
              <Flex row alignItems="center" gap="$spacing8">
                <Text color={isCopied ? '$statusSuccess' : '$neutral2'} variant="body3">
                  {isCopied ? t('common.copied') : displayInvoice}
                </Text>
                <CopySheets color={isCopied ? colors.statusSuccess.get() : colors.neutral3.get()} size="$icon.16" />
              </Flex>
            </TouchableArea>
          </Flex>
        </HeightAnimator>
      )}
    </>
  )
}
