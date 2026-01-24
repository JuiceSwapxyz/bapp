import { useTranslation } from 'react-i18next'
import { Flex, styled } from 'ui/src'

import { Accordion } from '../components/Accordion'
import { SectionHeader } from '../components/SectionHeader'

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
      question: t('juice.faq.howToGet.q'),
      answer: t('juice.faq.howToGet.a'),
    },
    {
      question: t('juice.faq.fees.q'),
      answer: t('juice.faq.fees.a'),
    },
    {
      question: t('juice.faq.voting.q'),
      answer: t('juice.faq.voting.a'),
    },
    {
      question: t('juice.faq.difference.q'),
      answer: t('juice.faq.difference.a'),
    },
    {
      question: t('juice.faq.risk.q'),
      answer: t('juice.faq.risk.a'),
    },
    {
      question: t('juice.faq.flashLoan.q'),
      answer: t('juice.faq.flashLoan.a'),
    },
    {
      question: t('juice.faq.kamikaze.q'),
      answer: t('juice.faq.kamikaze.a'),
    },
    {
      question: t('juice.faq.chains.q'),
      answer: t('juice.faq.chains.a'),
    },
    {
      question: t('juice.faq.swapUsage.q'),
      answer: t('juice.faq.swapUsage.a'),
    },
  ]

  return (
    <Section id="faq">
      <SectionHeader title={t('juice.faq.title')} />
      <Accordion items={faqItems} />
    </Section>
  )
}
