import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { checkCloudBackupOrShowAlert } from 'src/components/mnemonic/cloudImportUtils'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OptionCard } from 'src/features/onboarding/OptionCard'
import {
  ImportMethodOption,
  importFromCloudBackupOption,
  seedPhraseImportOption,
} from 'src/screens/Import/constants'
import { useNavigationHeader } from 'src/utils/useNavigationHeader'
import { Flex, SpinningLoader, Text, TouchableArea } from 'ui/src'
import { Eye, WalletFilled } from 'ui/src/components/icons'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'
import { iconSizes } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'

const options: ImportMethodOption[] = [seedPhraseImportOption, importFromCloudBackupOption]

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.ImportMethod>

export function ImportMethodScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const entryPoint = params.entryPoint

  useNavigationHeader(navigation)

  const handleOnPressRestoreBackup = async (): Promise<void> => {
    const hasCloudBackup = await checkCloudBackupOrShowAlert(t)
    if (!hasCloudBackup) {
      return
    }

    navigation.navigate({
      name: OnboardingScreens.RestoreCloudBackupLoading,
      params: { importType: ImportType.Restore, entryPoint },
      merge: true,
    })
  }

  const handleOnPress = async (
    nav: ImportMethodOption['nav'] | OnboardingScreens.WatchWallet,
    importType: ImportType,
  ): Promise<void> => {
    if (importType === ImportType.Restore) {
      await handleOnPressRestoreBackup()
      return
    }

    navigation.navigate({
      name: nav,
      params: { importType, entryPoint },
      merge: true,
    })
  }

  const importOptions =
    entryPoint === OnboardingEntryPoint.Sidebar
      ? options.filter((option) => option.name !== ElementName.RestoreFromCloud)
      : options

  return (
    <OnboardingScreen
      Icon={WalletFilled}
      title={t('onboarding.import.title')}
    >
      <Flex
        grow
        gap="$spacing12"
        mt="$spacing4"
        shadowColor="$surface3"
        shadowRadius={!isDarkMode ? '$spacing8' : undefined}
      >
        {importOptions.map(({ title, blurb, icon, nav, importType, name, testID }, i) => (
          <OptionCard
            key={'connection-option-' + name + i}
            blurb={blurb(t)}
            elementName={name}
            icon={icon}
            testID={testID}
            title={title(t)}
            onPress={(): Promise<void> => handleOnPress(nav, importType)}
          />
        ))}
      </Flex>
      <Trace logPress element={ElementName.OnboardingImportBackup}>
        <TouchableArea alignItems="center" hitSlop={16} mb="$spacing12" testID={TestID.WatchWallet}>
          <Flex row alignItems="center" gap="$spacing8">
            <Eye color="$accent1" size="$icon.20" />
            <Text
              color="$accent1"
              variant="buttonLabel1"
              onPress={(): Promise<void> => handleOnPress(OnboardingScreens.WatchWallet, ImportType.Watch)}
            >
              {t('account.wallet.button.watch')}
            </Text>
          </Flex>
        </TouchableArea>
      </Trace>
    </OnboardingScreen>
  )
}
