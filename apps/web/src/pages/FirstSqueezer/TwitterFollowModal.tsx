import { useState } from 'react'
import { Button, Flex, ModalCloseIcon, Text, styled } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const ContentWrapper = styled(Flex, {
  gap: '$spacing24',
  padding: '$spacing24',
  width: '100%',
})

const Header = styled(Flex, {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
})

const ButtonsContainer = styled(Flex, {
  gap: '$spacing12',
  width: '100%',
})

const ActionButton = styled(Button, {
  width: '100%',
  paddingVertical: '$spacing16',
  borderRadius: '$rounded12',
  backgroundColor: '$accent1',
  hoverStyle: {
    backgroundColor: '$accent2',
  },
})

const SecondaryButton = styled(Button, {
  width: '100%',
  paddingVertical: '$spacing16',
  borderRadius: '$rounded12',
  backgroundColor: '$surface3',
  hoverStyle: {
    backgroundColor: '$surface2',
  },
})

interface TwitterFollowModalProps {
  isOpen: boolean
  onDismiss: () => void
  onConfirm: () => void
}

export function TwitterFollowModal({ isOpen, onDismiss, onConfirm }: TwitterFollowModalProps) {
  const [hasOpenedFollow, setHasOpenedFollow] = useState(false)

  const handleYesFollow = () => {
    onConfirm()
    onDismiss()
  }

  const handleNotYet = () => {
    window.open('https://x.com/JuiceSwap_com', '_blank', 'noopener,noreferrer')
    setHasOpenedFollow(true)
  }

  const handleVerifyAfterFollow = () => {
    onConfirm()
    onDismiss()
  }

  const handleClose = () => {
    setHasOpenedFollow(false)
    onDismiss()
  }

  return (
    <Modal name={ModalName.AccountEdit} maxWidth={420} isModalOpen={isOpen} onClose={handleClose} padding={0}>
      <ContentWrapper>
        <Header>
          <Text variant="heading3" color="$neutral1">
            🐦 Follow @JuiceSwap_com
          </Text>
          <ModalCloseIcon onClose={handleClose} />
        </Header>

        {!hasOpenedFollow ? (
          <>
            <Text variant="body2" color="$neutral2">
              Do you follow @JuiceSwap_com on X?
            </Text>

            <ButtonsContainer>
              <ActionButton onPress={handleYesFollow}>
                <Text variant="buttonLabel3" color="$white">
                  Yes, I follow
                </Text>
              </ActionButton>

              <SecondaryButton onPress={handleNotYet}>
                <Text variant="buttonLabel3" color="$neutral1">
                  Not yet
                </Text>
              </SecondaryButton>
            </ButtonsContainer>
          </>
        ) : (
          <>
            <Text variant="body2" color="$neutral2">
              Great! Once you've followed @JuiceSwap_com, verify your account below.
            </Text>

            <ActionButton onPress={handleVerifyAfterFollow}>
              <Text variant="buttonLabel3" color="$white">
                Verify my account
              </Text>
            </ActionButton>
          </>
        )}
      </ContentWrapper>
    </Modal>
  )
}
