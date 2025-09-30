import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const DEFAULT_RATE_LIMIT_DURATION = 60 // seconds (fallback if API doesn't provide duration)

interface RateLimitModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RateLimitModal({ isOpen, onClose }: RateLimitModalProps): JSX.Element {
  const { t } = useTranslation()
  // Get the duration from global state (set by tradeRepository when rate limit error occurs)
  const rateLimitDuration = globalThis.__RATE_LIMIT_DURATION__ ?? DEFAULT_RATE_LIMIT_DURATION
  const [remainingSeconds, setRemainingSeconds] = useState(rateLimitDuration)

  useEffect(() => {
    if (!isOpen) {
      // Reset to the current rate limit duration when modal closes
      const currentDuration = globalThis.__RATE_LIMIT_DURATION__ ?? DEFAULT_RATE_LIMIT_DURATION
      setRemainingSeconds(currentDuration)
      return undefined
    }

    // Initialize with the current rate limit duration when modal opens
    const initialDuration = globalThis.__RATE_LIMIT_DURATION__ ?? DEFAULT_RATE_LIMIT_DURATION
    setRemainingSeconds(initialDuration)

    // Start countdown when modal opens
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onClose()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [isOpen, onClose])

  return (
    <WarningModal
      isOpen={isOpen}
      isDismissible={false}
      modalName={ModalName.SwapWarning}
      severity={WarningSeverity.High}
      icon={<AlertTriangleFilled color="$statusCritical" size="$icon.24" />}
      title={t('swap.warning.rateLimit.title')}
      caption={t('swap.warning.rateLimit.message')}
      hideHandlebar={true}
      onClose={onClose}
    >
      <Flex centered py="$spacing16">
        <Text variant="heading2" color="$statusCritical">
          {remainingSeconds}s
        </Text>
        <Text variant="body3" color="$neutral2" textAlign="center" mt="$spacing4">
          {t('swap.warning.rateLimit.countdown', { seconds: remainingSeconds })}
        </Text>
      </Flex>
    </WarningModal>
  )
}
