import { ArrowLeft } from 'react-feather'
import { Flex, Text, useScrollbarStyles } from 'ui/src'

export const SlideOutMenu = ({
  children,
  onClose,
  title,
  rightIcon,
  versionComponent,
}: {
  onClose: () => void
  title: React.ReactNode
  children: React.ReactNode
  onClear?: () => void
  rightIcon?: React.ReactNode
  versionComponent?: React.ReactNode
}) => {
  const scrollbarStyles = useScrollbarStyles()

  const updatedScrollbarStyles = {
    ...scrollbarStyles,
    '::-webkit-scrollbar-track': {
      marginTop: '40px',
    },
  }

  return (
    <>
      <Flex
        $platform-web={{
          overflow: 'auto',
        }}
        style={updatedScrollbarStyles}
        mt="$spacing4"
        py="$padding12"
        px="$padding16"
        minHeight="85vh"
        $md={{
          minHeight: '0px',
        }}
      >
        <Flex grow justifyContent="space-between">
          <Flex grow>
            <Flex
              row
              mb="$spacing20"
              justifyContent="space-between"
              width="100%"
              alignItems="center"
              position="relative"
            >
              <ArrowLeft data-testid="wallet-back" onClick={onClose} size={24} cursor="pointer" />
              <Flex
                position="absolute"
                left={0}
                right={0}
                alignItems="center"
                pointerEvents="none"
              >
                <Text color="$neutral1">{title}</Text>
              </Flex>
              {rightIcon ? <>{rightIcon}</> : <Flex />}
            </Flex>
            {children}
          </Flex>
        </Flex>
      </Flex>
      {versionComponent}
    </>
  )
}
