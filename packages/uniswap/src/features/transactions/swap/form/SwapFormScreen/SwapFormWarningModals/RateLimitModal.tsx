import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const RATE_LIMIT_DURATION = 60 // seconds

interface RateLimitModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RateLimitModal({ isOpen, onClose }: RateLimitModalProps): JSX.Element {
  const { t } = useTranslation()
  const [remainingSeconds, setRemainingSeconds] = useState(RATE_LIMIT_DURATION)

  useEffect(() => {
    if (!isOpen) {
      setRemainingSeconds(RATE_LIMIT_DURATION)
      return undefined
    }

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
