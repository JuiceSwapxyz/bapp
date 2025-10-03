import { useTranslation } from 'react-i18next'
import { InlineCard, Text } from 'ui/src'
import { MessageQuestion } from 'ui/src/components/icons/MessageQuestion'

export function OffRampPendingSupportCard(): JSX.Element {
  const { t } = useTranslation()

  return (
    <InlineCard
      Icon={MessageQuestion}
      color="$neutral2"
      iconColor="$neutral2"
      description={
        <Text color="$neutral2" variant="body3" p="$spacing8">
          {t('transaction.status.sale.pendingCard.msg')}
        </Text>
      }
      heading={
        <Text color="$neutral1" variant="body3">
          {t('transaction.status.sale.pendingCard.title')}
        </Text>
      }
    />
  )
}
