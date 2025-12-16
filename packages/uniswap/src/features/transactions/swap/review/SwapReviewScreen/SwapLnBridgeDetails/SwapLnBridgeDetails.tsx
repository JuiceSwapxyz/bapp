import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, QRCodeDisplay, Text, TouchableArea, useSporeColors } from 'ui/src'
import { CopySheets } from 'ui/src/components/icons/CopySheets'
import { Separator } from 'ui/src/components/layout/Separator'
import { LightningBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { SwapEnterBitcoinLikeAddress } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapLnBridgeDetails/SwapEnterBitcoinLikeAddress'
import { useLnBrideSwapDetails } from 'uniswap/src/features/transactions/swap/review/hooks/useLnBrideSwapDetails'
import { useSwapReviewStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore'
import { LightningBridgeTransactionStep } from 'uniswap/src/features/transactions/swap/steps/lightningBridge'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { trimToLength } from 'utilities/src/primitives/string'

export function SwapLnBridgeDetails(): JSX.Element {
  const { direction } = useLnBrideSwapDetails()

  if (direction === LightningBridgeDirection.Submarine) {
    return <SubmarineLnBridgeDetails />
  }

  return <ReverseLnBridgeDetails />
}

export function SubmarineLnBridgeDetails(): JSX.Element {
  return (
    <>
      <Separator my="$spacing8" ml="$spacing12" mr="$spacing12" />
      <SwapEnterBitcoinLikeAddress />
    </>
  )
}

export function ReverseLnBridgeDetails(): JSX.Element {
  const { t } = useTranslation()
  const currentStep = useSwapReviewStore((s) => s.currentStep)
  const colors = useSporeColors()
  const dispatch = useDispatch()
  const [isCopied, setIsCopied] = useState(false)

  const lightningInvoice =
    currentStep?.step.type === TransactionStepType.LightningBridgeTransactionStep
      ? (currentStep.step as LightningBridgeTransactionStep).invoice
      : undefined

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
    if (!lightningInvoice) {
      return
    }

    await setClipboard(lightningInvoice)
    setIsCopied(true)
    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.TransactionId,
      }),
    )
  }, [lightningInvoice, dispatch])

  const displayInvoice = lightningInvoice ? trimToLength(lightningInvoice, 20) : ''

  return (
    <>
      <Separator my="$spacing8" ml="$spacing12" mr="$spacing12" />
      {lightningInvoice ? (
        <Flex alignItems="center" gap="$spacing12">
          <QRCodeDisplay encodedValue={lightningInvoice} size={300} color="white" ecl="L" />
          <TouchableArea hitSlop={16} onPress={handleCopyInvoice}>
            <Flex row alignItems="center" gap="$spacing8">
              <Text color={isCopied ? '$statusSuccess' : '$neutral2'} variant="body3">
                {isCopied ? t('common.copied') : displayInvoice}
              </Text>
              <CopySheets color={isCopied ? colors.statusSuccess.get() : colors.neutral3.get()} size="$icon.16" />
            </Flex>
          </TouchableArea>
        </Flex>
      ) : null}
    </>
  )
}
