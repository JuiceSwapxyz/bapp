import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'

export function NoDappConnections(): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex centered pt="$spacing60" px="$padding12" flex={1} gap="$gap4">
      <Text color="$neutral1" variant="body2">
        {t('walletConnect.dapps.manage.empty.title')}
      </Text>
      <Text color="$neutral2" variant="body3" textAlign="center">
        {t('settings.setting.connections.noConnectionsDescription')}
      </Text>
    </Flex>
  )
}
