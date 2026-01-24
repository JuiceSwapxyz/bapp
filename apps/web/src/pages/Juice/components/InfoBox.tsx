import { ReactNode } from 'react'
import { Flex, Text, styled } from 'ui/src'

type InfoBoxType = 'info' | 'warning' | 'success'

interface InfoBoxProps {
  type?: InfoBoxType
  children: ReactNode
}

const Box = styled(Flex, {
  padding: '$spacing16',
  borderRadius: '$rounded12',
  borderWidth: 1,
  borderStyle: 'solid',

  variants: {
    boxType: {
      info: {
        backgroundColor: '$surface2',
        borderColor: '$neutral3',
      },
      warning: {
        backgroundColor: '$statusWarning2',
        borderColor: '$statusWarning',
      },
      success: {
        backgroundColor: '$statusSuccess2',
        borderColor: '$statusSuccess',
      },
    },
  } as const,

  defaultVariants: {
    boxType: 'info',
  },
})

export function InfoBox({ type = 'info', children }: InfoBoxProps) {
  return (
    <Box boxType={type}>
      <Text variant="body2" color="$neutral1">
        {children}
      </Text>
    </Box>
  )
}
