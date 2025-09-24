import { ReactNode } from 'react'
import { Flex, ModalCloseIcon, TouchableArea } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { Text } from 'ui/src/components/text/Text'

interface GetHelpHeaderProps {
  closeModal: () => void
  link?: string
  title?: ReactNode
  goBack?: () => void
  closeDataTestId?: string
  className?: string
}

export function GetHelpHeader({ title, goBack, closeModal, closeDataTestId, className }: GetHelpHeaderProps) {
  return (
    <Flex row justifyContent="space-between" alignItems="center" gap="$spacing4" width="100%" className={className}>
      {goBack && (
        <TouchableArea onPress={goBack}>
          <BackArrow size="$icon.24" color="$neutral2" hoverColor="$neutral2Hovered" />
        </TouchableArea>
      )}
      {title && (
        <Flex>
          <Text variant="body2">{title}</Text>
        </Flex>
      )}
      <Flex row fill justifyContent="flex-end" alignItems="center">
        <ModalCloseIcon testId={closeDataTestId} onClose={closeModal} />
      </Flex>
    </Flex>
  )
}
