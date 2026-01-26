import { useTranslation } from 'react-i18next'
import { Flex, styled } from 'ui/src'

import { Accordion } from 'pages/Juice/components/Accordion'
import { SectionHeader } from 'pages/Juice/components/SectionHeader'

const Section = styled(Flex, {
  flexDirection: 'column',
  gap: '$spacing32',
  paddingVertical: '$spacing32',
  paddingBottom: '$spacing60',
})

export function FAQ() {
  const { t } = useTranslation()

  const faqItems = [
    {
      question: t('jusd.faq.whatIsJusd.q'),
      answer: t('jusd.faq.whatIsJusd.a'),
    },
    {
      question: t('jusd.faq.howToGet.q'),
      answer: t('jusd.faq.howToGet.a'),
    },
    {
      question: t('jusd.faq.oracleFree.q'),
      answer: t('jusd.faq.oracleFree.a'),
    },
    {
      question: t('jusd.faq.savings.q'),
      answer: t('jusd.faq.savings.a'),
    },
    {
      question: t('jusd.faq.collateral.q'),
      answer: t('jusd.faq.collateral.a'),
    },
    {
      question: t('jusd.faq.liquidation.q'),
      answer: t('jusd.faq.liquidation.a'),
    },
    {
      question: t('jusd.faq.peg.q'),
      answer: t('jusd.faq.peg.a'),
    },
    {
      question: t('jusd.faq.difference.q'),
      answer: t('jusd.faq.difference.a'),
    },
    {
      question: t('jusd.faq.chains.q'),
      answer: t('jusd.faq.chains.a'),
    },
  ]

  return (
    <Section id="faq">
      <SectionHeader title={t('jusd.faq.title')} />
      <Accordion items={faqItems} />
    </Section>
  )
}
