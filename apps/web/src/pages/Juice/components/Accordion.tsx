import { useState } from 'react'
import { ChevronDown } from 'react-feather'
import { Flex, Text, styled } from 'ui/src'

interface AccordionItemProps {
  question: string
  answer: string
}

interface AccordionProps {
  items: AccordionItemProps[]
}

const AccordionContainer = styled(Flex, {
  flexDirection: 'column',
  gap: '$spacing8',
  width: '100%',
})

const AccordionItemContainer = styled(Flex, {
  flexDirection: 'column',
  backgroundColor: '$surface2',
  borderRadius: '$rounded12',
  overflow: 'hidden',
})

const AccordionHeader = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '$spacing16',
  cursor: 'pointer',
  gap: '$spacing12',

  hoverStyle: {
    backgroundColor: '$surface3',
  },
})

const AccordionContent = styled(Flex, {
  padding: '$spacing16',
  paddingTop: 0,
})

const ChevronContainer = styled(Flex, {
  transition: 'transform 0.2s ease',

  variants: {
    isOpen: {
      true: {
        transform: 'rotate(180deg)',
      },
      false: {
        transform: 'rotate(0deg)',
      },
    },
  } as const,
})

function AccordionItem({ question, answer }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <AccordionItemContainer>
      <AccordionHeader onPress={() => setIsOpen(!isOpen)}>
        <Text variant="body1" color="$neutral1" fontWeight="600" flex={1}>
          {question}
        </Text>
        <ChevronContainer isOpen={isOpen}>
          <ChevronDown size={20} color="var(--neutral2)" />
        </ChevronContainer>
      </AccordionHeader>
      {isOpen && (
        <AccordionContent>
          <Text variant="body2" color="$neutral2">
            {answer}
          </Text>
        </AccordionContent>
      )}
    </AccordionItemContainer>
  )
}

export function Accordion({ items }: AccordionProps) {
  return (
    <AccordionContainer>
      {items.map((item, index) => (
        <AccordionItem key={index} question={item.question} answer={item.answer} />
      ))}
    </AccordionContainer>
  )
}
