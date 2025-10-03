import { useModalState } from 'hooks/useModalState'
import { useTranslation } from 'react-i18next'
import { Button } from 'ui/src'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export function NewUserCTAButton() {
  const { t } = useTranslation()

  const { openModal } = useModalState(ModalName.GetTheApp)

  return (
    <Trace logPress element={ElementName.GetTheApp}>
      <Button
        testID={TestID.NewUserCTAButton}
        fill={false}
        size="small"
        emphasis="tertiary"
        variant="default"
        onPress={openModal}
      >
        {t('common.getTheApp')}
      </Button>
    </Trace>
  )
}
